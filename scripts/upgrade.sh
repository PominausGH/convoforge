#!/bin/bash
set -e

COMPOSE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$COMPOSE_DIR"

echo "=== ConvoForge Upgrade ==="
echo "Directory: $COMPOSE_DIR"
echo ""

# Capture current commit before pull
BEFORE=$(git rev-parse HEAD)

echo "[1/4] Pulling latest code (stashing local changes temporarily)..."
git pull --autostash origin main
echo ""

# Check if code actually changed
AFTER=$(git rev-parse HEAD)
if [ "$BEFORE" = "$AFTER" ]; then
  echo "No new commits — forcing rebuild anyway..."
  BUILD_FLAGS="--no-cache"
else
  echo "New commits detected — rebuilding..."
  BUILD_FLAGS=""
fi

echo "[2/4] Building images..."
docker compose build $BUILD_FLAGS
echo ""

echo "[3/4] Restarting containers..."
docker compose up -d
echo ""

echo "[4/4] Running database migrations..."
docker exec cf_api alembic upgrade head
echo ""

echo "=== Done ==="
docker compose ps
