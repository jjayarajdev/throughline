#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "16 — Create Payout Requests"

# ── Check earnings summaries ────────────────────────────────
step "Priya earnings summary..."
api_get "/earnings/summary" "$PRIYA_TOKEN"
expect "200" "Priya earnings summary"
PRIYA_PAYABLE=$(json_val "$RESP" "data.totalPayable")
PRIYA_PENDING=$(json_val "$RESP" "data.totalPending")
info "Priya — payable: $PRIYA_PAYABLE, pending: $PRIYA_PENDING"

step "Arjun earnings summary..."
api_get "/earnings/summary" "$ARJUN_TOKEN"
expect "200" "Arjun earnings summary"
ARJUN_PAYABLE=$(json_val "$RESP" "data.totalPayable")
ARJUN_PENDING=$(json_val "$RESP" "data.totalPending")
info "Arjun — payable: $ARJUN_PAYABLE, pending: $ARJUN_PENDING"

# ── Check wallet balances ──────────────────────────────────
step "Priya wallet balance..."
api_get "/wallet/balance" "$PRIYA_TOKEN"
expect "200" "Priya wallet"
info "Priya wallet: balance=$(json_val "$RESP" "data.balance"), locked=$(json_val "$RESP" "data.lockedBalance")"

step "Arjun wallet balance..."
api_get "/wallet/balance" "$ARJUN_TOKEN"
expect "200" "Arjun wallet"
info "Arjun wallet: balance=$(json_val "$RESP" "data.balance"), locked=$(json_val "$RESP" "data.lockedBalance")"

# ── Create payout requests ─────────────────────────────────
step "Priya requests payout of 10,000..."
api_post "/payouts/request" '{"amount":10000}' "$PRIYA_TOKEN"
expect "201" "Priya payout request"
PRIYA_PR1_ID=$(json_val "$RESP" "data.id")
save_var "PRIYA_PR1_ID" "$PRIYA_PR1_ID"
ok "Priya payout request created (id: $PRIYA_PR1_ID)"

step "Arjun requests payout of 8,000..."
api_post "/payouts/request" '{"amount":8000}' "$ARJUN_TOKEN"
expect "201" "Arjun payout request 1"
ARJUN_PR1_ID=$(json_val "$RESP" "data.id")
save_var "ARJUN_PR1_ID" "$ARJUN_PR1_ID"
ok "Arjun payout request 1 created (id: $ARJUN_PR1_ID)"

header "16 PASSED — 2 payout requests created (Priya x1, Arjun x1)"
