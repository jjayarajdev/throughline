#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "21 — Verify Wallets & Transactions"

# ── Alpha wallet ─────────────────────────────────────────────
step "Alpha wallet..."
api_get "/wallet/balance" "$ALPHA_TOKEN"
expect "200" "Alpha wallet"
echo "  Alpha: balance=$(json_val "$RESP" "data.balance")  locked=$(json_val "$RESP" "data.lockedBalance")"

step "Alpha transactions..."
api_get "/wallet/transactions?pageSize=50" "$ALPHA_TOKEN"
expect "200" "Alpha transactions"
ALPHA_TXN=$(json_val "$RESP" "data.total")
info "Alpha has $ALPHA_TXN wallet transactions"

# ── Beta wallet ──────────────────────────────────────────────
step "Beta wallet..."
api_get "/wallet/balance" "$BETA_TOKEN"
expect "200" "Beta wallet"
echo "  Beta:  balance=$(json_val "$RESP" "data.balance")  locked=$(json_val "$RESP" "data.lockedBalance")"

step "Beta transactions..."
api_get "/wallet/transactions?pageSize=50" "$BETA_TOKEN"
expect "200" "Beta transactions"
BETA_TXN=$(json_val "$RESP" "data.total")
info "Beta has $BETA_TXN wallet transactions"

# ── Priya wallet ─────────────────────────────────────────────
step "Priya wallet..."
api_get "/wallet/balance" "$PRIYA_TOKEN"
expect "200" "Priya wallet"
echo "  Priya: balance=$(json_val "$RESP" "data.balance")  locked=$(json_val "$RESP" "data.lockedBalance")"

# ── Arjun wallet ─────────────────────────────────────────────
step "Arjun wallet..."
api_get "/wallet/balance" "$ARJUN_TOKEN"
expect "200" "Arjun wallet"
echo "  Arjun: balance=$(json_val "$RESP" "data.balance")  locked=$(json_val "$RESP" "data.lockedBalance")"

# ── Payout request statuses ──────────────────────────────────
step "All payout requests..."
api_get "/payouts/requests?pageSize=50" "$ADMIN_TOKEN"
expect "200" "List payouts"
PAYOUT_TOTAL=$(json_val "$RESP" "data.total")
info "Total payout requests: $PAYOUT_TOTAL"
node -e "
  const d = JSON.parse(process.argv[1]).data;
  (d.requests || []).forEach(r => {
    console.log('  ' + r.amount.padStart(8) + '  ' + r.status.padEnd(18) + '  ' + (r.recruiter?.fullName || 'N/A'));
  });
" "$RESP" 2>/dev/null || true

header "21 PASSED — Wallet balances + transactions verified"
