const MODEL_ID = "doubao-seed-2-0-mini-260428";
const ARK_URL = "https://ark.cn-beijing.volces.com/api/v3/chat/completions";
const REQUEST_TIMEOUT_MS = 90_000;
const MAX_REQUESTS_PER_MINUTE = 10;
const ALLOWED_ORIGINS = new Set([
  "https://xingfei686-dot.github.io",
  "http://localhost:3000",
]);

const requestsByIp = new Map();

function corsHeaders(origin) {
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://xingfei686-dot.github.io";
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Cache-Control": "no-store",
    "Vary": "Origin",
  };
}

function json(data, status, origin) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json; charset=utf-8" },
  });
}

function isRateLimited(ip) {
  const now = Date.now();
  const windowStart = now - 60_000;
  const recent = (requestsByIp.get(ip) || []).filter((time) => time > windowStart);
  if (recent.length >= MAX_REQUESTS_PER_MINUTE) {
    requestsByIp.set(ip, recent);
    return true;
  }
  recent.push(now);
  requestsByIp.set(ip, recent);
  return false;
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      if (!ALLOWED_ORIGINS.has(origin)) return json({ error: "来源不受信任" }, 403, origin);
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (url.pathname !== "/api/chat" || request.method !== "POST") {
      return json({ error: "接口不存在" }, 404, origin);
    }
    if (!ALLOWED_ORIGINS.has(origin)) return json({ error: "来源不受信任" }, 403, origin);
    if (!env.ARK_API_KEY) return json({ error: "服务端尚未配置 ARK_API_KEY" }, 500, origin);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    if (isRateLimited(ip)) return json({ error: "请求过于频繁，请一分钟后重试" }, 429, origin);

    let payload;
    try {
      payload = await request.json();
    } catch {
      return json({ error: "请求格式不正确" }, 400, origin);
    }

    const question = String(payload?.question || "").trim();
    if (!question) return json({ error: "请输入问题" }, 400, origin);
    if (question.length > 8_000) return json({ error: "问题内容过长" }, 400, origin);

    const context = payload?.context && typeof payload.context === "object"
      ? JSON.stringify(payload.context)
      : "{}";

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const arkResponse = await fetch(ARK_URL, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Authorization": `Bearer ${env.ARK_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: env.DOUBAO_MODEL || MODEL_ID,
          messages: [
            {
              role: "system",
              content: "你是 GoTrip 的旅行规划助手。回答应准确、简洁、可执行；当用户要求 JSON 时必须只输出合法 JSON。",
            },
            {
              role: "user",
              content: `${question}\n\n当前旅行上下文：${context}`,
            },
          ],
          thinking: { type: "disabled" },
          temperature: 0.4,
          max_tokens: 1800,
        }),
      });

      const data = await arkResponse.json();
      if (!arkResponse.ok) {
        const message = data?.error?.message || data?.message || "豆包服务请求失败";
        return json({ error: message }, arkResponse.status, origin);
      }

      const answer = data?.choices?.[0]?.message?.content?.trim();
      if (!answer) return json({ error: "豆包未返回有效内容" }, 502, origin);
      return json({ answer, model: env.DOUBAO_MODEL || MODEL_ID }, 200, origin);
    } catch (error) {
      if (error?.name === "AbortError") return json({ error: "豆包服务响应超过 90 秒" }, 504, origin);
      return json({ error: "豆包服务连接失败" }, 502, origin);
    } finally {
      clearTimeout(timeout);
    }
  },
};
