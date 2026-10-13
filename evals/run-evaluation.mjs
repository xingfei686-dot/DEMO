import { readFile, writeFile } from "node:fs/promises";

const API_URL = "https://s68pp1b4tb69l0tuft5os.apigateway-cn-beijing.volceapi.com/api/chat";
const cases = JSON.parse(await readFile(new URL("./cases.json", import.meta.url), "utf8"));

function promptV1(c) {
  return `请为用户生成一份可以直接执行的旅行行程。只返回 JSON，不要 Markdown。格式：{"summary":"一句话规划说明","days":[{"day":1,"title":"当天主题","activities":[{"time":"09:00","title":"活动名称","place":"可地图检索的具体地点","detail":"推荐理由、交通或预约提醒","cost":120}]}]}。必须生成 ${c.days} 天，每天 2–4 个活动；地点真实、同一天尽量顺路；总活动与餐饮费用应适配预算，住宿和交通另计；结合天气调整室内外安排。目的地：${c.city}；人数：${c.travelers}；总预算：¥${c.totalBudget}；节奏：${c.style}；特别偏好：${c.preference}；联网天气：${c.weather.join("；")}；可参考地点：${c.places.join("、") || "无"}。`;
}

function promptV2(c) {
  return `你是严谨的旅行规划助手。请生成可执行行程，只返回一个合法 JSON 对象，不要 Markdown、解释或代码围栏。
输出格式固定为：{"summary":"说明如何满足预算、天气和偏好，并说明必要取舍","days":[{"day":1,"title":"当天主题","activities":[{"time":"09:00","title":"活动名称","place":"地图可检索的真实具体地点","detail":"推荐理由、交通、预约、天气或无障碍提醒","cost":120}]}]}。
硬性约束：
1. 必须生成 ${c.days} 天，每天 2–4 个活动，day 从 1 连续编号；
2. 每个活动必须包含 time、title、place、detail、cost，time 使用 HH:mm，cost 为非负整数；
3. 总预算 ¥${c.totalBudget}，其中住宿和交通已预留，所有活动与餐饮 cost 之和不得超过 ¥${c.activityBudget}；
4. 同一天优先安排同一区域地点，避免折返，活动之间预留合理交通时间；
5. 按每天的天气调整室内外活动；降雨、高温、低温或大风时写明应对方式，必要时提供室内替代；
6. 必须满足特别偏好。条件冲突时优先安全、预算和可执行性，并在 summary 说明取舍；
7. 地点必须真实且位于 ${c.city}。优先参考已知地点；若不确定具体 POI，使用可检索的区域级地点，不得编造；
8. 输出前自行检查天数、字段、费用总和、地点所在城市、每日路线和天气适配，但不要输出检查过程。
目的地：${c.city}
人数：${c.travelers}
旅行节奏：${c.style}
特别偏好：${c.preference}
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
  try { parsed = extractJson(raw); } catch (error) {
    return { parsed: null, parseSuccess: false, structureScore: 0, budgetScore: 0, activityCost: null, structureIssues: [String(error)] };
  }
  const issues = [];
  if (!Array.isArray(parsed.days)) issues.push("days不是数组");
  const days = Array.isArray(parsed.days) ? parsed.days : [];
  if (days.length !== c.days) issues.push(`天数${days.length}!=${c.days}`);
  for (let i = 0; i < days.length; i++) {
    const day = days[i] || {};
    if (Number(day.day) !== i + 1) issues.push(`第${i + 1}天编号错误`);
    if (!String(day.title || "").trim()) issues.push(`第${i + 1}天缺title`);
    if (!Array.isArray(day.activities) || day.activities.length < 2 || day.activities.length > 4) issues.push(`第${i + 1}天活动数量错误`);
    for (const [j, a] of (Array.isArray(day.activities) ? day.activities : []).entries()) {
      if (!/^\d{2}:\d{2}$/.test(String(a.time || ""))) issues.push(`D${i + 1}A${j + 1}时间无效`);
      for (const field of ["title", "place", "detail"]) if (!String(a[field] || "").trim()) issues.push(`D${i + 1}A${j + 1}缺${field}`);
      if (!Number.isFinite(Number(a.cost)) || Number(a.cost) < 0) issues.push(`D${i + 1}A${j + 1}费用无效`);
    }
  }
  const activityCost = days.flatMap((d) => Array.isArray(d.activities) ? d.activities : []).reduce((sum, a) => sum + (Number(a.cost) || 0), 0);
  const ratio = c.activityBudget > 0 ? activityCost / c.activityBudget : Infinity;
  const budgetScore = ratio <= 1 ? 2 : ratio <= 1.1 ? 1 : 0;
  return { parsed, parseSuccess: true, structureScore: issues.length === 0 ? 2 : 1, budgetScore, activityCost, budgetRatio: ratio, structureIssues: issues };
}

async function callModel(question, context, timeoutMs = 100000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(API_URL, { method: "POST", headers: { "Content-Type": "application/json", "Origin": "https://xingfei686-dot.github.io" }, body: JSON.stringify({ question, context }), signal: controller.signal });
    const data = await response.json();
    if (!response.ok || !data.answer) throw new Error(data.error || `HTTP ${response.status}`);
    return data.answer;
  } finally { clearTimeout(timer); }
}

async function generate(c, version) {
  const question = version === "v1" ? promptV1(c) : promptV2(c);
  const context = { testCaseId: c.id, city: c.city, travelers: c.travelers, totalBudget: c.totalBudget, activityBudget: c.activityBudget, style: c.style, preference: c.preference, weather: c.weather, places: c.places, promptVersion: version };
  const startedAt = Date.now();
  try {
    const raw = await callModel(question, context);
    return { version, raw, latencyMs: Date.now() - startedAt, error: null, ...autoScore(c, raw) };
  } catch (error) {
    return { version, raw: "", latencyMs: Date.now() - startedAt, error: String(error), parsed: null, parseSuccess: false, structureScore: 0, budgetScore: 0, activityCost: null, structureIssues: [String(error)] };
  }
}

function judgePrompt(c, v1, v2) {
  return `你是旅行产品质量评测员。请根据统一标准对同一测试用例的 V1、V2 行程评分。只返回合法 JSON，不要 Markdown。
格式：{"v1":{"placeScore":0,"routeScore":0,"weatherScore":0,"issues":["问题"]},"v2":{"placeScore":0,"routeScore":0,"weatherScore":0,"issues":["问题"]}}。
评分只能为0、1、2：
- 地点真实性：2=地点具体、可信且属于目标城市；1=有1个模糊或可疑地点；0=多个虚构、错城或不可检索地点。
- 路线合理性：2=同日地点基本集中、时间顺序可执行、无明显折返；1=存在一次远距离移动或局部绕路；0=多次跨区折返或时间明显不可能。
- 天气适配度：2=逐日安排符合天气，恶劣天气有合理室内安排或提醒；1=部分适配但仍有明显遗漏；0=忽略恶劣天气。晴天若无冲突可得2分。
不要因为文案详细而加分。地点不确定时从严评分。测试条件：${JSON.stringify(c)}
V1行程：${JSON.stringify(v1.parsed)}
V2行程：${JSON.stringify(v2.parsed)}`;
}

async function evaluateCase(c) {
  const v1 = await generate(c, "v1");
  const v2 = await generate(c, "v2");
  let judge = null;
  if (v1.parsed || v2.parsed) {
    try { judge = extractJson(await callModel(judgePrompt(c, v1, v2), { task: "rubric_evaluation", testCaseId: c.id }, 70000)); }
    catch (error) { judge = { error: String(error) }; }
  }
  for (const [key, result] of [["v1", v1], ["v2", v2]]) {
    const j = judge?.[key] || {};
    result.placeScore = Number.isInteger(j.placeScore) ? j.placeScore : 0;
    result.routeScore = Number.isInteger(j.routeScore) ? j.routeScore : 0;
    result.weatherScore = Number.isInteger(j.weatherScore) ? j.weatherScore : 0;
    result.judgeIssues = Array.isArray(j.issues) ? j.issues : [judge?.error || "评审失败"];
    result.totalScore = result.structureScore + result.budgetScore + result.placeScore + result.routeScore + result.weatherScore;
    result.usable = result.structureScore === 2 && result.totalScore >= 8 && [result.budgetScore, result.placeScore, result.routeScore, result.weatherScore].every((score) => score > 0);
  }
  return { case: c, v1, v2, judgeRaw: judge };
}

async function runPool(items, concurrency, worker) {
  const results = new Array(items.length);
  let next = 0;
  async function runner() {
    while (true) {
      const index = next++;
      if (index >= items.length) return;
      results[index] = await worker(items[index]);
      console.log(`[${index + 1}/${items.length}] ${items[index].id} complete`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, runner));
  return results;
}

function summarize(results, key) {
  const rows = results.map((r) => r[key]);
  const n = rows.length;
  const avg = (field) => rows.reduce((sum, row) => sum + (Number(row[field]) || 0), 0) / n;
  return {
    sampleSize: n,
    requestSuccessRate: rows.filter((r) => !r.error).length / n,
    parseSuccessRate: rows.filter((r) => r.parseSuccess).length / n,
    structureSuccessRate: rows.filter((r) => r.structureScore === 2).length / n,
    budgetComplianceRate: rows.filter((r) => r.budgetScore === 2).length / n,
    usableRate: rows.filter((r) => r.usable).length / n,
    averageTotalScore: avg("totalScore"),
    averagePlaceScore: avg("placeScore"),
    averageRouteScore: avg("routeScore"),
    averageWeatherScore: avg("weatherScore"),
    averageLatencyMs: avg("latencyMs"),
  };
}

const results = await runPool(cases, 3, evaluateCase);
const summary = {
  generatedAt: new Date().toISOString(),
  methodology: "30 fixed cases; one generation per prompt version; deterministic structure/budget checks; rubric-based model judge for place/route/weather; manual spot-check required before publication",
  v1: summarize(results, "v1"),
  v2: summarize(results, "v2"),
  cases: results.map((r) => ({ id: r.case.id, split: r.case.split, category: r.case.category, v1: { structureScore: r.v1.structureScore, budgetScore: r.v1.budgetScore, placeScore: r.v1.placeScore, routeScore: r.v1.routeScore, weatherScore: r.v1.weatherScore, totalScore: r.v1.totalScore, usable: r.v1.usable, activityCost: r.v1.activityCost, issues: [...r.v1.structureIssues, ...r.v1.judgeIssues] }, v2: { structureScore: r.v2.structureScore, budgetScore: r.v2.budgetScore, placeScore: r.v2.placeScore, routeScore: r.v2.routeScore, weatherScore: r.v2.weatherScore, totalScore: r.v2.totalScore, usable: r.v2.usable, activityCost: r.v2.activityCost, issues: [...r.v2.structureIssues, ...r.v2.judgeIssues] } }))
};

await writeFile(new URL("./raw-results.json", import.meta.url), JSON.stringify(results, null, 2));
await writeFile(new URL("./evaluation-summary.json", import.meta.url), JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary, null, 2));

