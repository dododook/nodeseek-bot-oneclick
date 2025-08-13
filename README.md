# NodeSeek  Telegram Bot · 一键 Docker 部署（修正版）

> 只需输入 **Bot 令牌** 和 **管理员 ID**，其他全部自动完成：安装/配置 Docker、生成目录与密钥、写入 `.env` & `docker-compose.yml`、拉取镜像并启动。  
> 镜像：`yaoguangting/nodeseek-bot:latest` · 一键脚本仓库：`dododook/nodeseek-bot-oneclick`

---

## 一键安装（交互式，推荐）

> 为了确保能正常提示输入，请使用 **进程替换**，不要用 `curl ... | bash`。

```bash
bash <(curl -fsSL https://raw.githubusercontent.com/dododook/nodeseek-bot-oneclick/main/install.sh)
```
安装过程中会提示输入：
- `TELEGRAM_BOT_TOKEN`（在 @BotFather 生成）【输入不回显，粘贴后直接回车】
- `ADMIN_IDS`（你的 Telegram 数字 ID，多个用逗号）

> 默认部署目录：`/opt/nodeseek-bot`  
> 默认时区：`Asia/Singapore`（可通过环境变量 `TZ` 覆盖）

---

## 一键安装（非交互，自动化/脚本化）

```bash
curl -fsSL https://raw.githubusercontent.com/dododook/nodeseek-bot-oneclick/main/install.sh |   PROJECT_DIR=/opt/nodeseek-bot   REPO=yaoguangting/nodeseek-bot:latest   TZ=Asia/Singapore   TELEGRAM_BOT_TOKEN="123456:ABC_from_BotFather"   ADMIN_IDS="111111,222222"   bash
```
> 若未显式提供 `DATA_ENCRYPT_KEY/IV`，脚本会自动生成（用于加密 `data.json`/`stats.json`）。  
> **已加固**：就算你误用 `curl | bash`，新脚本也会自动从 `/dev/tty` 读取交互输入；若无 TTY 则给出清晰报错并提示用环境变量传值。

---

## 卸载（保留数据与日志）

```bash
curl -fsSL https://raw.githubusercontent.com/dododook/nodeseek-bot-oneclick/main/uninstall.sh | bash
```
- 仅停止并删除容器，**不会**删除 `data/` 与 `logs/`。

---

## 做了什么（脚本行为）

- 检测/安装 **Docker**（含 **docker compose** 支持）
- 配置 Docker 镜像加速 `mirror.gcr.io`（避免拉取限流 429）
- 创建并持久化目录：`/opt/nodeseek-bot/data`、`/opt/nodeseek-bot/logs`
- 生成 `.env`（写入 Token、管理员 ID、加密密钥、时区）
- 生成 `docker-compose.yml` 并 `up -d` 启动容器
- 将数据/日志目录授权给容器内 `node` 用户（`uid=1000`）

---

## 目录结构（宿主机）

```
/opt/nodeseek-bot
├── .env                # 环境变量（Bot 令牌等）
├── docker-compose.yml  # compose 配置
├── data/
│   ├── data.json       # 账户/配置 加密存储
│   └── stats.json      # 签到统计 加密存储
└── logs/               # 运行日志（容器内映射 /app/logs）
```

---

## 常用命令

```bash
# 查看日志（跟随）
docker compose -f /opt/nodeseek-bot/docker-compose.yml logs -f

# 修改 .env（比如换 Token）后重启
docker compose -f /opt/nodeseek-bot/docker-compose.yml restart

# 停止（保留数据与日志）
docker compose -f /opt/nodeseek-bot/docker-compose.yml down
```

---

## 初次使用（在 Telegram 里）

```
/start
/add 张三=你的NodeSeek cookie
/check
/list
```

> 想要输入框的**命令菜单**：在 @BotFather 执行 `/setcommands`，粘贴：
```
start - 显示帮助
check - 立即签到
add - 添加账号（用户@cookie 或 用户=cookie；多账号用 & 连接）
del - 删除账号（用户名）
mode - 签到模式（true=随机，false=固定）
list - 查看账号列表
log - 查看签到记录
stats - 统计（可选参数：账号名）
```

（如果镜像内已实现 `bot.setMyCommands(...)`，容器启动时也会自动注册菜单。）

---

## 配置项（环境变量）

| 变量名 | 说明 | 必填 | 例子 |
|---|---|---|---|
| `TELEGRAM_BOT_TOKEN` | BotFather 的令牌 | 是 | `123456:ABC-...` |
| `ADMIN_IDS` | 管理员数字 ID，多个用逗号 | 是 | `111111,222222` |
| `DATA_ENCRYPT_KEY` | 32 字节 hex，用于本地数据加密 | 自动生成 | `openssl rand -hex 32` |
| `DATA_ENCRYPT_IV` | 16 字节 hex（迁移到 GCM 前使用） | 自动生成 | `openssl rand -hex 16` |
| `TZ` | 时区 | 否 | `Asia/Singapore` / `Asia/Shanghai` |

> **安全建议**：不要把 Token/密钥提交到 Git；只在服务器上填写 `.env`。

---

## 常见问题（FAQ）

**Q1：`401 Unauthorized`**  
A：Token 错/被撤销。更新 `.env` 的 `TELEGRAM_BOT_TOKEN` → `docker compose restart`。

**Q2：`429 Too Many Requests` 拉取限流**  
A：脚本已配置 `mirror.gcr.io`，仍限流可 `docker login` 后重试。

**Q3：`getaddrinfo EAI_AGAIN api.telegram.org`**  
A：DNS/网络波动，稍等或重启容器。

**Q4：权限 `EACCES` 写文件失败**  
A：确保数据/日志目录属于 `uid=1000`：  
`chown -R 1000:1000 /opt/nodeseek-bot/data /opt/nodeseek-bot/logs`

**Q5：如何更新镜像？**  
```bash
docker pull yaoguangting/nodeseek-bot:latest
docker compose -f /opt/nodeseek-bot/docker-compose.yml up -d
```

---

## 安全与可选加固

- **替换 CBC 为 AES-GCM**：建议将本地数据加密从 AES-CBC 升级到 AES-GCM（随机 IV + AuthTag）。  
- **日志轮转**：用宿主机 crontab 清理 `logs/`（或镜像内置脚本）。  
- **最小权限**：容器内已使用非 root 的 `node` 用户；宿主机目录为最小授权。

> 若你的运行镜像还未集成 AES-GCM 迁移脚本，可在应用仓库加入 `migrate-cbc-to-gcm.js` 并在容器内执行：  
> `docker compose exec nodeseek-bot node migrate-cbc-to-gcm.js`

---

## 免责声明

- 本项目仅用于学习与个人自动化实践。使用前请确认符合目标站点服务条款与当地法律法规，风险自负。
- 请妥善保管你的 Bot Token、密钥与 Cookie，不要泄露到公共渠道。
