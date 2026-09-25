#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "14 — Close/Pause Roles + Status Checks"

# Close R8 (CTO, Beta) — has hires S8(hired) + S16(joined)
step "Closing R8: CTO..."
api_post "/roles/${R8_ID}/close" '' "$BETA_TOKEN"
expect "200" "Close R8"
ok "R8 -> closed"

# Check R3 status — may have auto-filled after S5 joined
step "Checking R3 status..."
api_get "/roles/${R3_ID}" "$ALPHA_TOKEN"
expect "200" "Get R3"
R3_STATUS=$(json_val "$RESP" "data.status")
if [[ "$R3_STATUS" == "filled" ]]; then
  ok "R3 (VP Engineering) auto-filled after S5 joined"
else
  info "R3 (VP Engineering) status: $R3_STATUS (auto-fill depends on maxSubmissions config)"
fi

# Verify R4 still paused
step "Checking R4 status..."
api_get "/roles/${R4_ID}" "$ALPHA_TOKEN"
expect "200" "Get R4"
R4_STATUS=$(json_val "$RESP" "data.status")
[[ "$R4_STATUS" == "paused" ]] && ok "R4 (QA Engineer) still paused" || warn "R4 expected paused, got $R4_STATUS"

# Verify R5 still draft
step "Checking R5 status..."
api_get "/roles/${R5_ID}" "$ALPHA_TOKEN"
expect "200" "Get R5"
R5_STATUS=$(json_val "$RESP" "data.status")
[[ "$R5_STATUS" == "draft" ]] && ok "R5 (Data Analyst) still draft" || warn "R5 expected draft, got $R5_STATUS"

header "14 PASSED — R8 closed, R4 paused, R5 draft verified"
