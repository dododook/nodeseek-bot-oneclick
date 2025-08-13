// v2ex-check.js — quick CLI to test V2EX check-in without modifying your bot
// Usage:
//   node v2ex-check.js "A2=xxxx; other=cookies"
//   # or
//   COOKIE="A2=xxxx; other=cookies" node v2ex-check.js
//
const { checkinV2EX } = require("./v2ex");

(async () => {
  const cookie = process.argv[2] || process.env.COOKIE || process.env.V2EX_COOKIE || "";
  if (!cookie) {
    console.error("Usage: node v2ex-check.js \"A2=xxxx; ...\"  (or set COOKIE env var)");
    process.exit(2);
  }
  try {
    const res = await checkinV2EX({ cookie });
    console.log(JSON.stringify(res, null, 2));
    process.exit(res.ok ? 0 : 1);
  } catch (e) {
    console.error("Error:", e && e.message || e);
    process.exit(1);
  }
})();
