#!/usr/bin/env bash
set -euo pipefail

# ===== 固定/可覆盖参数（可用 env 覆盖）=====
PROJECT_DIR="${PROJECT_DIR:-/opt/nodeseek-bot}"
REPO="${REPO:-yaoguangting/nodeseek-bot:latest}"   # 公共镜像
TZ="${TZ:-Asia/Singapore}"

# ===== Helper =====
need_root() { [[ "${EUID:-$(id -u)}" -eq 0 ]]; }
SUDO=""; need_root || SUDO="sudo"

prompt_if_empty() {
  local var="$1"; local prompt="$2"; local secret="${3:-0}"
  if [[ -z "${!var:-}" ]]; then
    if [[ "$secret" == "1" ]]; then read -rsp "$prompt: " tmp; echo
    else read -rp  "$prompt: " tmp
    fi
    export "$var"="$tmp"
  fi
}

# ===== 1) Docker & compose =====
if ! command -v docker >/dev/null 2>&1; then
  echo ">>> Docker not found. Installing..."
  curl -fsSL https://get.docker.com | sh
fi

# 配置镜像加速与Docker日志限制（若无daemon.json则写入）
if ! ${SUDO} test -f /etc/docker/daemon.json; then
  echo ">>> Configure docker daemon.json (mirror + log limits)"
  ${SUDO} mkdir -p /etc/docker
  ${SUDO} bash -c 'cat >/etc/docker/daemon.json <<JSON
{
  "registry-mirrors": ["https://mirror.gcr.io"],
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "3" }
}
JSON'
  ${SUDO} systemctl restart docker
else
  echo ">>> /etc/docker/daemon.json exists; restarting docker"
  ${SUDO} systemctl restart docker || true
fi

# 选择 compose 命令
if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "ERROR: docker compose is required." >&2
  exit 1
fi

# 必备工具
if ! command -v openssl >/dev/null 2>&1; then
  echo ">>> Installing openssl..."
  ${SUDO} apt-get update -y && ${SUDO} apt-get install -y openssl
fi

# ===== 2) 参数（可交互填入，也可通过环境变量预置） =====
echo ">>> Target dir: $PROJECT_DIR"
echo ">>> Using image: $REPO"
export TZ

prompt_if_empty TELEGRAM_BOT_TOKEN "Enter TELEGRAM_BOT_TOKEN" 1
prompt_if_empty ADMIN_IDS "Enter ADMIN_IDS (comma separated, e.g. 123,456)"

: "${DATA_ENCRYPT_KEY:=$(openssl rand -hex 32)}"
: "${DATA_ENCRYPT_IV:=$(openssl rand -hex 16)}"
echo "Generated DATA_ENCRYPT_KEY=$DATA_ENCRYPT_KEY"
echo "Generated DATA_ENCRYPT_IV=$DATA_ENCRYPT_IV"

# ===== 3) 生成目录与配置 =====
${SUDO} mkdir -p "$PROJECT_DIR"/{data,logs}
${SUDO} bash -c "[ -f '$PROJECT_DIR/data/data.json' ]  || echo '{}' > '$PROJECT_DIR/data/data.json'"
${SUDO} bash -c "[ -f '$PROJECT_DIR/data/stats.json' ] || echo '{}' > '$PROJECT_DIR/data/stats.json'"

# docker-compose.yml
${SUDO} bash -c "cat > '$PROJECT_DIR/docker-compose.yml' <<COMPOSE
services:
  nodeseek-bot:
    image: ${REPO}
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - TZ=${TZ}
    volumes:
      - ./data/data.json:/app/data.json
      - ./data/stats.json:/app/stats.json
      - ./logs:/app/logs
    restart: unless-stopped
COMPOSE"

# .env
${SUDO} bash -c "cat > '$PROJECT_DIR/.env' <<ENVVARS
TELEGRAM_BOT_TOKEN=${TELEGRAM_BOT_TOKEN}
ADMIN_IDS=${ADMIN_IDS}
DATA_ENCRYPT_KEY=${DATA_ENCRYPT_KEY}
DATA_ENCRYPT_IV=${DATA_ENCRYPT_IV}
TZ=${TZ}
ENVVARS"

# 宿主机数据/日志授权给容器内 node 用户 (uid=1000)
${SUDO} chown -R 1000:1000 "$PROJECT_DIR/data" "$PROJECT_DIR/logs" || true

# ===== 4) 启动 =====
cd "$PROJECT_DIR"
echo ">>> Pull & start ${REPO}"
$DC up -d

echo ">>> Done."
echo "Follow logs: $DC -f $PROJECT_DIR/docker-compose.yml logs -f || (cd $PROJECT_DIR && $DC logs -f)"
echo "Restart after .env change: (cd $PROJECT_DIR && $DC restart)"
echo "Stop: (cd $PROJECT_DIR && $DC down)"
