#!/bin/bash
# MedZiva Deploy Script
# Usage: ./deploy.sh [staging|production]
#
# Prerequisites:
#   1. SSH access to GoDaddy (enable in GoDaddy cPanel → SSH Access)
#   2. SSH key added to GoDaddy (ssh-copy-id)
#   3. rsync installed (macOS has it by default)
#
# First time setup:
#   chmod +x deploy.sh
#   ./deploy.sh staging    (tests on staging first)
#   ./deploy.sh production (deploys to live site)

set -e

ENV="${1:-staging}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LAST_DEPLOY_DIR="$SCRIPT_DIR/.deploy-state"

# --- Configuration ---
if [ "$ENV" = "staging" ]; then
    REMOTE_HOST="staging.medzivahealthcare.com"
    REMOTE_USER="rvdkqh1z30zk"
    FRONTEND_REMOTE_DIR="/home/$REMOTE_USER/public_html/staging.medzivahealthcare.com"
    BACKEND_REMOTE_DIR="/home/$REMOTE_USER/staging/api"
    BRANCH="develop"
elif [ "$ENV" = "production" ]; then
    REMOTE_HOST="medzivahealthcare.com"
    REMOTE_USER="rvdkqh1z30zk"
    FRONTEND_REMOTE_DIR="/home/$REMOTE_USER/public_html"
    BACKEND_REMOTE_DIR="/home/$REMOTE_USER/public_html/api"
    BRANCH="main"
else
    echo "Usage: ./deploy.sh [staging|production]"
    exit 1
fi

echo "========================================"
echo "  MedZiva Deploy to: $ENV"
echo "  Branch: $BRANCH"
echo "  Host: $REMOTE_HOST"
echo "========================================"
echo ""

# --- Pre-flight checks ---
echo "[1/6] Checking branch..."
CURRENT_BRANCH=$(git branch --show-current)
if [ "$CURRENT_BRANCH" != "$BRANCH" ]; then
    echo "  Wrong branch! Current: $CURRENT_BRANCH, Expected: $BRANCH"
    echo "  Run: git checkout $BRANCH"
    exit 1
fi
echo "  Branch OK: $BRANCH"
echo ""

# --- Pull latest ---
echo "[2/6] Pulling latest changes..."
git pull origin "$BRANCH"
echo ""

# --- Build frontend ---
echo "[3/6] Building frontend..."
cd "$SCRIPT_DIR/med21"

# Copy environment file for target
if [ "$ENV" = "staging" ]; then
    cp .env.staging .env
else
    cp .env.production .env
fi

npm run build
echo "  Frontend built to med21/dist/"
cd "$SCRIPT_DIR"
echo ""

# --- Prepare backend ---
echo "[4/6] Preparing backend..."
cd "$SCRIPT_DIR/med21-laravel"

# Copy environment file for target
if [ "$ENV" = "staging" ]; then
    cp .env.staging .env
else
    cp .env.production .env
fi

# Install production dependencies
composer install --no-dev --optimize-autoloader --no-interaction
echo "  Backend ready"
cd "$SCRIPT_DIR"
echo ""

# --- Deploy via rsync ---
echo "[5/6] Deploying to $REMOTE_HOST..."
echo "  This will only upload CHANGED files (incremental)."
echo ""

# Deploy frontend (React dist)
echo "  -> Uploading frontend (med21/dist/)..."
rsync -avz --delete \
    "$SCRIPT_DIR/med21/dist/" \
    "$REMOTE_USER@$REMOTE_HOST:$FRONTEND_REMOTE_DIR/" \
    --exclude '.env' \
    --exclude 'node_modules' \
    --exclude 'api'

# Upload SPA .htaccess for frontend routing
echo "  -> Uploading frontend .htaccess..."
scp "$SCRIPT_DIR/med21/.htaccess" \
    "$REMOTE_USER@$REMOTE_HOST:$FRONTEND_REMOTE_DIR/.htaccess"

# Deploy backend (Laravel)
echo "  -> Uploading backend (med21-laravel/)..."
rsync -avz \
    "$SCRIPT_DIR/med21-laravel/" \
    "$REMOTE_USER@$REMOTE_HOST:$BACKEND_REMOTE_DIR/" \
    --exclude '.env' \
    --exclude 'node_modules' \
    --exclude 'vendor/' \
    --exclude '.git'

echo "  Upload complete!"
echo ""

# --- Post-deploy on server ---
echo "[6/6] Running server commands..."
ssh "$REMOTE_USER@$REMOTE_HOST" << REMOTE_COMMANDS
    cd $BACKEND_REMOTE_DIR
    # Seed .env from the environment template ONLY on first deploy.
    # On subsequent deploys we MUST keep the server's real .env (which holds
    # the actual DB password and other secrets). The committed .env.staging /
    # .env.production templates contain empty secrets, so overwriting the
    # server .env would wipe the real credentials and break the database.
    if [ ! -f .env ]; then
        if [ "$ENV" = "staging" ]; then
            cp .env.staging .env 2>/dev/null || true
        elif [ "$ENV" = "production" ]; then
            cp .env.production .env 2>/dev/null || true
        fi
    fi
    # Export the real .env values into the shell so that `php artisan config:cache`
    # captures them. On this host Laravel's env() does not pick up DB_PASSWORD from
    # the .env file alone, but it DOES honour variables already present in the
    # environment (phpdotenv runs in immutable mode and keeps pre-set values).
    set -a
    [ -f .env ] && . ./.env
    set +a
    composer install --no-dev --optimize-autoloader --no-interaction 2>/dev/null || true
    php artisan migrate --force 2>/dev/null || true
    php artisan config:cache 2>/dev/null || true
    php artisan route:cache 2>/dev/null || true
    php artisan view:cache 2>/dev/null || true
    echo "Server optimization complete."
REMOTE_COMMANDS

echo ""
echo "========================================"
echo "  Deploy complete! ($ENV)"
echo "  URL: https://$REMOTE_HOST"
echo "========================================"
