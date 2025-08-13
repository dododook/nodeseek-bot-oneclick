#!/usr/bin/env bash
set -euo pipefail
PROJECT_DIR="${PROJECT_DIR:-/opt/nodeseek-bot}"

if docker compose version >/dev/null 2>&1; then
  DC="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  DC="docker-compose"
else
  echo "ERROR: docker compose is required." >&2
  exit 1
fi

if [[ -f "$PROJECT_DIR/docker-compose.yml" ]]; then
  (cd "$PROJECT_DIR" && ($DC down || true))
fi

echo "Containers stopped. Data & logs preserved under $PROJECT_DIR/data and $PROJECT_DIR/logs"
