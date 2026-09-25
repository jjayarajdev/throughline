#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "11 — Shortlist S5 + Interview S3, S11"

# S5 was deferred from script 10 — shortlist it now before advancing others
step "Shortlisting S5: Suresh -> R3 (hybrid)..."
api_post "/submissions/${S5_ID}/status" '{"toStatus":"shortlisted"}' "$ALPHA_TOKEN"
expect "200" "Shortlist S5"
ok "S5: Suresh -> R3 shortlisted (hybrid shortlist earning auto-created)"

# Move S3 and S11 to interview
step "Interview S3: Vikram -> R2 (per_hire)..."
api_post "/submissions/${S3_ID}/status" '{"toStatus":"interview"}' "$ALPHA_TOKEN"
expect "200" "Interview S3"
ok "S3: Vikram -> R2 -> interview"

step "Interview S11: Manoj -> R1 (per_shortlist)..."
api_post "/submissions/${S11_ID}/status" '{"toStatus":"interview"}' "$ALPHA_TOKEN"
expect "200" "Interview S11"
ok "S11: Manoj -> R1 -> interview"

header "11 PASSED — S5 shortlisted, S3+S11 in interview"
