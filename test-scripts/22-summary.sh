#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "22 — Final Summary Matrix"

# ═══════════════════════════════════════════════════════════════
# ROLE STATUS MATRIX
# ═══════════════════════════════════════════════════════════════
echo ""
echo "┌──────────────────────────────────────────────────────────────┐"
echo "│                     ROLE STATUS MATRIX                       │"
echo "├──────┬──────────────────────────┬─────────┬─────────────────┤"
echo "│ Role │ Title                    │ Company │ Status          │"
echo "├──────┼──────────────────────────┼─────────┼─────────────────┤"

print_role() {
  local label="$1" token="$2" role_id="$3" company="$4"
  api_get "/roles/${role_id}" "$token"
  local status title
  status=$(json_val "$RESP" "data.status")
  title=$(json_val "$RESP" "data.title")
  printf "│ %-4s │ %-24.24s │ %-7s │ %-15s │\n" "$label" "$title" "$company" "$status"
}

print_role "R1"  "$ALPHA_TOKEN" "$R1_ID"  "Alpha"
print_role "R2"  "$ALPHA_TOKEN" "$R2_ID"  "Alpha"
print_role "R3"  "$ALPHA_TOKEN" "$R3_ID"  "Alpha"
print_role "R4"  "$ALPHA_TOKEN" "$R4_ID"  "Alpha"
print_role "R5"  "$ALPHA_TOKEN" "$R5_ID"  "Alpha"
print_role "R6"  "$BETA_TOKEN"  "$R6_ID"  "Beta"
print_role "R7"  "$BETA_TOKEN"  "$R7_ID"  "Beta"
print_role "R8"  "$BETA_TOKEN"  "$R8_ID"  "Beta"
print_role "R9"  "$BETA_TOKEN"  "$R9_ID"  "Beta"
print_role "R10" "$BETA_TOKEN"  "$R10_ID" "Beta"
echo "└──────┴──────────────────────────┴─────────┴─────────────────┘"

# ═══════════════════════════════════════════════════════════════
# SUBMISSION STATUS MATRIX
# ═══════════════════════════════════════════════════════════════
echo ""
echo "┌─────────────────────────────────────────────────────────────────────┐"
echo "│                    SUBMISSION STATUS MATRIX                         │"
echo "├─────┬─────────────────┬──────┬───────────┬─────────────────────────┤"
echo "│ Sub │ Candidate       │ Role │ Recruiter │ Status                  │"
echo "├─────┼─────────────────┼──────┼───────────┼─────────────────────────┤"

print_sub() {
  local label="$1" token="$2" sub_id="$3" name="$4" role="$5" rec="$6"
  api_get "/submissions/${sub_id}" "$token"
  local status
  status=$(json_val "$RESP" "data.status")
  printf "│ %-3s │ %-15.15s │ %-4s │ %-9s │ %-23s │\n" "$label" "$name" "$role" "$rec" "$status"
}

print_sub "S1"  "$ALPHA_TOKEN" "$S1_ID"  "Rahul Kumar"   "R1"  "Priya"
print_sub "S2"  "$ALPHA_TOKEN" "$S2_ID"  "Anita Singh"   "R1"  "Priya"
print_sub "S3"  "$ALPHA_TOKEN" "$S3_ID"  "Vikram Rao"    "R2"  "Priya"
print_sub "S4"  "$ALPHA_TOKEN" "$S4_ID"  "Deepa Menon"   "R3"  "Priya"
print_sub "S5"  "$ALPHA_TOKEN" "$S5_ID"  "Suresh Iyer"   "R3"  "Priya"
print_sub "S6"  "$BETA_TOKEN"  "$S6_ID"  "Amit Verma"    "R6"  "Priya"
print_sub "S7"  "$BETA_TOKEN"  "$S7_ID"  "Pooja Desai"   "R7"  "Priya"
print_sub "S8"  "$BETA_TOKEN"  "$S8_ID"  "Ravi Prasad"   "R8"  "Priya"
print_sub "S9"  "$BETA_TOKEN"  "$S9_ID"  "Nisha Agarwal" "R9"  "Priya"
print_sub "S10" "$BETA_TOKEN"  "$S10_ID" "Kavita Joshi"  "R10" "Priya"
print_sub "S11" "$ALPHA_TOKEN" "$S11_ID" "Manoj Tiwari"  "R1"  "Arjun"
print_sub "S12" "$ALPHA_TOKEN" "$S12_ID" "Sneha Reddy"   "R2"  "Arjun"
print_sub "S13" "$BETA_TOKEN"  "$S13_ID" "Kiran Bhat"    "R6"  "Arjun"
print_sub "S14" "$BETA_TOKEN"  "$S14_ID" "Lakshmi Nair"  "R6"  "Arjun"
print_sub "S15" "$BETA_TOKEN"  "$S15_ID" "Rajesh Gupta"  "R7"  "Arjun"
print_sub "S16" "$BETA_TOKEN"  "$S16_ID" "Divya Pillai"  "R8"  "Arjun"
print_sub "S17" "$BETA_TOKEN"  "$S17_ID" "Sanjay Kumar"  "R9"  "Arjun"
print_sub "S18" "$BETA_TOKEN"  "$S18_ID" "Megha Shah"    "R10" "Arjun"
echo "└─────┴─────────────────┴──────┴───────────┴─────────────────────────┘"

# ═══════════════════════════════════════════════════════════════
# EARNINGS SUMMARY
# ═══════════════════════════════════════════════════════════════
echo ""
echo "┌──────────────────────────────────────────────────────────────┐"
echo "│                      EARNINGS SUMMARY                        │"
echo "├────────────┬────────────┬────────────┬────────────┬─────────┤"
echo "│ Recruiter  │ Payable    │ Pending    │ Paid       │ Count   │"
echo "├────────────┼────────────┼────────────┼────────────┼─────────┤"

for rec in PRIYA ARJUN; do
  token_var="${rec}_TOKEN"
  api_get "/earnings/summary" "${!token_var}"
  payable=$(json_val "$RESP" "data.totalPayable")
  pending=$(json_val "$RESP" "data.totalPending")
  paid=$(json_val "$RESP" "data.totalPaid")
  count=$(json_val "$RESP" "data.earningsCount")
  name="${rec,,}"; name="${name^}"
  printf "│ %-10s │ %10s │ %10s │ %10s │ %7s │\n" "$name" "$payable" "$pending" "$paid" "$count"
done
echo "└────────────┴────────────┴────────────┴────────────┴─────────┘"

# ═══════════════════════════════════════════════════════════════
# WALLET SUMMARY
# ═══════════════════════════════════════════════════════════════
echo ""
echo "┌──────────────────────────────────────────────────────────────┐"
echo "│                       WALLET SUMMARY                         │"
echo "├────────────┬────────────────┬────────────────┬──────────────┤"
echo "│ Entity     │ Balance        │ Locked         │ Txn Count    │"
echo "├────────────┼────────────────┼────────────────┼──────────────┤"

for ent in ALPHA BETA PRIYA ARJUN; do
  token_var="${ent}_TOKEN"
  api_get "/wallet/balance" "${!token_var}"
  bal=$(json_val "$RESP" "data.balance")
  locked=$(json_val "$RESP" "data.lockedBalance")
  api_get "/wallet/transactions?pageSize=1" "${!token_var}"
  txn_count=$(json_val "$RESP" "data.total")
  name="${ent,,}"; name="${name^}"
  printf "│ %-10s │ %14s │ %14s │ %12s │\n" "$name" "$bal" "$locked" "$txn_count"
done
echo "└────────────┴────────────────┴────────────────┴──────────────┘"

# ═══════════════════════════════════════════════════════════════
# PAYOUT REQUESTS
# ═══════════════════════════════════════════════════════════════
echo ""
echo "┌──────────────────────────────────────────────────────────────┐"
echo "│                     PAYOUT REQUESTS                          │"
echo "├────────────┬────────────────────┬────────────────────────────┤"
echo "│ Amount     │ Status             │ Recruiter                  │"
echo "├────────────┼────────────────────┼────────────────────────────┤"
api_get "/payouts/requests?pageSize=50" "$ADMIN_TOKEN"
if [[ "$HTTP_CODE" == "200" ]]; then
  node -e "
    const d = JSON.parse(process.argv[1]).data;
    (d.requests || []).forEach(r => {
      const amt = String(r.amount).padStart(10);
      const st  = (r.status || '').padEnd(18);
      const nm  = (r.recruiter?.fullName || 'N/A').substring(0, 26).padEnd(26);
      console.log('\u2502 ' + amt + ' \u2502 ' + st + ' \u2502 ' + nm + ' \u2502');
    });
  " "$RESP" 2>/dev/null || warn "Could not parse payout requests"
fi
echo "└────────────┴────────────────────┴────────────────────────────┘"

# ═══════════════════════════════════════════════════════════════
# STATUS COVERAGE
# ═══════════════════════════════════════════════════════════════
echo ""
header "STATUS COVERAGE ACHIEVED"
echo ""
echo "  Roles:       draft, active, paused, closed, filled(?)"
echo "  Submissions: submitted, shortlisted, interview, hired, joined, rejected, withdrawn"
echo "  Earnings:    pending, payable, paid(?)"
echo "  Payouts:     pending_approval, approved, rejected, completed(?)"
echo ""

header "22 — E2E TEST SUITE COMPLETE"
info "All 23 scripts (00-22) executed. Review tables above for correctness."
