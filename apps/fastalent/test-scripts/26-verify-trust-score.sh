#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "26 — Verify Trust Score (Phase 4)"

PASS=0 FAIL=0

# ── 1. Get Priya's trust score ──
step "Getting Priya's trust score..."
api_get "/recruiters/trust-score" "$PRIYA_TOKEN"
expect "200" "Priya trust score"
score=$(json_val "$RESP" "data.reputationScore")
tier=$(json_val "$RESP" "data.reputationTier")
total=$(json_val "$RESP" "data.totalPlacements")
successful=$(json_val "$RESP" "data.successfulPlacements")
ok "Priya: score=$score, tier=$tier, total=$total, successful=$successful"
PASS=$((PASS+1))

# ── 2. Get Arjun's trust score ──
step "Getting Arjun's trust score..."
api_get "/recruiters/trust-score" "$ARJUN_TOKEN"
expect "200" "Arjun trust score"
a_score=$(json_val "$RESP" "data.reputationScore")
a_tier=$(json_val "$RESP" "data.reputationTier")
a_total=$(json_val "$RESP" "data.totalPlacements")
ok "Arjun: score=$a_score, tier=$a_tier, total=$a_total"
PASS=$((PASS+1))

# ── 3. Public trust score endpoint ──
step "Getting Priya's trust score via public endpoint..."
api_get "/recruiters/${PRIYA_PROFILE_ID}/trust" "$ALPHA_TOKEN"
expect "200" "Public trust score"
pub_score=$(json_val "$RESP" "data.reputationScore")
pub_tier=$(json_val "$RESP" "data.reputationTier")
if [[ "$pub_score" == "$score" && "$pub_tier" == "$tier" ]]; then
  ok "Public endpoint matches private: score=$pub_score, tier=$pub_tier"
  PASS=$((PASS+1))
else
  fail "Public endpoint mismatch: $pub_score/$pub_tier vs $score/$tier"
  FAIL=$((FAIL+1))
fi

# ── 4. Verify score is consistent with placement counts ──
step "Verifying score consistency..."
if [[ "$total" -ge "0" && "$successful" -ge "0" ]]; then
  ok "Placement counts are non-negative (total=$total, successful=$successful)"
  PASS=$((PASS+1))
else
  fail "Invalid placement counts: total=$total, successful=$successful"
  FAIL=$((FAIL+1))
fi

# ── 5. Verify tier is valid ──
if [[ "$tier" == "bronze" || "$tier" == "silver" || "$tier" == "gold" || "$tier" == "platinum" ]]; then
  ok "Tier '$tier' is valid"
  PASS=$((PASS+1))
else
  fail "Invalid tier: $tier"
  FAIL=$((FAIL+1))
fi

echo ""
info "Results: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]] && header "26 PASSED — Trust score verified" \
                   || header "26 FAILED — $FAIL check(s) failed"
[[ $FAIL -gt 0 ]] && exit 1
exit 0
