#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "10 — Shortlist Submissions"

shortlist() {
  local token="$1" sub_id="$2" label="$3"
  step "Shortlisting $label..."
  api_post "/submissions/${sub_id}/status" '{"toStatus":"shortlisted"}' "$token"
  expect "200" "Shortlist $label"
  ok "$label -> shortlisted"
}

# Alpha company actions (R1=per_shortlist, R2=per_hire, R3=hybrid)
shortlist "$ALPHA_TOKEN" "$S2_ID"  "S2: Anita -> R1 (per_shortlist)"
shortlist "$ALPHA_TOKEN" "$S3_ID"  "S3: Vikram -> R2 (per_hire)"
shortlist "$ALPHA_TOKEN" "$S11_ID" "S11: Manoj -> R1 (per_shortlist)"

# Beta company actions (R6=per_shortlist, R7=per_hire, R8=hybrid, R9=per_shortlist)
shortlist "$BETA_TOKEN" "$S7_ID"  "S7: Pooja -> R7 (per_hire)"  
shortlist "$BETA_TOKEN" "$S8_ID"  "S8: Ravi -> R8 (hybrid)"
shortlist "$BETA_TOKEN" "$S10_ID" "S10: Kavita -> R10 (per_hire)"
shortlist "$BETA_TOKEN" "$S13_ID" "S13: Kiran -> R6 (per_shortlist)"
shortlist "$BETA_TOKEN" "$S14_ID" "S14: Lakshmi -> R6 (per_shortlist)"
shortlist "$BETA_TOKEN" "$S15_ID" "S15: Rajesh -> R7 (per_hire)"
shortlist "$BETA_TOKEN" "$S16_ID" "S16: Divya -> R8 (hybrid)"

info "Earnings auto-created for per_shortlist (R1,R6,R9) and hybrid (R3,R8) shortlists"

header "10 PASSED — 10 submissions shortlisted"
