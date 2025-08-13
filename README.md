# 🤖 NodeSeek & V2EX Telegram 签到机器人一键部署

支持 Telegram Bot 自动完成 [Nodeseek](https://www.nodeseek.com) 与 [V2EX](https://www.v2ex.com) 的每日签到。

---

## ✨ 功能简介

- ✅ Nodeseek 支持绑定多个账号，自动每日签到
- ✅ V2EX 支持绑定多个 A2 Cookie，自动每日领取登录奖励
- ✅ 支持 Docker 一键部署，内置定时任务
- ✅ 所有账号信息本地 AES 加密，数据不外传
- ✅ Telegram Bot 支持指令控制、日志查看

---

## 🚀 一键部署

确保你使用的是 Debian / Ubuntu 服务器。SSH 登录后运行：

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/dododook/nodeseek-bot-oneclick/main/install.sh)
```

按提示输入：

- `TELEGRAM_BOT_TOKEN`: 从 @BotFather 获取的机器人令牌
- `ADMIN_IDS`: 管理员 Telegram ID（多个用英文逗号隔开）

部署完成后，Bot 会自动上线，支持以下指令👇

---

## 📌 Telegram Bot 指令

### 📍 Nodeseek 相关

```
/add 用户名@cookie1;cookie2
/del 用户名
/list             # 查看已添加账号
/check            # 手动签到一次
/stats            # 查看签到统计
/log              # 查看签到记录
/mode true|false  # 是否启用随机签到时间
```

### 📍 V2EX 相关

```
/v2exadd 用户名@A2=xxxx
/v2exdel 用户名
/v2ex             # 立即执行 V2EX 签到
```

> ✅ 注意：V2EX 仅使用 `A2` Cookie 字段，复制浏览器 Cookie 时请完整粘贴

---

## 🛠 文件说明

| 文件名          | 说明                       |
|------------------|----------------------------|
| `install.sh`      | 一键部署脚本                |
| `bot.js`          | 主程序（含 Nodeseek + V2EX） |
| `v2ex.js`         | V2EX 签到逻辑               |
| `v2ex-check.js`   | 单次测试 V2EX 签到用         |
| `.env`            | 环境变量，含 token、密钥等     |
| `data/`           | 加密存储账号数据             |
| `logs/`           | 每日签到日志                 |

---

## 🔁 卸载方式

```bash
bash uninstall.sh
```

---

## 🧠 常见问题

**Q: Cookie 怎么获取？**  
A: 登录对应网站，按 F12 打开开发者工具，在「网络 (Network)」或「应用 (Application)」里找到 Cookie，复制整段。

**Q: 会不会上传账号信息？安全吗？**  
A: 所有数据保存在本地，并使用环境变量中提供的 AES 密钥进行加密，Bot 不上传任何信息。

---

## 💡 鸣谢

- [@dododook](https://github.com/dododook) - 项目维护者
- [@yaoguangting](https://t.me/yaoguangting) - 签到逻辑贡献者

---

## 📜 License

MIT