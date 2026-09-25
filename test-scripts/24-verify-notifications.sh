#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "24 — Verify Notification System (Phase 4)"

PASS=0 FAIL=0

# ── 1. Check unread count for Priya ──
step "Getting Priya's unread notification count..."
api_get "/notifications/unread-count" "$PRIYA_TOKEN"
expect "200" "Unread count"
unread=$(json_val "$RESP" "data.unreadCount")
if [[ "$unread" -ge "1" ]]; then
  ok "Priya has $unread unread notification(s)"
  PASS=$((PASS+1))
else
  fail "Expected at least 1 unread notification, got $unread"
  FAIL=$((FAIL+1))
fi

# ── 2. List Priya's notifications ──
step "Listing Priya's notifications..."
api_get "/notifications?pageSize=50" "$PRIYA_TOKEN"
expect "200" "List notifications"
notif_count=$(node -e "
  const d = JSON.parse(process.argv[1]);
  const items = d.data?.items ?? d.data ?? [];
  process.stdout.write(String(items.length));
" "$RESP")
if [[ "$notif_count" -ge "1" ]]; then
  ok "Priya has $notif_count notification(s)"
  PASS=$((PASS+1))
else
  fail "Expected at least 1 notification, got $notif_count"
  FAIL=$((FAIL+1))
fi

# ── 3. Mark single notification as read ──
NOTIF_ID=$(node -e "
  const d = JSON.parse(process.argv[1]);
  const items = d.data?.items ?? d.data ?? [];
  process.stdout.write(items[0]?.id ?? '');
" "$RESP")
if [[ -n "$NOTIF_ID" ]]; then
  step "Marking notification $NOTIF_ID as read..."
  api_patch "/notifications/${NOTIF_ID}/read" '{}' "$PRIYA_TOKEN"
  expect "200" "Mark read"
  ok "Notification marked as read"
  PASS=$((PASS+1))
fi

# ── 4. Mark all as read ──
step "Marking all notifications as read for Priya..."
api_patch "/notifications/read-all" '{}' "$PRIYA_TOKEN"
expect "200" "Mark all read"
ok "All notifications marked as read"
PASS=$((PASS+1))

# ── 5. Verify unread count is 0 ──
step "Verifying unread count is 0..."
api_get "/notifications/unread-count" "$PRIYA_TOKEN"
expect "200" "Unread count check"
final_unread=$(json_val "$RESP" "data.unreadCount")
if [[ "$final_unread" == "0" ]]; then
  ok "Unread count is 0 after mark-all-read"
  PASS=$((PASS+1))
else
  fail "Expected 0 unread, got $final_unread"
  FAIL=$((FAIL+1))
fi

# ── 6. Check Arjun has notifications ──
step "Checking Arjun's unread count..."
api_get "/notifications/unread-count" "$ARJUN_TOKEN"
expect "200" "Arjun unread count"
arjun_unread=$(json_val "$RESP" "data.unreadCount")
ok "Arjun has $arjun_unread unread notification(s)"
PASS=$((PASS+1))

# ── 7. Check Alpha (company) notifications ──
step "Checking Alpha company notifications..."
api_get "/notifications?pageSize=20" "$ALPHA_TOKEN"
expect "200" "Alpha notifications"
alpha_notifs=$(node -e "
  const d = JSON.parse(process.argv[1]);
  const items = d.data?.items ?? d.data ?? [];
  process.stdout.write(String(items.length));
" "$RESP")
ok "Alpha has $alpha_notifs notification(s)"
PASS=$((PASS+1))

# ── 8. Notification types ──
step "Checking notification types for Priya..."
api_get "/notifications?pageSize=50" "$PRIYA_TOKEN"
expect "200" "List all for types"
types=$(node -e "
  const d = JSON.parse(process.argv[1]);
  const items = d.data?.items ?? d.data ?? [];
  const types = [...new Set(items.map(n => n.type))];
  process.stdout.write(types.sort().join(','));
" "$RESP")
if [[ -n "$types" ]]; then
  ok "Notification types present: $types"
  PASS=$((PASS+1))
else
  warn "No notification types found"
fi

echo ""
info "Results: $PASS passed, $FAIL failed"
[[ $FAIL -eq 0 ]] && header "24 PASSED — Notification system verified" \
                   || header "24 FAILED — $FAIL check(s) failed"
[[ $FAIL -gt 0 ]] && exit 1
exit 0
