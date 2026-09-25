#!/usr/bin/env bash
# Smoke-tests the Throughline API: logs in, then hits the endpoints behind the main screens and
# prints one line per call (HTTP status, item count where the body is a paged result).
# Usage: scripts/smoke-api.sh [base-url]   (default http://localhost:5084/api)
set -uo pipefail
BASE="${1:-http://localhost:5084/api}"
EMAIL="${SMOKE_EMAIL:-jjayaraj@gmail.com}"
fail=0

TOKEN=$(curl -s -X POST "$BASE/Auth/login" -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"x\"}" | python3 -c 'import sys,json; d=json.load(sys.stdin); print(d.get("data",{}).get("token") or d.get("token") or "")' 2>/dev/null)
if [ -z "$TOKEN" ]; then echo "LOGIN FAILED for $EMAIL at $BASE"; exit 1; fi
echo "login ok ($EMAIL)"

call() { # method path [json-body]
  local m=$1 p=$2 body=${3:-}
  local out code
  if [ -n "$body" ]; then
    out=$(curl -s -w '\n%{http_code}' -X "$m" "$BASE$p" -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' -d "$body")
  else
    out=$(curl -s -w '\n%{http_code}' -X "$m" "$BASE$p" -H "Authorization: Bearer $TOKEN")
  fi
  code=$(printf '%s' "$out" | tail -1); body=$(printf '%s' "$out" | sed '$d')
  local info
  info=$(printf '%s' "$body" | python3 -c "
import sys,json
try: d=json.load(sys.stdin)
except Exception: print('non-json'); sys.exit()
x=d.get('data',d) if isinstance(d,dict) else d
if isinstance(x,dict) and isinstance(x.get('items'),list): print('items=%d total=%s' % (len(x['items']), x.get('totalCount', x.get('totalRecords','?'))))
elif isinstance(x,list): print('list=%d' % len(x))
elif isinstance(d,dict) and d.get('message'): print(str(d['message'])[:90])
else: print('ok')" 2>/dev/null)
  if [ "$code" != "200" ]; then fail=$((fail+1)); printf '  FAIL %s %-55s %s %s\n' "$m" "$p" "$code" "$info"; else printf '  ok   %s %-55s %s %s\n' "$m" "$p" "$code" "$info"; fi
}

PAGE='{"pageNumber":1,"pageSize":10}'
HIRING='{"pageNumber":1,"pageSize":10,"sortColumns":[],"hiringStatusIds":[],"isBin":false,"isAssigned":false,"isParent":false,"tatDurationId":0,"financialYear":1,"quarterId":1}'

call GET  "/Dashboard"
call GET  "/Master/26"
call GET  "/Master/31"
call GET  "/User/user-roles"
call POST "/User/paged" "$PAGE"
call POST "/HiringRequest/paged" "$HIRING"
call GET  "/HiringRequest/list"
call POST "/Partner/paged?statusId=25001,25002" "$PAGE"
call GET  "/Partner/list"
call POST "/CandidateForm/paged/false?intakeStatusId=1,2,3,4" "$PAGE"
call POST "/CandidateForm/paged/true" "$PAGE"
call POST "/CandidateForm/candidates/screening-list" "$PAGE"
call POST "/CandidateForm/candidates/interview-list" "$PAGE"
call POST "/CandidateBin/paged/947" "$PAGE"
call POST "/InterviewRound/paged" "$PAGE"
call POST "/Engagement/paged" "$PAGE"
call POST "/ContactMatrix/paged" "$PAGE"
call POST "/EscalationMatrix/paged" "$PAGE"
call POST "/JobDetails/paged" "$PAGE"
call POST "/Notification/paged" "$PAGE"
call POST "/SearchColumn/paged" "$PAGE"
call GET  "/SearchColumn/list/2"
call POST "/onboarding/CandidatePersonalDetails/paged/1" "$PAGE"
call POST "/CandidateForm/paged/partner/1?intakeStatusId=1,2,3,4" "$PAGE"

echo; if [ "$fail" -eq 0 ]; then echo "SMOKE PASSED"; else echo "SMOKE: $fail failing call(s)"; exit 1; fi
