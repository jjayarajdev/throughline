#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "18 — Verify Role Statuses"

PASS=0 FAIL=0

check_role() {
  local token="$1" role_id="$2" expected="$3" label="$4"
  api_get "/roles/${role_id}" "$token"
  if [[ "$HTTP_CODE" != "200" ]]; then
    fail "$label — HTTP $HTTP_CODE"
    FAIL=$((FAIL+1)); return
  fi
  local actual
  actual=$(json_val "$RESP" "data.status")
  if [[ "$actual" == "$expected" ]]; then
    ok "$label: $actual"
    PASS=$((PASS+1))
  else
    fail "$label: expected $expected, got $actual"
    FAIL=$((FAIL+1))
  fi
}

# Alpha roles
check_role "$ALPHA_TOKEN" "$R1_ID" "active" "R1: Senior Backend Engineer"
check_role "$ALPHA_TOKEN" "$R2_ID" "active" "R2: DevOps Lead"

# R3 may be 'filled' or 'active' depending on auto-fill logic
api_get "/roles/${R3_ID}" "$ALPHA_TOKEN"
R3_STATUS=$(json_val "$RESP" "data.status")
if [[ "$R3_STATUS" == "filled" || "$R3_STATUS" == "active" ]]; then
  ok "R3: VP of Engineering: $R3_STATUS (filled or active both valid)"
  PASS=$((PASS+1))
else
  fail "R3: VP of Engineering: expected filled|active, got $R3_STATUS"
  FAIL=$((FAIL+1))
fi

check_role "$ALPHA_TOKEN" "$R4_ID" "paused" "R4: QA Engineer"
check_role "$ALPHA_TOKEN" "$R5_ID" "draft"  "R5: Data Analyst"

# Beta roles
check_role "$BETA_TOKEN" "$R6_ID"  "active" "R6: Frontend Developer"
check_role "$BETA_TOKEN" "$R7_ID"  "active" "R7: Product Manager"
check_role "$BETA_TOKEN" "$R8_ID"  "closed" "R8: CTO"
check_role "$BETA_TOKEN" "$R9_ID"  "active" "R9: UX Designer"
check_role "$BETA_TOKEN" "$R10_ID" "active" "R10: Mobile Developer"

echo ""
info "Results: $PASS passed, $FAIL failed (10 roles)"
[[ $FAIL -eq 0 ]] && header "18 PASSED — All role statuses verified" \
                   || header "18 FAILED — $FAIL role(s) wrong status"
[[ $FAIL -gt 0 ]] && exit 1
exit 0
