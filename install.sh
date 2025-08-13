#!/usr/bin/env bash

set -euo pipefail

PROJECT_DIR="/opt/nodeseek-bot"
IMAGE="yaoguangting/nodeseek-bot:latest"

# Install docker if not present
if ! command -v docker &>/dev/null; then
  echo ">>> Docker not found. Installing..."
  curl -fsSL https://get.docker.com | bash
fi

# Ensure compose plugin
if ! docker compose version &>/dev/null; then
  echo ">>> Installing docker compose plugin..."
  apt-get update -qq
  apt-get install -y docker-compose-plugin
fi

# Configure /etc/docker/daemon.json if not set
DAEMON_FILE="/etc/docker/daemon.json"
if [[ ! -f $DAEMON_FILE ]]; then
  echo '>>> Configure docker daemon.json (mirror + log limits)'
  cat >$DAEMON_FILE <<EOF
{
  "registry-mirrors": ["https://hub-mirror.c.163.com"],
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
  systemctl restart docker
else
  echo ">>> /etc/docker/daemon.json exists; restarting docker"
  systemctl restart docker
fi

# Prepare dir
mkdir -p "$PROJECT_DIR"
cd "$PROJECT_DIR"

echo ">>> Target dir: $PROJECT_DIR"
echo ">>> Using image: $IMAGE"

# Prompt TELEGRAM_BOT_TOKEN & ADMIN_IDS
read -rp "Enter TELEGRAM_BOT_TOKEN: " TOKEN
read -rp "Enter ADMIN_IDS (comma separated, e.g. 123,456): " ADMINS

KEY=$(openssl rand -hex 32)
IV=$(openssl rand -hex 16)

cat > .env <<EOF
TELEGRAM_BOT_TOKEN=$TOKEN
ADMIN_IDS=$ADMINS
DATA_ENCRYPT_KEY=$KEY
DATA_ENCRYPT_IV=$IV
TZ=Asia/Shanghai
EOF

# Create docker-compose.yml
cat > docker-compose.yml <<YAML
services:
  nodeseek-bot:
    image: $IMAGE
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - TZ=Asia/Shanghai
    volumes:
      - ./data/data.json:/app/data.json
      - ./data/stats.json:/app/stats.json
      - ./logs:/app/logs
    restart: unless-stopped
YAML

# Prepare host files
mkdir -p data logs
[[ -f data/data.json ]] || echo '{}' > data/data.json
[[ -f data/stats.json ]] || echo '{}' > data/stats.json
chown -R 1000:1000 data logs || true

# Pull + start
echo ">>> Pull & start $IMAGE"
docker compose up -d

cat <<EOF
>>> ✅ Done. You can now:
- Add cookie via /v2exadd
- Trigger via /v2ex
- Auto run at 8:00 daily
- View logs: docker compose logs -f

EOF