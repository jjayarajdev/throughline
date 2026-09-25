#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "12 — Hire S5, S8, S13, S16"

hire() {
  local token="$1" sub_id="$2" ctc="$3" label="$4"
  step "Hiring $label..."
  api_post "/submissions/${sub_id}/status" "{\"toStatus\":\"hired\",\"acceptedCtc\":${ctc}}" "$token"
  expect "200" "Hire $label"
  ok "$label -> hired (acceptedCtc: ${ctc})"
}

# Alpha: S5 -> R3 (hybrid headhunting, hire payout 200k)
hire "$ALPHA_TOKEN" "$S5_ID"  9500000  "S5: Suresh -> R3 (hybrid, CTC 95L)"

# Beta: S8 -> R8 (hybrid headhunting, hire payout 300k) — will NOT be joined later
hire "$BETA_TOKEN"  "$S8_ID"  18000000 "S8: Ravi -> R8 (hybrid, CTC 1.8Cr)"

# Beta: S13 -> R6 (per_shortlist) — no hire earning created
hire "$BETA_TOKEN"  "$S13_ID" 1800000  "S13: Kiran -> R6 (per_shortlist, CTC 18L)"

# Beta: S16 -> R8 (hybrid headhunting, hire payout 300k)
hire "$BETA_TOKEN"  "$S16_ID" 15000000 "S16: Divya -> R8 (hybrid, CTC 1.5Cr)"

info "Hire earnings created for hybrid roles (S5->R3, S8->R8, S16->R8) — status PENDING until joined"
info "No hire earning for S13->R6 (per_shortlist role)"

header "12 PASSED — 4 submissions hired"
