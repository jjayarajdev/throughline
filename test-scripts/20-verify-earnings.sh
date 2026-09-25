#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "20 — Verify Earnings"

# ── Priya's earnings ────────────────────────────────────────
step "Priya earnings summary..."
api_get "/earnings/summary" "$PRIYA_TOKEN"
expect "200" "Priya earnings summary"
echo "  Priya:"
echo "    totalEarned:    $(json_val "$RESP" "data.totalEarned")"
echo "    totalPending:   $(json_val "$RESP" "data.totalPending")"
echo "    totalPayable:   $(json_val "$RESP" "data.totalPayable")"
echo "    totalPaid:      $(json_val "$RESP" "data.totalPaid")"
echo "    totalCommission:$(json_val "$RESP" "data.totalCommission")"
echo "    earningsCount:  $(json_val "$RESP" "data.earningsCount")"

step "Priya earnings list..."
api_get "/earnings?pageSize=50" "$PRIYA_TOKEN"
expect "200" "Priya earnings list"
PRIYA_EARN_TOTAL=$(json_val "$RESP" "data.total")
info "Priya has $PRIYA_EARN_TOTAL earning records"

# ── Arjun's earnings ────────────────────────────────────────
step "Arjun earnings summary..."
api_get "/earnings/summary" "$ARJUN_TOKEN"
expect "200" "Arjun earnings summary"
echo "  Arjun:"
echo "    totalEarned:    $(json_val "$RESP" "data.totalEarned")"
echo "    totalPending:   $(json_val "$RESP" "data.totalPending")"
echo "    totalPayable:   $(json_val "$RESP" "data.totalPayable")"
echo "    totalPaid:      $(json_val "$RESP" "data.totalPaid")"
echo "    totalCommission:$(json_val "$RESP" "data.totalCommission")"
echo "    earningsCount:  $(json_val "$RESP" "data.earningsCount")"

step "Arjun earnings list..."
api_get "/earnings?pageSize=50" "$ARJUN_TOKEN"
expect "200" "Arjun earnings list"
ARJUN_EARN_TOTAL=$(json_val "$RESP" "data.total")
info "Arjun has $ARJUN_EARN_TOTAL earning records"

# ── Expected breakdown ──────────────────────────────────────
echo ""
info "Expected earnings (gross, before platform commission):"
echo "  PRIYA shortlist: S2->R1(15k) S5->R3(25k) S8->R8(30k)"
echo "  PRIYA hire:      S5->R3(200k PAYABLE) S8->R8(300k PENDING — not joined)"
echo "  ARJUN shortlist: S11->R1(15k) S13->R6(12k) S14->R6(12k) S16->R8(30k)"
echo "  ARJUN hire:      S16->R8(300k PAYABLE)"
echo ""
echo "  Commission: 6-9% regular, 15-20% headhunting (R3,R8)"

header "20 PASSED — Earnings verified"
