#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "07 — Publish Roles"

publish_role() {
  local token="$1" role_id="$2" label="$3"
  step "Publishing $label..."
  api_post "/roles/${role_id}/publish" '{}' "$token"
  expect "200" "Publish $label"
  local status=$(json_val "$RESP" "data.status")
  ok "$label -> status: $status"
}

# Alpha roles: R1, R2, R3, R4 (R5 stays draft)
publish_role "$ALPHA_TOKEN" "$R1_ID" "R1: Senior Backend Engineer"
publish_role "$ALPHA_TOKEN" "$R2_ID" "R2: DevOps Lead"
publish_role "$ALPHA_TOKEN" "$R3_ID" "R3: VP of Engineering"
publish_role "$ALPHA_TOKEN" "$R4_ID" "R4: QA Engineer"

info "R5 (Data Analyst) intentionally left as DRAFT"

# Beta roles: R6, R7, R8, R9, R10
publish_role "$BETA_TOKEN" "$R6_ID"  "R6: Frontend Developer"
publish_role "$BETA_TOKEN" "$R7_ID"  "R7: Product Manager"
publish_role "$BETA_TOKEN" "$R8_ID"  "R8: CTO"
publish_role "$BETA_TOKEN" "$R9_ID"  "R9: UX Designer"
publish_role "$BETA_TOKEN" "$R10_ID" "R10: Mobile Developer"

# ── Pause R4 ──
step "Pausing R4 (QA Engineer)..."
api_post "/roles/${R4_ID}/pause" '{}' "$ALPHA_TOKEN"
expect "200" "Pause R4"
ok "R4 -> paused"

# ── Verify wallet locks ──
step "Verifying Alpha wallet after publish..."
api_get "/wallet/balance" "$ALPHA_TOKEN"
expect "200" "Alpha balance"
ok "Alpha  balance: $(json_val "$RESP" "data.balance"), locked: $(json_val "$RESP" "data.lockedBalance")"

step "Verifying Beta wallet after publish..."
api_get "/wallet/balance" "$BETA_TOKEN"
expect "200" "Beta balance"
ok "Beta  balance: $(json_val "$RESP" "data.balance"), locked: $(json_val "$RESP" "data.lockedBalance")"

header "07 PASSED — 9 published, R4 paused, R5 draft. Wallet locks verified."
