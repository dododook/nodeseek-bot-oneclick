// ✅ Nodeseek + V2EX Bot

// ...（前略）省略部分未变内容

bot.onText(/^\/v2exadd\s+(.+)/, async (msg, match) => {
  const uid = msg.from.id;
  const input = match[1].trim();
  const name = `v2ex-${uid}`;
  await loader.save(uid, name, {
    site: 'v2ex',
    cookie: input
  });
  bot.sendMessage(uid, `✅ 已添加 V2EX Cookie：${name}`);
});

bot.onText(/^\/v2ex$/, async (msg) => {
  const uid = msg.from.id;
  const accounts = await loader.load(uid);
  const v2exAccounts = Object.entries(accounts).filter(([_, acc]) => acc.site === 'v2ex');
  if (v2exAccounts.length === 0) {
    return bot.sendMessage(uid, '⚠️ 你还没有绑定任何 V2EX 账号');
  }

  for (const [name, acc] of v2exAccounts) {
    try {
      const r = await v2exCheck(acc.cookie);
      const result = r.ok ? `🎉 ${r.msg}` : `❌ ${r.msg}`;
      bot.sendMessage(uid, `【${name}】${result}`);
    } catch (err) {
      bot.sendMessage(uid, `❌【${name}】签到失败：${err.message}`);
    }
  }
});

bot.onText(/^\/v2exlist$/, async (msg) => {
  const uid = msg.from.id;
  const accounts = await loader.load(uid);
  const entries = Object.entries(accounts).filter(([_, acc]) => acc.site === 'v2ex');

  if (entries.length === 0) {
    return bot.sendMessage(uid, '⚠️ 你还没有绑定任何 V2EX 账号');
  }

  const lines = entries.map(([name, acc], i) => `${i + 1}. ${name} (${acc.site})`);
  return bot.sendMessage(uid, `📋 你已绑定的 V2EX 账号：\n\n${lines.join('\n')}`);
});