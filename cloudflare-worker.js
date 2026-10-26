/**
 * ROBOT HQ — Binance Spot Testnet bridge
 * Safe starter: public prices + authenticated testnet account read only.
 * No order placement, no withdrawals, no production Binance endpoint.
 *
 * Cloudflare Worker secrets:
 * BINANCE_API_KEY       (testnet key)
 * BINANCE_API_SECRET    (testnet secret)
 * ROBOT_ACCESS_TOKEN    (long random token used by your private dashboard request)
 */
const ALLOWED_ORIGIN = "https://zecasemedo-hash.github.io";
const BASE = "https://testnet.binance.vision";

function cors(origin) {
  return {
    "Access-Control-Allow-Origin": origin === ALLOWED_ORIGIN ? ALLOWED_ORIGIN : "null",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Robot-Token",
    "Vary": "Origin",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };
}
function json(data, status, origin) {
  return new Response(JSON.stringify(data), { status, headers: cors(origin) });
}
async function sign(query, secret) {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(query));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, "0")).join("");
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors(origin) });
    }
    if (origin && origin !== ALLOWED_ORIGIN) return json({ error: "Origin not allowed" }, 403, origin);
    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") return json({ error: "Method not allowed" }, 405, origin);
      if (!env.ROBOT_ACCESS_TOKEN || request.headers.get("X-Robot-Token") !== env.ROBOT_ACCESS_TOKEN) {
        return json({ error: "Unauthorized: verifica o token privado do ROBOT HQ." }, 401, origin);
      }
      if (!env.AI || typeof env.AI.run !== "function") {
        return json({ error: "Workers AI ainda não está ligado a este Worker. No Cloudflare, adiciona o binding AI com o nome AI." }, 503, origin);
      }
      let body;
      try { body = await request.json(); } catch { return json({ error: "Pedido inválido." }, 400, origin); }
      const messages = Array.isArray(body.messages) ? body.messages.slice(-16) : [];
      if (!messages.length || messages.some(m => !m || !["user","assistant"].includes(m.role) || typeof m.content !== "string")) {
        return json({ error: "A conversa está vazia ou tem formato inválido." }, 400, origin);
      }
      const system = typeof body.system === "string" ? body.system.slice(0, 6000) : "És o assistente do ROBOT HQ. Responde em português de Portugal.";
      try {
        const result = await env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
          messages: [{ role: "system", content: system }, ...messages.map(m => ({ role: m.role, content: m.content.slice(0, 6000) }))],
          max_tokens: 1200
        });
        const response = result && result.response ? result.response : "";
        if (!response) return json({ error: "O modelo não devolveu resposta." }, 502, origin);
        return json({ ok: true, response, model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast" }, 200, origin);
      } catch (error) {
        return json({ error: "Workers AI não conseguiu responder. Verifica se o modelo está disponível e se a conta tem acesso." }, 502, origin);
      }
    }
    if (request.method !== "GET") return json({ error: "Method not allowed" }, 405, origin);

    if (url.pathname === "/health") {
      return json({ ok: true, mode: "SPOT_TESTNET_READ_ONLY", tradingEnabled: false, aiConfigured: !!(env.AI && typeof env.AI.run === "function"), chatEndpoint: "/api/chat" }, 200, origin);
    }
    if (url.pathname === "/api/price") {
      const symbol = (url.searchParams.get("symbol") || "BTCUSDT").toUpperCase();
      if (!/^[A-Z0-9]{5,20}$/.test(symbol)) return json({ error: "Invalid symbol" }, 400, origin);
      const r = await fetch(BASE + "/api/v3/ticker/price?symbol=" + encodeURIComponent(symbol));
      return json(await r.json(), r.ok ? 200 : r.status, origin);
    }
    if (url.pathname === "/api/account") {
      if (!env.ROBOT_ACCESS_TOKEN || request.headers.get("X-Robot-Token") !== env.ROBOT_ACCESS_TOKEN) {
        return json({ error: "Unauthorized" }, 401, origin);
      }
      if (!env.BINANCE_API_KEY || !env.BINANCE_API_SECRET) {
        return json({ error: "Testnet API secrets are not configured in Worker secrets." }, 503, origin);
      }
      const query = "recvWindow=5000&timestamp=" + Date.now();
      const signature = await sign(query, env.BINANCE_API_SECRET);
      const r = await fetch(BASE + "/api/v3/account?" + query + "&signature=" + signature, {
        headers: { "X-MBX-APIKEY": env.BINANCE_API_KEY }
      });
      const body = await r.json();
      if (!r.ok) return json({ error: "Binance Testnet account request failed", details: body }, r.status, origin);
      return json({
        mode: "SPOT_TESTNET_READ_ONLY",
        canPlaceOrders: false,
        balances: (body.balances || []).filter(x => Number(x.free) > 0 || Number(x.locked) > 0)
      }, 200, origin);
    }
    return json({ error: "Not found" }, 404, origin);
  }
};
