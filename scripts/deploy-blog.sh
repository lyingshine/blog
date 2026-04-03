#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/home/ubuntu/myself"
BRANCH="main"
GIT_REPO="https://github.com/lyingshine/myself.git"
WEB_ROOT="/opt/1panel/www/sites/myself/index"
PM2_NAME="myself"

ENV_FILE="$APP_DIR/server/.env"
ENV_BAK="/tmp/myself.server.env.bak"

echo "[deploy] start $(date '+%F %T')"

mkdir -p "$APP_DIR"

# Allow git operations when repository owner differs from current runner user.
git config --global --add safe.directory "$APP_DIR" || true

# Backup .env to avoid overwrite by reset.
if [ -f "$ENV_FILE" ]; then
  cp "$ENV_FILE" "$ENV_BAK"
fi

if [ ! -d "$APP_DIR/.git" ]; then
  echo "[deploy] first clone from github..."
  rm -rf "$APP_DIR"
  git clone --depth=1 -b "$BRANCH" "$GIT_REPO" "$APP_DIR"
else
  echo "[deploy] update from github..."
  cd "$APP_DIR"
  git remote set-url origin "$GIT_REPO"
  git fetch --depth=1 origin "$BRANCH"
  git reset --hard "origin/$BRANCH"
fi

# Restore .env.
if [ -f "$ENV_BAK" ]; then
  mkdir -p "$(dirname "$ENV_FILE")"
  cp "$ENV_BAK" "$ENV_FILE"
  rm -f "$ENV_BAK"
fi

cd "$APP_DIR"

# Cleanup dependencies to avoid EACCES leftovers.
rm -rf node_modules server/node_modules || true

echo "[deploy] install root deps..."
npm ci --include=dev

echo "[deploy] install server deps..."
cd "$APP_DIR/server"
npm ci

echo "[deploy] ensure uploads dir..."
mkdir -p "$APP_DIR/server/uploads/avatars"

echo "[deploy] build frontend..."
cd "$APP_DIR"
npm run build

echo "[deploy] publish frontend to $WEB_ROOT ..."
mkdir -p "$WEB_ROOT"
chmod -R u+rwX "$WEB_ROOT" || true
find "$WEB_ROOT" -mindepth 1 -maxdepth 1 -exec rm -rf {} + || true
cp -r "$APP_DIR/dist/"* "$WEB_ROOT"/

echo "[deploy] restart backend..."
if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start "$APP_DIR/server/index.js" --name "$PM2_NAME"
fi

echo "[deploy] backend state:"
pm2 ls | sed -n '1,20p'

pm2 save
echo "[deploy] done $(date '+%F %T')"
