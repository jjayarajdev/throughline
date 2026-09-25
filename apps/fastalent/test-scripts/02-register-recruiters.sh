#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "02 — Register Recruiters"

# ── Step 1: Register recruiters ──
register_recruiter() {
  local email="$1" name="$2" var_prefix="$3"
  step "Registering $email..."
  api_post "/auth/register" "{\"role\":\"recruiter\",\"email\":\"${email}\",\"password\":\"${TEST_PASSWORD}\",\"fullName\":\"${name}\"}"
  expect "201" "Register $email"
  local user_id=$(json_val "$RESP" "data.user.id")
  local token=$(json_val "$RESP" "data.accessToken")
  save_var "${var_prefix}_USER_ID" "$user_id"
  save_var "${var_prefix}_TOKEN" "$token"
  ok "$email registered  (id: $user_id)"
}

register_recruiter "priya@demo-rec.test" "Priya Sharma" "PRIYA"
register_recruiter "arjun@demo-rec.test" "Arjun Patel"  "ARJUN"
register_recruiter "neha@demo-rec.test"  "Neha Gupta"   "NEHA"

# ── Step 2: Activate priya and arjun, block neha ──
step "Activating priya..."
api_post "/admin/dev/set-user-status" "{\"userId\":\"${PRIYA_USER_ID}\",\"status\":\"active\",\"emailVerified\":true}" "$ADMIN_TOKEN"
expect "200" "Activate priya"
ok "priya activated"

step "Activating arjun..."
api_post "/admin/dev/set-user-status" "{\"userId\":\"${ARJUN_USER_ID}\",\"status\":\"active\",\"emailVerified\":true}" "$ADMIN_TOKEN"
expect "200" "Activate arjun"
ok "arjun activated"

step "Blocking neha..."
api_post "/admin/dev/set-user-status" "{\"userId\":\"${NEHA_USER_ID}\",\"status\":\"blocked\",\"emailVerified\":true}" "$ADMIN_TOKEN"
expect "200" "Block neha"
ok "neha blocked (by design)"

header "02 PASSED — 3 recruiters registered, 2 active, 1 blocked"
