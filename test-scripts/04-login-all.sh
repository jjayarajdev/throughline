#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "04 — Login All Users (refresh tokens)"

login_user() {
  local email="$1" password="$2" var_prefix="$3" expect_code="${4:-200}"
  step "Logging in $email..."
  api_post "/auth/login" "{\"email\":\"${email}\",\"password\":\"${password}\"}"
  if [[ "$expect_code" != "200" ]]; then
    expect "$expect_code" "Login $email (expected failure)"
    ok "$email correctly rejected (HTTP $expect_code)"
    return
  fi
  expect "200" "Login $email"
  local token=$(json_val "$RESP" "data.accessToken")
  save_var "${var_prefix}_TOKEN" "$token"
  ok "$email logged in (token refreshed)"
}

# Admin
login_user "$ADMIN_EMAIL" "$ADMIN_PASSWORD" "ADMIN"

# Active companies
login_user "alpha@demo-co.test" "$TEST_PASSWORD" "ALPHA"
login_user "beta@demo-co.test"  "$TEST_PASSWORD" "BETA"

# Pending company — should get 403
login_user "gamma@demo-co.test" "$TEST_PASSWORD" "GAMMA" "403"

# Active recruiters
login_user "priya@demo-rec.test" "$TEST_PASSWORD" "PRIYA"
login_user "arjun@demo-rec.test" "$TEST_PASSWORD" "ARJUN"

# Blocked recruiter — should get 403
login_user "neha@demo-rec.test" "$TEST_PASSWORD" "NEHA" "403"

header "04 PASSED — 5 logins successful, 2 correctly rejected"
