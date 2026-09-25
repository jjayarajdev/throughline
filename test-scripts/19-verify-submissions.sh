#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "19 — Verify Submission Statuses"

PASS=0 FAIL=0

check_sub() {
  local token="$1" sub_id="$2" expected="$3" label="$4"
  api_get "/submissions/${sub_id}" "$token"
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

# Alpha submissions (R1-R3)
check_sub "$ALPHA_TOKEN" "$S1_ID"  "submitted"   "S1:  Rahul   -> R1"
check_sub "$ALPHA_TOKEN" "$S2_ID"  "shortlisted" "S2:  Anita   -> R1"
check_sub "$ALPHA_TOKEN" "$S3_ID"  "interview"   "S3:  Vikram  -> R2"
check_sub "$ALPHA_TOKEN" "$S4_ID"  "rejected"    "S4:  Deepa   -> R3"
check_sub "$ALPHA_TOKEN" "$S5_ID"  "joined"      "S5:  Suresh  -> R3"
check_sub "$ALPHA_TOKEN" "$S11_ID" "interview"   "S11: Manoj   -> R1"
check_sub "$ALPHA_TOKEN" "$S12_ID" "withdrawn"   "S12: Sneha   -> R2"

# Beta submissions (R6-R10)
check_sub "$BETA_TOKEN" "$S6_ID"  "submitted"   "S6:  Amit    -> R6"
check_sub "$BETA_TOKEN" "$S7_ID"  "shortlisted" "S7:  Pooja   -> R7"
check_sub "$BETA_TOKEN" "$S8_ID"  "hired"       "S8:  Ravi    -> R8"
check_sub "$BETA_TOKEN" "$S9_ID"  "submitted"   "S9:  Nisha   -> R9"
check_sub "$BETA_TOKEN" "$S10_ID" "shortlisted" "S10: Kavita  -> R10"
check_sub "$BETA_TOKEN" "$S13_ID" "joined"      "S13: Kiran   -> R6"
check_sub "$BETA_TOKEN" "$S14_ID" "rejected"    "S14: Lakshmi -> R6"
check_sub "$BETA_TOKEN" "$S15_ID" "shortlisted" "S15: Rajesh  -> R7"
check_sub "$BETA_TOKEN" "$S16_ID" "joined"      "S16: Divya   -> R8"
check_sub "$BETA_TOKEN" "$S17_ID" "rejected"    "S17: Sanjay  -> R9"
check_sub "$BETA_TOKEN" "$S18_ID" "submitted"   "S18: Megha   -> R10"

echo ""
info "Results: $PASS passed, $FAIL failed (18 submissions)"
[[ $FAIL -eq 0 ]] && header "19 PASSED — All submission statuses verified" \
                   || header "19 FAILED — $FAIL submission(s) wrong status"
[[ $FAIL -gt 0 ]] && exit 1
exit 0
