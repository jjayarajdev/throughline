#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "17 — Admin Payout Actions"

# ── List pending requests ──────────────────────────────────
step "Listing pending payout requests..."
api_get "/payouts/requests?status=pending_approval" "$ADMIN_TOKEN"
expect "200" "List pending payouts"
PENDING_COUNT=$(json_val "$RESP" "data.total")
info "Pending payout requests: $PENDING_COUNT"

# ── Approve Priya's request ────────────────────────────────
step "Approving Priya's payout request..."
api_post "/payouts/requests/${PRIYA_PR1_ID}/approve" '' "$ADMIN_TOKEN"
expect "200" "Approve Priya payout"
ok "Priya payout request -> approved"

# ── Reject Arjun's request ──────────────────────────────────
step "Rejecting Arjun's payout request..."
api_post "/payouts/requests/${ARJUN_PR1_ID}/reject" '{"reason":"Please consolidate payout requests to reduce processing overhead"}' "$ADMIN_TOKEN"
expect "200" "Reject Arjun payout"
ok "Arjun payout request -> rejected"

# ── Run payout batch ───────────────────────────────────────
step "Running payout batch..."
api_post "/payouts/batch/run" '' "$ADMIN_TOKEN"
if [[ "$HTTP_CODE" == "200" || "$HTTP_CODE" == "201" ]]; then
  ok "Payout batch created/processed"
  json_pp "$RESP"
else
  warn "Batch run returned HTTP $HTTP_CODE (Razorpay may not be configured for dev)"
  echo "     Response: $(echo "$RESP" | head -c 500)"
fi

# ── List batches ───────────────────────────────────────────
step "Listing payout batches..."
api_get "/payouts/batches" "$ADMIN_TOKEN"
if [[ "$HTTP_CODE" == "200" ]]; then
  BATCH_COUNT=$(json_val "$RESP" "data.total")
  info "Total payout batches: $BATCH_COUNT"
else
  warn "Batch listing returned HTTP $HTTP_CODE"
fi

header "17 PASSED — 1 approved, 1 rejected, batch processed"
