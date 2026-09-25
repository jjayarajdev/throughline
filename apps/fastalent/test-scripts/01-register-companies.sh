#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "01 — Register Companies"

# ── Step 1: Login as admin ──
step "Logging in as admin..."
api_post "/auth/login" "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASSWORD}\"}"
expect "200" "Admin login"
ADMIN_TOKEN=$(json_val "$RESP" "data.accessToken")
save_var "ADMIN_TOKEN" "$ADMIN_TOKEN"
ok "Admin logged in"

# ── Step 2: Register companies ──
register_company() {
  local email="$1" name="$2" var_prefix="$3"
  step "Registering $email..."
  api_post "/auth/register" "{\"role\":\"company\",\"email\":\"${email}\",\"password\":\"${TEST_PASSWORD}\",\"companyName\":\"${name}\"}"
  expect "201" "Register $email"
  local user_id=$(json_val "$RESP" "data.user.id")
  local token=$(json_val "$RESP" "data.accessToken")
  save_var "${var_prefix}_USER_ID" "$user_id"
  save_var "${var_prefix}_TOKEN" "$token"
  ok "$email registered  (id: $user_id)"
}

register_company "alpha@demo-co.test" "Alpha Technologies" "ALPHA"
register_company "beta@demo-co.test"  "Beta Solutions"     "BETA"
register_company "gamma@demo-co.test" "Gamma Industries"   "GAMMA"

# ── Step 3: Force-activate alpha and beta ──
activate_user() {
  local user_id="$1" label="$2"
  step "Activating $label..."
  api_post "/admin/dev/set-user-status" "{\"userId\":\"${user_id}\",\"status\":\"active\",\"emailVerified\":true}" "$ADMIN_TOKEN"
  expect "200" "Activate $label"
  ok "$label activated"
}

activate_user "$ALPHA_USER_ID" "alpha"
activate_user "$BETA_USER_ID"  "beta"
info "gamma left as pending_verification (by design)"

header "01 PASSED — 3 companies registered, 2 activated"
