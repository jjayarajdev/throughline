#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "06 — Fund Company Wallets"

seed_wallet() {
  local user_id="$1" amount="$2" label="$3"
  step "Seeding $label with $amount..."
  api_post "/admin/dev/seed-wallet" "{\"companyUserId\":\"${user_id}\",\"amount\":${amount}}" "$ADMIN_TOKEN"
  expect "201" "Seed $label"
  local bal=$(json_val "$RESP" "data.balanceAfter")
  ok "$label seeded -> balance: $bal"
}

# Alpha: 5 x 10,00,000 = 50,00,000
# R1: 20*15k=300k, R2: 15*75k=1125k, R3: 10*225k=2250k, R4: 25*8k=200k = 3875k total escrow
seed_wallet "$ALPHA_USER_ID" 1000000 "Alpha (1/5)"
seed_wallet "$ALPHA_USER_ID" 1000000 "Alpha (2/5)"
seed_wallet "$ALPHA_USER_ID" 1000000 "Alpha (3/5)"
seed_wallet "$ALPHA_USER_ID" 1000000 "Alpha (4/5)"
seed_wallet "$ALPHA_USER_ID" 1000000 "Alpha (5/5)"

# Beta: 5 x 10,00,000 = 50,00,000
# R6: 20*12k=240k, R7: 10*60k=600k, R8: 8*330k=2640k, R9: 15*10k=150k, R10: 15*50k=750k = 4380k total escrow
seed_wallet "$BETA_USER_ID" 1000000 "Beta (1/5)"
seed_wallet "$BETA_USER_ID" 1000000 "Beta (2/5)"
seed_wallet "$BETA_USER_ID" 1000000 "Beta (3/5)"
seed_wallet "$BETA_USER_ID" 1000000 "Beta (4/5)"
seed_wallet "$BETA_USER_ID" 1000000 "Beta (5/5)"

# ── Verify balances ──
step "Verifying Alpha balance..."
api_get "/wallet/balance" "$ALPHA_TOKEN"
expect "200" "Alpha balance check"
ALPHA_BAL=$(json_val "$RESP" "data.balance")
ok "Alpha wallet balance: $ALPHA_BAL"

step "Verifying Beta balance..."
api_get "/wallet/balance" "$BETA_TOKEN"
expect "200" "Beta balance check"
BETA_BAL=$(json_val "$RESP" "data.balance")
ok "Beta wallet balance: $BETA_BAL"

header "06 PASSED — Wallets funded (Alpha: $ALPHA_BAL, Beta: $BETA_BAL)"
