#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "15 — Seed Recruiter Bank Details (verified)"

step "Seeding Priya's bank details..."
api_post "/admin/dev/seed-recruiter-bank" "{\"recruiterUserId\":\"${PRIYA_USER_ID}\"}" "$ADMIN_TOKEN"
expect "200" "Seed Priya bank"
ok "Priya: bank verified"

step "Seeding Arjun's bank details..."
api_post "/admin/dev/seed-recruiter-bank" "{\"recruiterUserId\":\"${ARJUN_USER_ID}\"}" "$ADMIN_TOKEN"
expect "200" "Seed Arjun bank"
ok "Arjun: bank verified"

header "15 PASSED — Recruiter bank details seeded + verified"
