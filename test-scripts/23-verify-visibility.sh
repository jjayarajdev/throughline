#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "23 — Verify Role Visibility System (Phase 4)"

PASS=0 FAIL=0

# ── 0. Top up Alpha wallet for new roles ──
step "Topping up Alpha wallet..."
api_post "/admin/dev/seed-wallet" "{\"companyUserId\":\"${ALPHA_USER_ID}\",\"amount\":1000000}" "$ADMIN_TOKEN"
expect "201" "Seed Alpha"
ok "Alpha wallet topped up"

api_post "/admin/dev/seed-wallet" "{\"companyUserId\":\"${BETA_USER_ID}\",\"amount\":1000000}" "$ADMIN_TOKEN"
expect "201" "Seed Beta"
ok "Beta wallet topped up"

# ── 1. Create an invite_only role ──
step "Creating invite_only role (Alpha)..."
api_post "/roles" '{
  "title":"Security Architect (invite only)",
  "description":"Invite-only security role for verified recruiters only.",
  "roleType":"regular",
  "location":"Bangalore",
  "isRemote":false,
  "employmentType":"full_time",
  "experienceMin":8,
  "experienceMax":15,
  "skills":["Security","Cloud","Penetration Testing"],
  "ctcMin":3000000,
  "ctcMax":5000000,
  "payoutType":"per_hire",
  "payoutPerHire":40000,
  "maxSubmissions":10,
  "maxPerRecruiter":3,
  "visibility":"invite_only"
}' "$ALPHA_TOKEN"
expect "201" "Create invite_only role"
INV_ROLE_ID=$(json_val "$RESP" "data.id")
save_var "INV_ROLE_ID" "$INV_ROLE_ID"
vis=$(json_val "$RESP" "data.visibility")
if [[ "$vis" == "invite_only" ]]; then
  ok "Role created with visibility=invite_only"
  PASS=$((PASS+1))
else
  fail "Expected visibility=invite_only, got $vis"
  FAIL=$((FAIL+1))
fi

# ── 2. Publish the invite_only role ──
step "Publishing invite_only role..."
api_post "/roles/${INV_ROLE_ID}/publish" '{}' "$ALPHA_TOKEN"
expect "200" "Publish invite_only role"
ok "Invite-only role published"

# ── 3. Recruiter should NOT see it in browse (no invitation) ──
step "Priya browses roles — should NOT see invite_only role..."
api_get "/roles?pageSize=50" "$PRIYA_TOKEN"
expect "200" "Browse roles"
has_inv=$(node -e "
  const d = JSON.parse(process.argv[1]);
  const found = (d.data?.items ?? d.data ?? []).some(r => r.id === '$INV_ROLE_ID');
  process.stdout.write(found ? 'yes' : 'no');
" "$RESP")
if [[ "$has_inv" == "no" ]]; then
  ok "Invite-only role correctly hidden from uninvited recruiter"
  PASS=$((PASS+1))
else
  fail "Invite-only role should NOT appear for uninvited recruiter"
  FAIL=$((FAIL+1))
fi

# ── 4. Get Priya's recruiter profile ID ──
step "Getting Priya's recruiter profile ID..."
api_get "/recruiters/me" "$PRIYA_TOKEN"
expect "200" "Get Priya profile"
PRIYA_PROFILE_ID=$(json_val "$RESP" "data.id")
save_var "PRIYA_PROFILE_ID" "$PRIYA_PROFILE_ID"
ok "Priya profile id: $PRIYA_PROFILE_ID"

# ── 5. Company invites Priya ──
step "Alpha invites Priya to invite_only role..."
api_post "/roles/${INV_ROLE_ID}/invite" "{\"recruiterProfileId\":\"${PRIYA_PROFILE_ID}\",\"message\":\"You are a great recruiter!\"}" "$ALPHA_TOKEN"
expect "201" "Invite Priya"
INVITATION_ID=$(json_val "$RESP" "data.id")
save_var "INVITATION_ID" "$INVITATION_ID"
inv_status=$(json_val "$RESP" "data.status")
if [[ "$inv_status" == "pending" ]]; then
  ok "Invitation created with status=pending"
  PASS=$((PASS+1))
else
  fail "Expected invitation status=pending, got $inv_status"
  FAIL=$((FAIL+1))
fi

# ── 6. Priya still can't submit (invitation not yet accepted) ──
step "Priya tries to submit to invite_only role (should fail)..."
api_post "/submissions" "{
  \"roleId\":\"${INV_ROLE_ID}\",
  \"candidateName\":\"Test Candidate\",
  \"candidateEmail\":\"test.inv@example.com\",
  \"candidatePhone\":\"+919999000001\",
  \"s3Key\":\"test/dummy.pdf\",
  \"cvOriginalFilename\":\"test.pdf\",
  \"cvSizeBytes\":1024,
  \"cvMimeType\":\"application/pdf\",
  \"expectedCtc\":3500000,
  \"noticePeriodDays\":30
}" "$PRIYA_TOKEN"
if [[ "$HTTP_CODE" == "403" ]]; then
  ok "Submission correctly blocked — invitation not accepted"
  PASS=$((PASS+1))
else
  fail "Expected 403 for uninvited submission, got $HTTP_CODE"
  FAIL=$((FAIL+1))
fi

# ── 7. Priya lists her invitations ──
step "Priya lists her invitations..."
api_get "/invitations/me" "$PRIYA_TOKEN"
expect "200" "List my invitations"
inv_count=$(node -e "
  const d = JSON.parse(process.argv[1]);
  const items = d.data ?? [];
  process.stdout.write(String(items.length));
" "$RESP")
if [[ "$inv_count" -ge "1" ]]; then
  ok "Priya has $inv_count invitation(s)"
  PASS=$((PASS+1))
else
  fail "Expected at least 1 invitation, got $inv_count"
  FAIL=$((FAIL+1))
fi

# ── 8. Priya accepts the invitation ──
step "Priya accepts the invitation..."
api_post "/invitations/${INVITATION_ID}/accept" '{}' "$PRIYA_TOKEN"
expect "200" "Accept invitation"
acc_status=$(json_val "$RESP" "data.status")
if [[ "$acc_status" == "accepted" ]]; then
  ok "Invitation accepted"
  PASS=$((PASS+1))
else
  fail "Expected invitation status=accepted, got $acc_status"
  FAIL=$((FAIL+1))
fi

# ── 9. Now Priya should see the role in browse ──
step "Priya browses roles again — should now see invite_only role..."
api_get "/roles?pageSize=50" "$PRIYA_TOKEN"
expect "200" "Browse roles"
has_inv=$(node -e "
  const d = JSON.parse(process.argv[1]);
  const found = (d.data?.items ?? d.data ?? []).some(r => r.id === '$INV_ROLE_ID');
  process.stdout.write(found ? 'yes' : 'no');
" "$RESP")
if [[ "$has_inv" == "yes" ]]; then
  ok "Invite-only role now visible after accepted invitation"
  PASS=$((PASS+1))
else
  fail "Invite-only role should appear after accepted invitation"
  FAIL=$((FAIL+1))
fi

# ── 10. Company lists invitations for the role ──
step "Alpha lists invitations for invite_only role..."
api_get "/roles/${INV_ROLE_ID}/invitations" "$ALPHA_TOKEN"
expect "200" "List role invitations"
role_inv_count=$(node -e "
  const d = JSON.parse(process.argv[1]);
  const items = d.data ?? [];
  process.stdout.write(String(items.length));
" "$RESP")
if [[ "$role_inv_count" -ge "1" ]]; then
  ok "Role has $role_inv_count invitation(s)"
  PASS=$((PASS+1))
else
  fail "Expected at least 1 invitation for role"
  FAIL=$((FAIL+1))
fi

# ── 11. Create a preferred visibility role ──
step "Creating preferred visibility role (Beta)..."
api_post "/roles" '{
  "title":"Senior UX Researcher (preferred)",
  "description":"Preferred visibility — only recruiters who have placed before.",
  "roleType":"regular",
  "location":"Mumbai",
  "isRemote":true,
  "employmentType":"full_time",
  "experienceMin":5,
  "experienceMax":10,
  "skills":["UX Research","Interviews","Analytics"],
  "ctcMin":2000000,
  "ctcMax":3500000,
  "payoutType":"per_hire",
  "payoutPerHire":35000,
  "maxSubmissions":10,
  "maxPerRecruiter":3,
  "visibility":"preferred"
}' "$BETA_TOKEN"
expect "201" "Create preferred role"
PREF_ROLE_ID=$(json_val "$RESP" "data.id")
save_var "PREF_ROLE_ID" "$PREF_ROLE_ID"
ok "Preferred role created (id: $PREF_ROLE_ID)"

# ── 12. Publish preferred role ──
step "Publishing preferred role..."
api_post "/roles/${PREF_ROLE_ID}/publish" '{}' "$BETA_TOKEN"
expect "200" "Publish preferred role"
ok "Preferred role published"

# ── 13. Recruiter search ──
step "Alpha searches for recruiters..."
api_get "/recruiters/search?q=priya" "$ALPHA_TOKEN"
expect "200" "Search recruiters"
search_count=$(node -e "
  const d = JSON.parse(process.argv[1]);
  process.stdout.write(String((d.data ?? []).length));
" "$RESP")
if [[ "$search_count" -ge "1" ]]; then
  ok "Recruiter search found $search_count result(s)"
  PASS=$((PASS+1))
else
  fail "Expected at least 1 recruiter in search results"
  FAIL=$((FAIL+1))
fi

# ── 14. Arjun declines an invitation ──
step "Alpha invites Arjun to invite_only role..."
api_get "/recruiters/me" "$ARJUN_TOKEN"
expect "200" "Get Arjun profile"
ARJUN_PROFILE_ID=$(json_val "$RESP" "data.id")
save_var "ARJUN_PROFILE_ID" "$ARJUN_PROFILE_ID"

api_post "/roles/${INV_ROLE_ID}/invite" "{\"recruiterProfileId\":\"${ARJUN_PROFILE_ID}\"}" "$ALPHA_TOKEN"
expect "201" "Invite Arjun"
ARJUN_INV_ID=$(json_val "$RESP" "data.id")

step "Arjun declines the invitation..."
api_post "/invitations/${ARJUN_INV_ID}/decline" '{}' "$ARJUN_TOKEN"
expect "200" "Decline invitation"
dec_status=$(json_val "$RESP" "data.status")
if [[ "$dec_status" == "declined" ]]; then
  ok "Invitation declined successfully"
  PASS=$((PASS+1))
else
  fail "Expected invitation status=declined, got $dec_status"
  FAIL=$((FAIL+1))
fi

echo ""
info "Results: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]] && header "23 PASSED — Role visibility system verified" \
                   || header "23 FAILED — $FAIL check(s) failed"
[[ $FAIL -gt 0 ]] && exit 1
exit 0
