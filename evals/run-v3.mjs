import { readFile, writeFile } from "node:fs/promises";

const API_URL = "https://s68pp1b4tb69l0tuft5os.apigateway-cn-beijing.volceapi.com/api/chat";
const ORIGIN = "https://xingfei686-dot.github.io";
const cases = JSON.parse(await readFile(new URL("./cases.json", import.meta.url), "utf8"));
const previous = JSON.parse(await readFile(new URL("./raw-results.json", import.meta.url), "utf8"));

function promptV3(c) {
  return `你是严谨的旅行规划助手。只返回一个紧凑、合法、可直接 JSON.parse 的 JSON 对象；禁止 Markdown、代码围栏、注释和 JSON 外文字。
固定结构：{"summary":"不超过60字","days":[{"day":1,"title":"不超过12字","activities":[{"time":"09:00","title":"不超过16字","place":"真实可检索地点","detail":"不超过45字的交通天气提醒","cost":120}]}]}。

必须同时满足：
1. 精确生成 ${c.days} 天，day 从1连续编号；每天2–4个活动，不得多也不得少；
2. 每项包含 time/title/place/detail/cost；time 为 HH:mm；所有文字必须使用双引号且正确转义；
3. cost 统一为人民币 CNY，是 ${c.travelers} 位旅客合计费用，不是当地货币、不是人均价；全部 cost 总和不得超过活动餐饮预算 ${c.activityBudget} 元；若预算紧张，优先免费地点和经济餐饮；
4. 同日地点按同一区域聚类，活动间留出交通时间，避免折返和不必要跨区；
5. 严格按逐日天气安排。暴雨/大风/极端温度优先室内；天气未知时在 detail 提醒出发前确认并给出灵活备选；
6. 严格满足特别偏好。冲突时优先安全、预算和可执行性，并在 summary 中说明取舍；
7. 地点必须真实且属于 ${c.city}。优先使用已知地点，禁止编造店铺、地址和开放时间；
8. 长行程保持字段简洁，避免输出被截断；
9. 输出前静默核对：天数、每天活动数、字段、JSON语法、CNY费用总和、城市、路线、天气。不要输出核对过程。

目的地：${c.city}
总预算：${c.totalBudget}元；活动餐饮预算：${c.activityBudget}元
人数：${c.travelers}
节奏：${c.style}
偏好：${c.preference}
逐日天气：${JSON.stringify(c.weather)}
已知地点：${JSON.stringify(c.places)}`;
}

function extractJson(text) {
  const clean = String(text || "").replace(/```json|```/gi, "").trim();
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start < 0 || end <= start) throw new Error("no JSON object");
  return JSON.parse(clean.slice(start, end + 1));
}

function autoScore(c, raw) {
  let parsed;
  try { parsed = extractJson(raw); } catch (error) { return { parsed: null, parseSuccess: false, structureScore: 0, budgetScore: 0, activityCost: null, structureIssues: [String(error)] }; }
  const issues = [];
  const days = Array.isArray(parsed.days) ? parsed.days : [];
  if (!Array.isArray(parsed.days)) issues.push("days不是数组");
  if (days.length !== c.days) issues.push(`天数${days.length}!=${c.days}`);
  for (let i = 0; i < days.length; i++) {
    const day = days[i] || {};
    if (Number(day.day) !== i + 1) issues.push(`第${i + 1}天编号错误`);
    if (!String(day.title || "").trim()) issues.push(`第${i + 1}天缺title`);
    if (!Array.isArray(day.activities) || day.activities.length < 2 || day.activities.length > 4) issues.push(`第${i + 1}天活动数量错误`);
    for (const [j, a] of (Array.isArray(day.activities) ? day.activities : []).entries()) {
      if (!/^\d{2}:\d{2}$/.test(String(a.time || ""))) issues.push(`D${i + 1}A${j + 1}时间无效`);
      for (const f of ["title", "place", "detail"]) if (!String(a[f] || "").trim()) issues.push(`D${i + 1}A${j + 1}缺${f}`);
      if (!Number.isFinite(Number(a.cost)) || Number(a.cost) < 0) issues.push(`D${i + 1}A${j + 1}费用无效`);
    }
  }
  const activityCost = days.flatMap((d) => Array.isArray(d.activities) ? d.activities : []).reduce((s, a) => s + (Number(a.cost) || 0), 0);
  const ratio = activityCost / c.activityBudget;
  return { parsed, parseSuccess: true, structureScore: issues.length ? 1 : 2, budgetScore: ratio <= 1 ? 2 : ratio <= 1.1 ? 1 : 0, activityCost, budgetRatio: ratio, structureIssues: issues };
}

async function callModel(question, context, timeoutMs = 100000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json", Origin: ORIGIN }, body: JSON.stringify({ question, context }), signal: controller.signal });
    const data = await response.json();
    if (!response.ok || !data.answer) throw new Error(data.error || `HTTP ${response.status}`);
    return data.answer;
  } finally { clearTimeout(timer); }
}

async function generateV3(c) {
  const start = Date.now();
  try {
    const raw = await callModel(promptV3(c), { testCaseId: c.id, promptVersion: "v3", city: c.city, travelers: c.travelers, totalBudget: c.totalBudget, activityBudget: c.activityBudget, weather: c.weather, places: c.places });
    return { version: "v3", raw, latencyMs: Date.now() - start, error: null, ...autoScore(c, raw) };
  } catch (error) { return { version: "v3", raw: "", latencyMs: Date.now() - start, error: String(error), parsed: null, parseSuccess: false, structureScore: 0, budgetScore: 0, activityCost: null, structureIssues: [String(error)] }; }
}

function judgePrompt(c, v1, v3) {
  return `你是严格的旅行产品评测员。只返回合法JSON：{"v1":{"placeScore":0,"routeScore":0,"weatherScore":0,"issues":["问题"]},"v3":{"placeScore":0,"routeScore":0,"weatherScore":0,"issues":["问题"]}}。
仅按0/1/2评分：地点真实性2=全部可信且属目标城市，1=一个可疑，0=多个错误；路线合理性2=同日集中且可执行，1=一次远距或绕路，0=多次不合理；天气适配2=逐日适配且恶劣天气有室内/提醒，1=部分遗漏，0=忽略。天气未知时，若明确提醒确认并提供灵活备选可得2。不要因文案长而加分，不确定地点从严。
测试条件：${JSON.stringify(c)}
V1：${JSON.stringify(v1.parsed)}
V3：${JSON.stringify(v3.parsed)}`;
}

async function evaluate(c, old) {
  const v1 = old.v1;
  const v3 = await generateV3(c);
  let judge = null;
  try { judge = extractJson(await callModel(judgePrompt(c, v1, v3), { task: "v1_v3_rubric", testCaseId: c.id }, 70000)); } catch (error) { judge = { error: String(error) }; }
  for (const [key, row] of [["v1", v1], ["v3", v3]]) {
    const j = judge?.[key] || {};
    row.placeScore = Number.isInteger(j.placeScore) ? j.placeScore : 0;
    row.routeScore = Number.isInteger(j.routeScore) ? j.routeScore : 0;
    row.weatherScore = Number.isInteger(j.weatherScore) ? j.weatherScore : 0;
    row.judgeIssues = Array.isArray(j.issues) ? j.issues.filter(Boolean) : [judge?.error || "评审失败"];
    row.totalScore = row.structureScore + row.budgetScore + row.placeScore + row.routeScore + row.weatherScore;
    row.usable = row.structureScore === 2 && row.totalScore >= 8 && [row.budgetScore, row.placeScore, row.routeScore, row.weatherScore].every((x) => x > 0);
  }
  return { case: c, v1, v3, judgeRaw: judge };
}

async function pool(items, concurrency, worker) {
  const out = new Array(items.length); let next = 0;
  async function runner() { while (true) { const i = next++; if (i >= items.length) return; out[i] = await worker(items[i], previous[i]); console.log(`[${i + 1}/${items.length}] ${items[i].id}`); } }
  await Promise.all(Array.from({ length: concurrency }, runner)); return out;
}

function summarize(rows, key) {
  const a = rows.map((r) => r[key]); const n = a.length; const avg = (f) => a.reduce((s, r) => s + (Number(r[f]) || 0), 0) / n;
  return { sampleSize: n, requestSuccessRate: a.filter((r) => !r.error).length / n, parseSuccessRate: a.filter((r) => r.parseSuccess).length / n, structureSuccessRate: a.filter((r) => r.structureScore === 2).length / n, budgetComplianceRate: a.filter((r) => r.budgetScore === 2).length / n, usableRate: a.filter((r) => r.usable).length / n, averageTotalScore: avg("totalScore"), averagePlaceScore: avg("placeScore"), averageRouteScore: avg("routeScore"), averageWeatherScore: avg("weatherScore"), averageLatencyMs: avg("latencyMs") };
}

const results = await pool(cases, 3, evaluate);
const summary = { generatedAt: new Date().toISOString(), methodology: "Same 30 fixed cases; V1 outputs reused from baseline; one V3 generation per case; deterministic structure/budget; rubric judge plus manual spot-check required", v1: summarize(results, "v1"), v3: summarize(results, "v3"), cases: results.map((r) => ({ id: r.case.id, split: r.case.split, category: r.case.category, v1: { structureScore: r.v1.structureScore, budgetScore: r.v1.budgetScore, placeScore: r.v1.placeScore, routeScore: r.v1.routeScore, weatherScore: r.v1.weatherScore, totalScore: r.v1.totalScore, usable: r.v1.usable, activityCost: r.v1.activityCost, issues: [...(r.v1.structureIssues || []), ...(r.v1.judgeIssues || [])] }, v3: { structureScore: r.v3.structureScore, budgetScore: r.v3.budgetScore, placeScore: r.v3.placeScore, routeScore: r.v3.routeScore, weatherScore: r.v3.weatherScore, totalScore: r.v3.totalScore, usable: r.v3.usable, activityCost: r.v3.activityCost, issues: [...(r.v3.structureIssues || []), ...(r.v3.judgeIssues || [])] } })) };
await writeFile(new URL("./raw-results-v3.json", import.meta.url), JSON.stringify(results, null, 2));
await writeFile(new URL("./evaluation-summary-v3.json", import.meta.url), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

