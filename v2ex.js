// v2ex.js — V2EX daily check-in helper (no extra deps; works on Node 18+/20+)
//
// Usage from another script:
//   const { checkinV2EX } = require("./v2ex");
//   checkinV2EX({ cookie: "A2=xxxx; other=...", userAgent: "Mozilla/5.0 ..." })
//     .then(console.log).catch(console.error);
//
// What it does:
//   1) GET https://www.v2ex.com/mission/daily with your session cookie
//   2) Find redeem link "/mission/daily/redeem?once=123456"
//   3) Request redeem link and report status
//
// Notes:
// - You must capture a valid logged-in cookie from your browser (usually contains A2=...)
// - Token/flow on V2EX might change; adjust selectors if needed.

const DEFAULT_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function fetchText(url, { headers = {}, redirect = "follow", method = "GET" } = {}) {
  const res = await fetch(url, { headers, redirect, method });
  const text = await res.text();
  return { status: res.status, headers: res.headers, text };
}

async function checkinV2EX({ cookie, userAgent = DEFAULT_UA } = {}) {
  if (!cookie) {
    return { ok: false, site: "v2ex", code: "NO_COOKIE", msg: "缺少 V2EX 会话 Cookie（含 A2=...）" };
  }
  const base = "https://www.v2ex.com";
  const headers = {
    "User-Agent": userAgent,
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "zh-CN,zh;q=0.9",
    "Referer": base + "/",
    "Cookie": cookie,
  };

  // Step 1: open daily mission page
  const { status: s1, text: h1 } = await fetchText(base + "/mission/daily", { headers });
  if (s1 === 401 || /请先登录|sign in|未登录/i.test(h1)) {
    return { ok: false, site: "v2ex", code: "NOT_LOGGED_IN", msg: "Cookie 失效或未登录" };
  }

  // Already claimed? (common phrases)
  if (/已领取|已成功领取|每日奖励已领取|明天再来|已完成每日登录奖励/i.test(h1)) {
    return { ok: true, site: "v2ex", code: "ALREADY", msg: "今日已领取或无需领取" };
  }

  // Extract redeem link: /mission/daily/redeem?once=xxxxx
  const m = h1.match(/\/mission\/daily\/redeem\?once=\d+/);
  if (!m) {
    // Sometimes the link is button with once= param elsewhere; try a second pattern
    const m2 = h1.match(/once=(\d+)/);
    if (!m2) {
      return {
        ok: false,
        site: "v2ex",
        code: "NO_REDEEM_LINK",
        msg: "找不到领取链接，页面可能改版或被风控（需要手动查看 /mission/daily）",
      };
    }
  }

  const redeemPath = m ? m[0] : "/mission/daily/redeem?once=" + RegExp.$1;
  // Step 2: hit redeem (avoid auto following to preserve response text)
  const { status: s2, text: h2 } = await fetchText(base + redeemPath, { headers, redirect: "manual" });

  // Success phrases
  if (/成功|已领取|OK|You have received/i.test(h2) || (s2 >= 300 && s2 < 400)) {
    return { ok: true, site: "v2ex", code: "CLAIMED", msg: "领取成功或已领取" };
  }

  // Fallback: check daily page again
  const { text: h3 } = await fetchText(base + "/mission/daily", { headers });
  if (/已领取|已成功领取|每日奖励已领取|明天再来|已完成每日登录奖励/i.test(h3)) {
    return { ok: true, site: "v2ex", code: "ALREADY_AFTER", msg: "领取成功（二次确认）" };
  }

  return { ok: false, site: "v2ex", code: "UNKNOWN", msg: "尝试领取后未检测到成功提示（可能被风控/改版）" };
}

module.exports = { checkinV2EX };
