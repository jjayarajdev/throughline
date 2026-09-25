#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "03 — Update Profiles"

# ── Company profiles ──
step "Updating Alpha Technologies profile..."
api_put "/companies/me" '{"industry":"Technology","companySize":"51-200","headquarters":"Bangalore","contactPerson":"Raj Kumar","website":"https://alpha-tech.example.com","description":"Leading technology company specializing in enterprise software solutions."}' "$ALPHA_TOKEN"
expect "200" "Alpha profile update"
ok "Alpha profile updated"

step "Updating Beta Solutions profile..."
api_put "/companies/me" '{"industry":"Healthcare","companySize":"11-50","headquarters":"Mumbai","contactPerson":"Meera Nair","website":"https://beta-solutions.example.com","description":"Healthcare technology startup building next-gen patient management systems."}' "$BETA_TOKEN"
expect "200" "Beta profile update"
ok "Beta profile updated"

# ── Recruiter profiles ──
step "Updating Priya profile..."
api_put "/recruiters/me" '{"yearsOfExperience":8,"specializations":["Backend Engineering","DevOps","Cloud Infrastructure"],"linkedinUrl":"https://linkedin.com/in/priya-sharma-demo","bio":"Senior technical recruiter with 8 years in IT staffing.","phone":"+919876543210"}' "$PRIYA_TOKEN"
expect "200" "Priya profile update"
ok "Priya profile updated"

step "Updating Arjun profile..."
api_put "/recruiters/me" '{"yearsOfExperience":5,"specializations":["Frontend","Full Stack","Mobile Development"],"linkedinUrl":"https://linkedin.com/in/arjun-patel-demo","bio":"Specialist recruiter focused on product engineering roles.","phone":"+919876543211"}' "$ARJUN_TOKEN"
expect "200" "Arjun profile update"
ok "Arjun profile updated"

# ── Bank details for priya and arjun ──
step "Setting Priya bank details..."
api_put "/recruiters/me/bank-details" '{"pan":"ABCPS1234K","bankAccount":"1234567890123456","bankIfsc":"SBIN0001234","bankAccountHolderName":"Priya Sharma"}' "$PRIYA_TOKEN"
expect "200" "Priya bank details"
ok "Priya bank details set"

step "Setting Arjun bank details..."
api_put "/recruiters/me/bank-details" '{"pan":"ABCPA5678L","bankAccount":"9876543210987654","bankIfsc":"HDFC0002345","bankAccountHolderName":"Arjun Patel"}' "$ARJUN_TOKEN"
expect "200" "Arjun bank details"
ok "Arjun bank details set"

info "Neha has no profile update or bank details (blocked user)"

header "03 PASSED — 2 company + 2 recruiter profiles updated, 2 bank details set"
