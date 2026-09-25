#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "13 — Join / Reject / Withdraw"

# ── Joins (company confirms candidate joined) ──────────────
step "Join S5: Suresh -> R3 (hybrid)..."
api_post "/submissions/${S5_ID}/status" '{"toStatus":"joined"}' "$ALPHA_TOKEN"
expect "200" "Join S5"
ok "S5 -> joined (hire earning now PAYABLE)"

step "Join S13: Kiran -> R6 (per_shortlist)..."
api_post "/submissions/${S13_ID}/status" '{"toStatus":"joined"}' "$BETA_TOKEN"
expect "200" "Join S13"
ok "S13 -> joined"

step "Join S16: Divya -> R8 (hybrid)..."
api_post "/submissions/${S16_ID}/status" '{"toStatus":"joined"}' "$BETA_TOKEN"
expect "200" "Join S16"
ok "S16 -> joined (hire earning now PAYABLE)"

# ── Rejections (company rejects) ───────────────────────────
step "Reject S4: Deepa -> R3 (from submitted)..."
api_post "/submissions/${S4_ID}/status" '{"toStatus":"rejected","reason":"Not a culture fit for VP role"}' "$ALPHA_TOKEN"
expect "200" "Reject S4"
ok "S4 -> rejected (no earnings — was never shortlisted)"

step "Reject S14: Lakshmi -> R6 (from shortlisted)..."
api_post "/submissions/${S14_ID}/status" '{"toStatus":"rejected","reason":"Skills mismatch after detailed review"}' "$BETA_TOKEN"
expect "200" "Reject S14"
ok "S14 -> rejected (shortlist earning already PAYABLE — no clawback)"

step "Reject S17: Sanjay -> R9 (from submitted)..."
api_post "/submissions/${S17_ID}/status" '{"toStatus":"rejected","reason":"Portfolio does not meet design standards"}' "$BETA_TOKEN"
expect "200" "Reject S17"
ok "S17 -> rejected (no earnings — never shortlisted)"

# ── Withdrawal (recruiter withdraws) ───────────────────────
step "Withdraw S12: Sneha -> R2 (recruiter action)..."
api_post "/submissions/${S12_ID}/status" '{"toStatus":"withdrawn","reason":"Candidate accepted another offer"}' "$ARJUN_TOKEN"
expect "200" "Withdraw S12"
ok "S12 -> withdrawn"

header "13 PASSED — 3 joined, 3 rejected, 1 withdrawn"
