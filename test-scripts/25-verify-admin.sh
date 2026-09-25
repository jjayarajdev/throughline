#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "25 — Verify Admin Dashboard Endpoints (Phase 4)"

PASS=0 FAIL=0

# ── 1. Admin metrics ──
step "Fetching admin metrics..."
api_get "/admin/metrics" "$ADMIN_TOKEN"
expect "200" "Admin metrics"
total_companies=$(json_val "$RESP" "data.totalCompanies")
total_roles=$(json_val "$RESP" "data.totalRoles")
total_subs=$(json_val "$RESP" "data.totalSubmissions")
if [[ "$total_companies" -ge "1" ]]; then
  ok "Metrics: $total_companies companies, $total_roles roles, $total_subs submissions"
  PASS=$((PASS+1))
else
  fail "Expected at least 1 company in metrics"
  FAIL=$((FAIL+1))
fi

# ── 2. Admin list users ──
step "Listing users as admin..."
api_get "/admin/users?page=1&pageSize=10" "$ADMIN_TOKEN"
expect "200" "Admin list users"
user_count=$(json_val "$RESP" "data.total")
if [[ "$user_count" -ge "1" ]]; then
  ok "Listed $user_count user(s)"
  PASS=$((PASS+1))
else
  fail "Expected at least 1 user"
  FAIL=$((FAIL+1))
fi

# ── 3. Admin list users with role filter ──
step "Listing recruiters as admin..."
api_get "/admin/users?role=recruiter&page=1&pageSize=10" "$ADMIN_TOKEN"
expect "200" "Admin list recruiters"
rec_count=$(json_val "$RESP" "data.total")
if [[ "$rec_count" -ge "2" ]]; then
  ok "Found $rec_count recruiter(s)"
  PASS=$((PASS+1))
else
  fail "Expected at least 2 recruiters, got $rec_count"
  FAIL=$((FAIL+1))
fi

# ── 4. Admin list roles ──
step "Listing all roles as admin..."
api_get "/admin/roles?page=1&pageSize=50" "$ADMIN_TOKEN"
expect "200" "Admin list roles"
role_count=$(json_val "$RESP" "data.total")
if [[ "$role_count" -ge "10" ]]; then
  ok "Listed $role_count role(s)"
  PASS=$((PASS+1))
else
  fail "Expected at least 10 roles, got $role_count"
  FAIL=$((FAIL+1))
fi

# ── 5. Admin list earnings ──
step "Listing platform earnings as admin..."
api_get "/admin/earnings?page=1&pageSize=50" "$ADMIN_TOKEN"
expect "200" "Admin list earnings"
ok "Admin earnings endpoint working"
PASS=$((PASS+1))

# ── 6. Non-admin blocked ──
step "Verifying recruiter cannot access admin metrics..."
api_get "/admin/metrics" "$PRIYA_TOKEN"
if [[ "$HTTP_CODE" == "403" ]]; then
  ok "Recruiter correctly blocked from admin metrics (403)"
  PASS=$((PASS+1))
else
  fail "Expected 403 for recruiter accessing admin, got $HTTP_CODE"
  FAIL=$((FAIL+1))
fi

step "Verifying company cannot access admin users..."
api_get "/admin/users?page=1&pageSize=10" "$ALPHA_TOKEN"
if [[ "$HTTP_CODE" == "403" ]]; then
  ok "Company correctly blocked from admin users (403)"
  PASS=$((PASS+1))
else
  fail "Expected 403 for company accessing admin, got $HTTP_CODE"
  FAIL=$((FAIL+1))
fi

echo ""
info "Results: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]] && header "25 PASSED — Admin endpoints verified" \
                   || header "25 FAILED — $FAIL check(s) failed"
[[ $FAIL -gt 0 ]] && exit 1
exit 0
