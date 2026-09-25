#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "27 — Phase 4 Verification Summary"

PASS=0 FAIL=0

run_check() {
  local label="$1"
  shift
  if "$@"; then
    ok "$label"
    PASS=$((PASS+1))
  else
    fail "$label"
    FAIL=$((FAIL+1))
  fi
}

# ── W0: Schema ──
step "W0: Checking Phase 4 schema fields..."
api_get "/roles/${R1_ID}" "$ALPHA_TOKEN"
expect "200" "Role has visibility field"
has_vis=$(node -e "
  const d = JSON.parse(process.argv[1]);
  process.stdout.write(d.data?.visibility !== undefined ? 'yes' : 'no');
" "$RESP")
[[ "$has_vis" == "yes" ]] && { ok "W0: Role.visibility field present"; PASS=$((PASS+1)); } \
                           || { fail "W0: Role.visibility field missing"; FAIL=$((FAIL+1)); }

# ── W1: Visibility ──
step "W1: Checking invite_only role exists..."
if [[ -n "${INV_ROLE_ID:-}" ]]; then
  api_get "/roles/${INV_ROLE_ID}" "$ALPHA_TOKEN"
  vis=$(json_val "$RESP" "data.visibility")
  [[ "$vis" == "invite_only" ]] && { ok "W1: invite_only role verified"; PASS=$((PASS+1)); } \
                                 || { fail "W1: expected invite_only, got $vis"; FAIL=$((FAIL+1)); }
else
  warn "W1: INV_ROLE_ID not set (run 23-verify-visibility first)"
fi

# ── W2: Admin ──
step "W2: Checking admin metrics..."
api_get "/admin/metrics" "$ADMIN_TOKEN"
[[ "$HTTP_CODE" == "200" ]] && { ok "W2: Admin metrics endpoint working"; PASS=$((PASS+1)); } \
                             || { fail "W2: Admin metrics returned $HTTP_CODE"; FAIL=$((FAIL+1)); }

step "W2: Checking admin users..."
api_get "/admin/users?page=1&pageSize=5" "$ADMIN_TOKEN"
[[ "$HTTP_CODE" == "200" ]] && { ok "W2: Admin users endpoint working"; PASS=$((PASS+1)); } \
                             || { fail "W2: Admin users returned $HTTP_CODE"; FAIL=$((FAIL+1)); }

step "W2: Checking admin roles..."
api_get "/admin/roles?page=1&pageSize=5" "$ADMIN_TOKEN"
[[ "$HTTP_CODE" == "200" ]] && { ok "W2: Admin roles endpoint working"; PASS=$((PASS+1)); } \
                             || { fail "W2: Admin roles returned $HTTP_CODE"; FAIL=$((FAIL+1)); }

step "W2: Checking admin earnings..."
api_get "/admin/earnings?page=1&pageSize=5" "$ADMIN_TOKEN"
[[ "$HTTP_CODE" == "200" ]] && { ok "W2: Admin earnings endpoint working"; PASS=$((PASS+1)); } \
                             || { fail "W2: Admin earnings returned $HTTP_CODE"; FAIL=$((FAIL+1)); }

# ── W3: Notifications ──
step "W3: Checking notification list..."
api_get "/notifications?pageSize=5" "$PRIYA_TOKEN"
[[ "$HTTP_CODE" == "200" ]] && { ok "W3: Notification list working"; PASS=$((PASS+1)); } \
                             || { fail "W3: Notification list returned $HTTP_CODE"; FAIL=$((FAIL+1)); }

step "W3: Checking unread count..."
api_get "/notifications/unread-count" "$PRIYA_TOKEN"
[[ "$HTTP_CODE" == "200" ]] && { ok "W3: Unread count working"; PASS=$((PASS+1)); } \
                             || { fail "W3: Unread count returned $HTTP_CODE"; FAIL=$((FAIL+1)); }

step "W3: Checking mark-all-read..."
api_patch "/notifications/read-all" '{}' "$ARJUN_TOKEN"
[[ "$HTTP_CODE" == "200" ]] && { ok "W3: Mark-all-read working"; PASS=$((PASS+1)); } \
                             || { fail "W3: Mark-all-read returned $HTTP_CODE"; FAIL=$((FAIL+1)); }

# ── W4: Trust Score ──
step "W4: Checking trust score endpoint..."
api_get "/recruiters/trust-score" "$PRIYA_TOKEN"
[[ "$HTTP_CODE" == "200" ]] && { ok "W4: Trust score endpoint working"; PASS=$((PASS+1)); } \
                             || { fail "W4: Trust score returned $HTTP_CODE"; FAIL=$((FAIL+1)); }

step "W4: Checking public trust endpoint..."
if [[ -n "${PRIYA_PROFILE_ID:-}" ]]; then
  api_get "/recruiters/${PRIYA_PROFILE_ID}/trust" "$ALPHA_TOKEN"
  [[ "$HTTP_CODE" == "200" ]] && { ok "W4: Public trust endpoint working"; PASS=$((PASS+1)); } \
                               || { fail "W4: Public trust returned $HTTP_CODE"; FAIL=$((FAIL+1)); }
else
  warn "W4: PRIYA_PROFILE_ID not set"
fi

# ── W5: UI Components (backend-verifiable subset) ──
step "W5: Checking StatusBadge-related role data..."
api_get "/roles/${R1_ID}" "$ALPHA_TOKEN"
status=$(json_val "$RESP" "data.status")
[[ -n "$status" ]] && { ok "W5: Role status present for UI ($status)"; PASS=$((PASS+1)); } \
                    || { fail "W5: Role status missing"; FAIL=$((FAIL+1)); }

# ── Authorization guards ──
step "Guard: Recruiter blocked from admin..."
api_get "/admin/metrics" "$PRIYA_TOKEN"
[[ "$HTTP_CODE" == "403" ]] && { ok "Guard: Admin-only enforced"; PASS=$((PASS+1)); } \
                             || { fail "Guard: Expected 403, got $HTTP_CODE"; FAIL=$((FAIL+1)); }

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
info "Phase 4 Summary: $PASS passed, $FAIL failed"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [[ $FAIL -eq 0 ]]; then
  header "27 PASSED — ALL Phase 4 verification checks GREEN"
else
  header "27 FAILED — $FAIL check(s) need attention"
  exit 1
fi
exit 0
