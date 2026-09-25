#!/usr/bin/env bash
# ============================================================
# env.sh — Shared environment + helpers for E2E test scripts
# ============================================================
# FOUNDER INSTRUCTIONS — stored here so they never need repeating:
# 1. Clean DB except Admin user
# 2. Create companies + recruiters via API (registration -> force active via DB)
# 3. Create 3+ roles per company in multiple statuses
# 4. Create submissions across recruiters (1 role gets submissions from multiple recruiters)
# 5. Roles in all statuses per system: draft, active, paused, closed, filled
# 6. Submissions in all statuses per system: submitted, shortlisted, interview, hired, joined, rejected, withdrawn
# 7. Proper payouts in multiple scenarios and statuses
# 8. Transactions completed properly with right information
# 9. All status data visible in UI
# 10. Scripts run step-by-step, fix errors before continuing
# 11. Always do full monorepo build after code changes
# 12. User starts/restarts API server — Claude tells when
# ============================================================

set -euo pipefail

# ──── Constants ────────────────────────────────────────────────
BASE_URL="http://localhost:4000/api/v1"
ADMIN_EMAIL="admin@gigcruite.com"
ADMIN_PASSWORD="Admin@GigCruite2026"
TEST_PASSWORD='Demo@2026!test'

# ──── Colors ───────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# ──── Output helpers ───────────────────────────────────────────
info()   { echo -e "${BLUE}i${NC}  $*"; }
ok()     { echo -e "${GREEN}✓${NC}  $*"; }
warn()   { echo -e "${YELLOW}!${NC}  $*"; }
fail()   { echo -e "${RED}✗${NC}  $*"; }
die()    { fail "$*"; exit 1; }
header() { echo -e "\n${BOLD}${CYAN}━━━ $* ━━━${NC}"; }
step()   { echo -e "  ${BLUE}->${NC} $*"; }

# ──── JSON helpers (via node) ──────────────────────────────────
json_val() {
  node -e "
    const d = JSON.parse(process.argv[1]);
    const p = process.argv[2].split('.').filter(Boolean);
    let v = d;
    for (const k of p) { v = v == null ? undefined : v[k]; }
    process.stdout.write(String(v ?? ''));
  " "$1" "$2"
}

json_pp() {
  node -e "try{console.log(JSON.stringify(JSON.parse(process.argv[1]),null,2))}catch{console.log(process.argv[1])}" "$1"
}

# ──── State persistence ────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STATE_DIR="$SCRIPT_DIR/.state"
STATE_FILE="$STATE_DIR/state.env"
mkdir -p "$STATE_DIR"

# Load accumulated state if it exists
if [[ -f "$STATE_FILE" ]]; then
  set +u
  source "$STATE_FILE"
  set -u
fi

# Save a named variable to the state file (persists across scripts)
save_var() {
  local name="$1" value="$2"
  if [[ -f "$STATE_FILE" ]]; then
    grep -v "^${name}=" "$STATE_FILE" > "$STATE_FILE.tmp" 2>/dev/null || true
    mv "$STATE_FILE.tmp" "$STATE_FILE"
  fi
  printf '%s=%q\n' "$name" "$value" >> "$STATE_FILE"
  eval "$name=$(printf '%q' "$value")"
}

# ──── HTTP helpers ─────────────────────────────────────────────
api_post() {
  local path="$1" body="$2" token="${3:-}"
  local tmp; tmp=$(mktemp)
  local -a args=( -s -w '%{http_code}' -o "$tmp"
    -X POST "${BASE_URL}${path}"
    -H 'Content-Type: application/json' )
  [[ -n "$token" ]] && args+=( -H "Authorization: Bearer ${token}" )
  HTTP_CODE=$(curl "${args[@]}" --data-raw "$body" 2>/dev/null) || true
  RESP=$(cat "$tmp"); rm -f "$tmp"
}

api_get() {
  local path="$1" token="${2:-}"
  local tmp; tmp=$(mktemp)
  local -a args=( -s -w '%{http_code}' -o "$tmp"
    -X GET "${BASE_URL}${path}" )
  [[ -n "$token" ]] && args+=( -H "Authorization: Bearer ${token}" )
  HTTP_CODE=$(curl "${args[@]}" 2>/dev/null) || true
  RESP=$(cat "$tmp"); rm -f "$tmp"
}

api_put() {
  local path="$1" body="$2" token="${3:-}"
  local tmp; tmp=$(mktemp)
  local -a args=( -s -w '%{http_code}' -o "$tmp"
    -X PUT "${BASE_URL}${path}"
    -H 'Content-Type: application/json' )
  [[ -n "$token" ]] && args+=( -H "Authorization: Bearer ${token}" )
  HTTP_CODE=$(curl "${args[@]}" --data-raw "$body" 2>/dev/null) || true
  RESP=$(cat "$tmp"); rm -f "$tmp"
}

api_patch() {
  local path="$1" body="$2" token="${3:-}"
  local tmp; tmp=$(mktemp)
  local -a args=( -s -w '%{http_code}' -o "$tmp"
    -X PATCH "${BASE_URL}${path}"
    -H 'Content-Type: application/json' )
  [[ -n "$token" ]] && args+=( -H "Authorization: Bearer ${token}" )
  HTTP_CODE=$(curl "${args[@]}" --data-raw "$body" 2>/dev/null) || true
  RESP=$(cat "$tmp"); rm -f "$tmp"
}

api_put_file() {
  local url="$1" file="$2" content_type="$3"
  local tmp; tmp=$(mktemp)
  HTTP_CODE=$(curl -s -w '%{http_code}' -o "$tmp" \
    -X PUT "$url" \
    -H "Content-Type: ${content_type}" \
    --data-binary "@${file}" 2>/dev/null) || true
  RESP=$(cat "$tmp"); rm -f "$tmp"
}

expect() {
  local expected="$1" label="${2:-request}"
  if [[ "$HTTP_CODE" != "$expected" ]]; then
    fail "$label  expected HTTP $expected, got $HTTP_CODE"
    echo "     Response: $(echo "$RESP" | head -c 500)"
    exit 1
  fi
}

expect_warn() {
  local expected="$1" label="${2:-request}"
  if [[ "$HTTP_CODE" != "$expected" ]]; then
    warn "$label  expected HTTP $expected, got $HTTP_CODE"
    echo "     Response: $(echo "$RESP" | head -c 500)"
    return 1
  fi
  return 0
}
