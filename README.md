# NodeSeek 签到 Bot — 一键 Docker 部署

适用于 **Ubuntu/Debian**（其他 Linux 也大多可用）。默认镜像：`yaoguangting/nodeseek-bot:latest`。

## 一键安装（交互式）
```bash
curl -fsSL https://raw.githubusercontent.com/<YOUR_GITHUB_USER>/<YOUR_REPO>/main/install.sh | bash
```
执行时会提示输入：
- `TELEGRAM_BOT_TOKEN`（@BotFather 获取）
- `ADMIN_IDS`（你的 Telegram 数字ID，多个用逗号）

## 一键安装（非交互）
```bash
curl -fsSL https://raw.githubusercontent.com/<YOUR_GITHUB_USER>/<YOUR_REPO>/main/install.sh |   PROJECT_DIR=/opt/nodeseek-bot   REPO=yaoguangting/nodeseek-bot:latest   TZ=Asia/Singapore   TELEGRAM_BOT_TOKEN="123456:ABC_from_BotFather"   ADMIN_IDS="111111,222222"   bash
```

## 卸载（保留数据与日志）
```bash
curl -fsSL https://raw.githubusercontent.com/<YOUR_GITHUB_USER>/<YOUR_REPO>/main/uninstall.sh | bash
```

## 目录与数据持久化
- 宿主机：`/opt/nodeseek-bot/data/data.json`、`/opt/nodeseek-bot/data/stats.json`、`/opt/nodeseek-bot/logs/`
- 容器内：映射为 `/app/data.json`、`/app/stats.json`、`/app/logs/`

## 常用命令
```bash
# 查看日志
docker compose -f /opt/nodeseek-bot/docker-compose.yml logs -f

# 修改 .env 后重启
docker compose -f /opt/nodeseek-bot/docker-compose.yml restart

# 停止容器（保留数据）
docker compose -f /opt/nodeseek-bot/docker-compose.yml down
```
