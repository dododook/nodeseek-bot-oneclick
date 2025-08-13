const TelegramBot = require("node-telegram-bot-api");
const dotenv = require("dotenv");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const cron = require("node-cron");
const { checkinV2EX } = require("./v2ex");

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });
const ADMIN_IDS = (process.env.ADMIN_IDS || "").split(",").map(id => id.trim()).filter(Boolean);
const key = Buffer.from(process.env.DATA_ENCRYPT_KEY, "hex");
const iv = Buffer.from(process.env.DATA_ENCRYPT_IV, "hex");
const DATA_FILE = path.join(__dirname, "data.json");

function encrypt(text) {
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([cipher.update(text, "utf8"), cipher.final()]).toString("hex");
}

function decrypt(hex) {
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([decipher.update(Buffer.from(hex, "hex")), decipher.final()]).toString("utf8");
}

function loadData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// /v2exadd 命令
bot.onText(/^\/v2exadd (.+)/i, (msg, match) => {
  const uid = String(msg.from.id);
  const raw = match[1].trim();
  if (!raw.includes("A2=")) return bot.sendMessage(msg.chat.id, "❌ Cookie 不包含 A2，请检查");

  const data = loadData();
  data.v2ex = data.v2ex || {};
  data.v2ex[uid] = encrypt(raw);
  saveData(data);

  bot.sendMessage(msg.chat.id, "✅ V2EX Cookie 已保存，加密存储");
});

// /v2ex 命令
bot.onText(/^\/v2ex$/i, async (msg) => {
  const uid = String(msg.from.id);
  const data = loadData();
  const encrypted = data.v2ex?.[uid];
  if (!encrypted) return bot.sendMessage(msg.chat.id, "❌ 未添加 V2EX Cookie，请先用 /v2exadd");

  const cookie = decrypt(encrypted);
  const res = await checkinV2EX({ cookie });

  let status = res.ok ? "✅" : "❌";
  let code = res.code === "ALREADY" || res.code === "ALREADY_AFTER" ? "✅ V2EX 今天已领" :
             res.code === "CLAIMED" ? "✅ V2EX 已领取" :
             res.msg || "❌ 未知状态";
  bot.sendMessage(msg.chat.id, `${status} ${code}`);
});

// 自动签到定时任务（每天 8:00）
cron.schedule("0 8 * * *", async () => {
  const data = loadData();
  const v2exMap = data.v2ex || {};
  for (const [uid, encrypted] of Object.entries(v2exMap)) {
    try {
      const cookie = decrypt(encrypted);
      const res = await checkinV2EX({ cookie });
      console.log(`[V2EX定时] ${uid}: ${res.code}`);
    } catch (e) {
      console.error(`[V2EX定时] ${uid}: 失败`, e.message);
    }
  }
});