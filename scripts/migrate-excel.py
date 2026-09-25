#!/usr/bin/env python3
"""
EpiCenter — load the legacy "Migrated Data" workbook into the Epicenterv2 schema.

    python3 scripts/migrate-excel.py "Migrated Data-Till-23rdJune2025.xlsx" out.sql
    sqlcmd -S localhost,1433 -U sa -P ... -C -d Epicenterv2 -i out.sql

Generates ONE transactional T-SQL script that:
  * clears every table it loads (re-runnable),
  * seeds lookups from Domain/Enums/MasterType.cs (M_MasterData), M_JobLevel, geography,
    QuarterDateRanges, M_Configuration, Roles,
  * loads Users, Domains/SubDomains, Skills, Partners (+Engagements, PartnerEmpanel),
    SOW/PO, Hiring (+JobDetails, JobPositions, RCMSDetails, PartnerCategories,
    HiringReqPartner), candidates (CandidateForms), InterviewRounds, InterviewSlotAllocation.

The workbook is a legacy-system export with free-text categorical columns; mappings and
fuzzy matching live in this file. Unmatched values are reported at the end, never dropped
silently (rows keep NULL FKs).
"""
import sys, re, collections, difflib, json, datetime as dt
from pathlib import Path
import openpyxl

XLSX = sys.argv[1]
OUT = sys.argv[2]
ROOT = Path(__file__).resolve().parent.parent
ENUMS = ROOT / "apps/throughline-api/Domain/Enums/MasterType.cs"
ADMIN_EMAIL = "jjayaraj@gmail.com"
NOW = dt.datetime(2025, 6, 23, 12, 0, 0)   # "data till 23 June 2025"
SYS = 1                                    # CreatedBy for migrated rows (Migration Services user)

# --------------------------------------------------------------------------- SQL helpers
out = []
def q(v):
    """SQL literal."""
    if v is None: return "NULL"
    if isinstance(v, bool): return "1" if v else "0"
    if isinstance(v, (int, float)):
        return repr(int(v)) if float(v).is_integer() else repr(float(v))
    if isinstance(v, dt.datetime): return "'" + v.strftime("%Y-%m-%d %H:%M:%S") + "'"
    if isinstance(v, dt.date): return "'" + v.strftime("%Y-%m-%d") + "'"
    if isinstance(v, dt.time): return "'" + v.strftime("%H:%M:%S") + "'"
    s = str(v).replace("\x00", "").replace("'", "''")
    return "N'" + s + "'"

def insert(table, rows, identity=False):
    """rows: list of dicts (same keys)."""
    if not rows: return
    cols = list(rows[0].keys())
    if identity: out.append(f"SET IDENTITY_INSERT dbo.[{table}] ON;")
    for i in range(0, len(rows), 500):
        chunk = rows[i:i+500]
        vals = ",\n".join("(" + ",".join(q(r.get(c)) for c in cols) + ")" for r in chunk)
        out.append(f"INSERT INTO dbo.[{table}] ({','.join('['+c+']' for c in cols)}) VALUES\n{vals};")
    if identity: out.append(f"SET IDENTITY_INSERT dbo.[{table}] OFF;")

def audit(created=None, by=SYS):
    return {"IsActive": True, "CreatedBy": by, "CreatedAt": created or NOW, "UpdatedBy": by, "UpdatedAt": created or NOW}

# --------------------------------------------------------------------------- text helpers
def clean(s):
    if s is None: return None
    if isinstance(s, (dt.datetime, dt.date, dt.time, bool)): return s
    if isinstance(s, float) and s.is_integer(): s = int(s)
    s = str(s).replace("_x000D_", "").replace("Â\xa0", " ").replace("\xa0", " ").replace("â€‚", " ")
    s = s.replace("â€¢", "•").replace("â€™", "'").replace("â€“", "-")
    s = re.sub(r"[ \t]+", " ", s).strip()
    return s if s not in ("", "NULL", "#N/A", "Not Found", "None") else None

def norm(s):
    s = clean(s) or ""
    s = s.lower().replace("&", "and").replace("-", " ")
    return re.sub(r"[^a-z0-9 ]", "", re.sub(r"\s+", " ", s)).strip()

def to_dt(v):
    v = clean(v)
    if v is None: return None
    if isinstance(v, dt.datetime): return v
    if isinstance(v, dt.date): return dt.datetime(v.year, v.month, v.day)
    m = re.match(r"(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})", str(v))
    if m: return dt.datetime.strptime(m.group(1) + " " + m.group(2), "%Y-%m-%d %H:%M:%S")
    m = re.match(r"(\d{4}-\d{2}-\d{2})", str(v))
    if m: return dt.datetime.strptime(m.group(1), "%Y-%m-%d")
    return None

def to_int(v):
    v = clean(v)
    try: return int(float(v))
    except (TypeError, ValueError): return None

def trunc(s, n):
    s = clean(s)
    return str(s)[:n] if s is not None else None

def jarr(ids):
    """List<int>/List<string> entity properties are stored as JSON arrays (EF value conversion)."""
    ids = [i for i in (ids or []) if i is not None]
    return json.dumps(ids) if ids else None

def yesno(v):
    v = (clean(v) or "").lower()
    return "Yes" if v.startswith("y") else "No" if v.startswith("n") else None

# --------------------------------------------------------------------------- workbook
wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
def sheet(name):
    ws = wb[name]; it = ws.iter_rows(values_only=True)
    hdr = [str(h).strip() if h is not None else f"_{i}" for i, h in enumerate(next(it))]
    rows = []
    for r in it:
        if all(c in (None, "") for c in r): continue
        rows.append({hdr[i]: r[i] for i in range(len(hdr)) if i < len(r)})
    return rows
S_USERS, S_DOM, S_SUB, S_SOW, S_PART, S_HIR, S_INT = (sheet(n) for n in
    ["Users", "Domains", "SubDomains", "SOW Details", "PArtners", "Hiring", "Interview Slots"])
unmatched = collections.defaultdict(collections.Counter)

# =========================================================================== 1. M_MasterData from enums
MT = {}   # MASTER_TYPE name -> id
master = {}  # id -> (typeId, name)
src = ENUMS.read_text(encoding="utf-8", errors="replace")
for m in re.finditer(r"enum\s+(\w+)\s*\{(.*?)\}", src, re.S):
    ename, body = m.group(1), m.group(2)
    body = re.sub(r"//[^\n]*", "", body)
    members = re.findall(r"(\w+)\s*=\s*(\d+)", body)
    if ename == "MASTER_TYPE":
        MT = {k: int(v) for k, v in members}; continue
    for k, v in members:
        v = int(v)
        if v >= 1000 and v // 1000 in MT.values():
            master.setdefault(v, (v // 1000, k))
def pretty(k):
    special = {"PS_GCC": "PS GCC", "MSA_MATER_SERVICE_AGREEMENT": "MSA", "POTAC": "POTAC", "WIP": "Open-WIP",
               "UIDAI": "UIDAI", "RPA": "RPA", "TECHNICAL_OPS": "Tech/Ops", "OPS": "Ops", "RMOwner": "RM Owner"}
    if k in special: return special[k]
    return " ".join(w.capitalize() for w in k.lower().split("_"))
extra = {2004: (2, "Lifecycle Services"),
         40001: (40, "Badged"), 40002: (40, "Contract"), 40003: (40, "Intern"),
         56001: (56, "SOW"), 56002: (56, "CR"),
         66001: (66, "Budget Constraints"), 66002: (66, "Requirement Changed"), 66003: (66, "Customer Decision Pending"),
         83001: (83, "Specific Partners"), 83002: (83, "Proxy Partner"), 83003: (83, "Recommended Partners"),
         86001: (86, "Tier 1"), 86002: (86, "Tier 2"), 86003: (86, "Tier 3"),
         61001: (61, "Male"), 61002: (61, "Female"), 61003: (61, "Other"),
         60001: (60, "Yes"), 60002: (60, "No"),
         33001: (33, "Technical Skills"), 33002: (33, "Communication"), 33003: (33, "Problem Solving"), 33004: (33, "Culture Fit"),
         24001: (24, "Rate Not Agreed"), 24002: (24, "Compliance Gap"), 24003: (24, "Capability Mismatch"),
         }
for k, v in extra.items(): master.setdefault(k, v)
md_rows = [{"Id": i, "Name": pretty(n) if i not in extra else n, "OrderId": i % 1000, "MasterTypeId": t, **audit()}
           for i, (t, n) in sorted(master.items())]
E = lambda name: next(i for i, (t, n) in master.items() if n == name and t == MT[name.split(".")[0]]) if "." in name else None
def MID(typ, member):
    t = MT[typ]
    for i, (tt, n) in master.items():
        if tt == t and n == member: return i
    raise KeyError((typ, member))

# =========================================================================== 2. geography
countries = [{"Id": 1, "Name": "India", "CountryCode": "IN", "PhoneMaxLength": 10, **audit()},
             {"Id": 2, "Name": "Malaysia", "CountryCode": "MY", "PhoneMaxLength": 10, **audit()}]
state_list = ["Karnataka", "Maharashtra", "Telangana", "Tamil Nadu", "Haryana", "Delhi", "Uttar Pradesh",
              "West Bengal", "Gujarat", "Odisha", "Chhattisgarh", "Andhra Pradesh", "Kerala", "Madhya Pradesh", "Rajasthan", "Punjab"]
states = [{"Id": i + 1, "Name": n, "CountryId": 1, **audit()} for i, n in enumerate(state_list)]
SID = {n: i + 1 for i, n in enumerate(state_list)}
city_list = [("Bengaluru", "Karnataka"), ("Hubli", "Karnataka"), ("Mysuru", "Karnataka"), ("Mangaluru", "Karnataka"),
             ("Pune", "Maharashtra"), ("Mumbai", "Maharashtra"), ("Nagpur", "Maharashtra"), ("Nashik", "Maharashtra"),
             ("Hyderabad", "Telangana"), ("Chennai", "Tamil Nadu"), ("Coimbatore", "Tamil Nadu"), ("Salem", "Tamil Nadu"),
             ("Madurai", "Tamil Nadu"), ("Gurugram", "Haryana"), ("New Delhi", "Delhi"), ("Noida", "Uttar Pradesh"),
             ("Greater Noida", "Uttar Pradesh"), ("Lucknow", "Uttar Pradesh"), ("Raebareli", "Uttar Pradesh"),
             ("Kolkata", "West Bengal"), ("Ahmedabad", "Gujarat"), ("Bhubaneswar", "Odisha"), ("Raipur", "Chhattisgarh"),
             ("Visakhapatnam", "Andhra Pradesh"), ("Vijayawada", "Andhra Pradesh"), ("Kochi", "Kerala"),
             ("Thiruvananthapuram", "Kerala"), ("Indore", "Madhya Pradesh"), ("Bhopal", "Madhya Pradesh"),
             ("Jaipur", "Rajasthan"), ("Chandigarh", "Punjab"), ("Tirupati", "Andhra Pradesh"), ("Belagavi", "Karnataka")]
cities = [{"Id": i + 1, "Name": c, "StateId": SID[s], **audit()} for i, (c, s) in enumerate(city_list)]
CID = {c: i + 1 for i, (c, s) in enumerate(city_list)}
CSTATE = {c: SID[s] for c, s in city_list}
def city_of(loc):
    """Map free-text location -> (cityId, stateId). Returns (None, None) when unknown."""
    n = norm(loc)
    if not n: return (None, None)
    first = re.split(r"[/,(]", clean(loc))[0]
    n = norm(first)
    rules = [("ban", "Bengaluru"), ("beng", "Bengaluru"), ("blr", "Bengaluru"), ("pune", "Pune"), ("hyd", "Hyderabad"),
             ("mum", "Mumbai"), ("chen", "Chennai"), ("gur", "Gurugram"), ("greater noida", "Greater Noida"),
             ("noida", "Noida"), ("kolk", "Kolkata"), ("ahm", "Ahmedabad"), ("coim", "Coimbatore"), ("bhub", "Bhubaneswar"),
             ("hubli", "Hubli"), ("hubb", "Hubli"), ("salem", "Salem"), ("new delhi", "New Delhi"), ("delhi", "New Delhi"), ("raeb", "Raebareli"),
             ("tirup", "Tirupati"), ("belg", "Belagavi"), ("bela", "Belagavi"), ("bng", "Bengaluru"), ("bnegal", "Bengaluru"), ("begnal", "Bengaluru"),
             ("mys", "Mysuru"), ("mang", "Mangaluru"), ("nag", "Nagpur"), ("nash", "Nashik"), ("madu", "Madurai"),
             ("luck", "Lucknow"), ("raip", "Raipur"), ("vizag", "Visakhapatnam"), ("visak", "Visakhapatnam"),
             ("vijay", "Vijawada"), ("kochi", "Kochi"), ("cochin", "Kochi"), ("trivan", "Thiruvananthapuram"),
             ("indore", "Indore"), ("bhopal", "Bhopal"), ("jaipur", "Jaipur"), ("chandi", "Chandigarh")]
    for pre, c in rules:
        if n.startswith(pre) and c in CID: return (CID[c], CSTATE[c])
    if n in ("b", "ban", "banga"): return (CID["Bengaluru"], CSTATE["Bengaluru"])
    for s in state_list:
        if n == norm(s): return (None, SID[s])
    unmatched["location"][clean(loc)] += 1
    return (None, None)
def state_of(name):
    n = norm(name)
    for s in state_list:
        if n == norm(s): return SID[s]
    return None

# =========================================================================== 3. Users & Roles
roles = [("ADMIN", 1), ("HIRINGMANAGER", 2), ("VENDORMANAGER", 3), ("PARTNER", 4), ("PANEL", 5), ("RMOwner", 6),
         ("BETApprover", 7), ("DomainManager", 9), ("Leadership", 10), ("BETMember", 11)]
role_rows = [{"RoleId": i, "RoleName": n, "CanOnHold": n in ("ADMIN", "HIRINGMANAGER", "RMOwner"), **audit()} for n, i in roles]
RID = dict(roles)

users = []            # dict rows
by_email = {}         # email -> UserId
by_tokens = []        # (set(tokens), UserId, fullname)
def split_name(full):
    full = clean(full) or ""
    parts = full.replace(",", " ").split()
    if not parts: return ("", "")
    return (parts[0], " ".join(parts[1:])) if len(parts) > 1 else (parts[0], "")
for r in S_USERS:
    uid = int(r["id"]) + 1                     # legacy ids start at 0
    email = (clean(r["email"]) or f"user{uid}@unknown.local").lower()
    full = clean(r["full_name"]) or email.split("@")[0]
    nt = clean(r["nt_id"]); uname = nt.split(":")[-1] if nt else email.split("@")[0]
    fn, ln = split_name(full)
    created = to_dt(r["created_at"]) or NOW
    users.append({"UserId": uid, "Username": uname, "Email": email, "FirstName": fn, "LastName": ln,
                  "LastLogin": to_dt(r.get("current_sign_in_at")), "NameTypeId": 5001,
                  "EmployeeId": trunc(to_int(r.get("emp_id")), 10), "FullName": trunc(full, 200),
                  **audit(created)})
    by_email[email] = uid
    by_tokens.append((set(norm(full).split()), uid, full))
next_uid = max(u["UserId"] for u in users) + 1
def add_user(email, full, uname=None):
    global next_uid
    email = email.lower()
    if email in by_email: return by_email[email]
    uid = next_uid; next_uid += 1
    fn, ln = split_name(full)
    users.append({"UserId": uid, "Username": uname or email.split("@")[0], "Email": email, "FirstName": fn, "LastName": ln,
                  "LastLogin": None, "NameTypeId": 5001, "EmployeeId": None, "FullName": trunc(full, 200), **audit()})
    by_email[email] = uid; by_tokens.append((set(norm(full).split()), uid, full))
    return uid
ADMIN_UID = add_user(ADMIN_EMAIL, "Local Admin", "admin")

def find_user(text, kind="user"):
    """email or 'Last, First' / 'First Last' -> UserId or None."""
    t = clean(text)
    if not t: return None
    if "@" in t:
        e = t.lower().strip()
        if e in by_email: return by_email[e]
        unmatched[kind][t] += 1; return None
    toks = set(norm(t).split()) - {"mr", "ms", "dr"}
    if not toks: return None
    best = None; best_score = 0
    for uts, uid, full in by_tokens:
        if not uts: continue
        inter = len(toks & uts)
        if inter == 0: continue
        score = inter / max(len(toks), len(uts))
        if inter >= min(2, len(toks)) and score > best_score:
            best, best_score = uid, score
    if best and best_score >= 0.5: return best
    unmatched[kind][t] += 1; return None

user_roles = {}   # (uid, roleId, partnerId) -> assigned
def give_role(uid, role, partner=None):
    if uid: user_roles.setdefault((uid, RID[role], partner), True)
give_role(ADMIN_UID, "ADMIN")
give_role(by_email.get("migration.services@example.com"), "ADMIN")

# =========================================================================== 4. Domains / SubDomains
domains = []; DOM = {}   # norm name -> id
for r in S_DOM:
    did = int(r["id"]); name = clean(r["name"])
    mgr = find_user(r.get("domain_manager"), "domain manager")
    give_role(mgr, "DomainManager")
    domains.append({"Id": did, "Name": trunc(name, 100), "DomainManagerId": mgr, "IsActive": bool(r.get("is_active", 1)),
                    "CreatedBy": SYS, "CreatedAt": to_dt(r.get("created_at")) or NOW, "UpdatedBy": SYS, "UpdatedAt": NOW})
    DOM[norm(name)] = did
def domain_id(name, create=True):
    n = norm(name)
    if not n: return None
    if n in DOM: return DOM[n]
    m = difflib.get_close_matches(n, DOM.keys(), n=1, cutoff=0.8)
    if m: return DOM[m[0]]
    if not create: return None
    did = max(d["Id"] for d in domains) + 1
    domains.append({"Id": did, "Name": trunc(clean(name), 100), "DomainManagerId": None, **audit()})
    DOM[n] = did; unmatched["domain (created)"][clean(name)] += 1
    return did

subdomains = []; SUB = {}   # (domainId, norm) -> id
for r in S_SUB:
    sid = int(r["id"]); name = clean(r["name"]); did = domain_id(r.get("practices")) or to_int(r.get("practice_id"))
    mgr = find_user(r.get("leader_email"), "subdomain leader") or find_user(r.get("leader_name"), "subdomain leader")
    give_role(mgr, "DomainManager")
    subdomains.append({"Id": sid, "Name": trunc(name, 100), "DomainId": did, "SubDomainManagerId": mgr,
                       "IsActive": bool(r.get("is_active", 1)), "CreatedBy": SYS, "CreatedAt": NOW, "UpdatedBy": SYS, "UpdatedAt": NOW})
    SUB[(did, norm(name))] = sid
SUB_BY_NAME = collections.defaultdict(list)
for (did, n), sid in SUB.items(): SUB_BY_NAME[n].append((did, sid))
def subdomain_id(name, did):
    n = norm(name)
    if not n: return None
    if (did, n) in SUB: return SUB[(did, n)]
    cands = [k[1] for k in SUB.keys() if k[0] == did] if did else list(SUB_BY_NAME.keys())
    m = difflib.get_close_matches(n, cands, n=1, cutoff=0.8)
    if m:
        return SUB[(did, m[0])] if did and (did, m[0]) in SUB else SUB_BY_NAME[m[0]][0][1]
    if n in SUB_BY_NAME: return SUB_BY_NAME[n][0][1]
    sid = max(s["Id"] for s in subdomains) + 1
    subdomains.append({"Id": sid, "Name": trunc(clean(name), 100), "DomainId": did, "SubDomainManagerId": None, **audit()})
    SUB[(did, n)] = sid; SUB_BY_NAME[n].append((did, sid)); unmatched["subdomain (created)"][clean(name)] += 1
    return sid

# =========================================================================== 5. Skills
skills = []; SK = {}
def skill_ids(text, primary):
    ids = []
    for tok in re.split(r"[,\n;]", clean(text) or ""):
        t = re.sub(r"\s+", " ", tok).strip(" .-")
        if not (2 <= len(t) <= 60) or t.lower() in ("na", "n/a", "nil", "none"): continue
        k = t.lower()
        if k not in SK:
            SK[k] = len(skills) + 1
            skills.append({"Id": SK[k], "Name": t[:200], "IsPrimary": primary, **audit()})
        ids.append(SK[k])
    return jarr(list(dict.fromkeys(ids)))

# =========================================================================== 6. Partners
partners = []; PN = {}   # norm -> id
ALIAS = {"i square soft": "isquaretek", "spesh talent": "speshtalent", "truetech": "true tech", "srkay": "srkay",
         "allegis": "teksystems", "teamlease digital": "teamlease", "hiyamee private limited": "hiyamee",
         "mlogica computechindia pvt ltd": "mlogica"}
NAME_FIX = {"CaLife Cycle Servicesoft Pvt. Ltd": "Calsoft Pvt. Ltd"}   # legacy export replaced "LS" with "Life Cycle Services"
BU = {"ps gcc": 2001, "uidai": 2002, "rpa": 2003, "life cycle services": 2004, "lifecycle services": 2004}
def bu_id(v):
    n = norm(v)
    return BU.get(n) or (2001 if "gcc" in n else 2004 if "life" in n else 2002 if "uidai" in n else None)
def partner_key(name):
    n = norm(name)
    n = ALIAS.get(n, n)
    n = re.sub(r"\b(private|pvt|ltd|limited|technologies|technology|services|india|p|global|solutions|corporation|inc|digital|systems|computech|cybersecurity|software)\b", "", n)
    n = re.sub(r"\s+", " ", n).strip()
    return ALIAS.get(n, n)
def partner_id(name, create=True, **attrs):
    if not clean(name): return None
    k = partner_key(name)
    if k in PN: return PN[k]
    m = difflib.get_close_matches(k, PN.keys(), n=1, cutoff=0.85)
    if m: return PN[m[0]]
    for pk in PN:                                   # first-word match (e.g. "primus global" -> "primus")
        if pk and k.split()[0] == pk.split()[0] and len(k.split()[0]) > 3: return PN[pk]
    if not create: return None
    pid = len(partners) + 1
    cid, sid = city_of(attrs.get("city") or "Bengaluru")
    pname = NAME_FIX.get(clean(name), clean(name))
    partners.append({"Id": pid, "PartnerName": trunc(pname, 200), "Nickname": clean(attrs.get("nick")) or pname,
                     "PartnerStatusId": 19001 if norm(attrs.get("status", "Active")) == "active" else 19002,
                     "StartDate": to_dt(attrs.get("start")) or NOW, "CountryId": 1, "StateId": sid, "CityId": cid,
                     "Address": clean(attrs.get("address")), "DomainIds": None, "SubDomainIds": None, "SkillIds": None,
                     "ApprovedBy": ADMIN_UID, "ApproverName": "Local Admin", "ApproverEmail": ADMIN_EMAIL, "ApprovedStatus": True,
                     "ApprovedDate": to_dt(attrs.get("start")) or NOW, "IsEmailSent": True, "IsEmpaneledEnabled": True,
                     "PartnerCategoryId": 83001, "ServicingCountryId": 1, "LastActivatedDate": to_dt(attrs.get("start")) or NOW,
                     "PartnerTireId": 86001, "_bu": bu_id(attrs.get("bu") or "PS GCC"), "_end": to_dt(attrs.get("end")),
                     **audit(to_dt(attrs.get("start")))})
    PN[k] = pid
    if not attrs: unmatched["partner (created from reference)"][pname] += 1
    return pid
for r in S_PART:
    partner_id(r["PartnerName"], nick=r.get("Nickname"), status=r.get("Status"), start=r.get("StartDate"), end=r.get("EndDate"),
               bu=r.get("BusinessUnit"), address=r.get("Address"), city=r.get("City"))

if "--debug-partners" in sys.argv:
    for nm in ["Badged", "Proxy", "Entrans", "Randstad Technologies", "Allegis Services India Pvt Ltd", "I Square Soft", "SRKAY", "Cemetrix ", "Spesh Talent", "Truetech", "Sysnet Global Technologies (P) Ltd", "CaLife Cycle Servicesoft Private Limited", "Teamlease Digital", "LTIMindtree Ltd. "]:
        pid = partner_id(nm, create=False); print("  partner ref", repr(nm), "->", partners[pid-1]["PartnerName"] if pid else None)
    print("  sheet partners:", [p["PartnerName"] for p in partners])
# =========================================================================== 7. SOW / PO / Empanel / Engagements
sows = []; sowcrs = []; pos = []; empanel = {}; SOW_BY_PARTNER = {}
for r in S_SOW:
    pid = partner_id(r["Vendor Name"])
    start, end = to_dt(r["Start Date"]) or NOW, to_dt(r["End Date"]) or NOW
    tcv = float(to_int(r["TCV Value"]) or 0)
    is_cr = norm(r.get("SOW/CR")) == "cr" and pid in SOW_BY_PARTNER
    gp, contract = clean(r.get("GP connection ID")), clean(r.get("Contract ID"))
    agreement = 1002 if "potac" in norm(r.get("Agreement Type")) else 1001
    if is_cr:
        sowcrs.append({"Id": len(sowcrs) + 1, "CRTypeId": 56002, "CRNumber": gp, "CRValue": tcv, "CRRequestDate": start,
                       "ExtendedDate": end, "IsRateChanged": False, "Comments": clean(r.get("SOW Name")), "SOWId": SOW_BY_PARTNER[pid],
                       "IsActive": True, "CreatedAt": start, "UpdatedAt": start, "UpdatedBy": SYS, "CreatedBy": SYS})
        potype = 21002
    else:
        sid = len(sows) + 1
        sows.append({"Id": sid, "SOWNumber": (gp or contract or f"SOW-{sid}")[:100], "StartDate": start, "EndDate": end, "TCValue": tcv,
                     "Status": end >= NOW, "CRTypeId": 56001, "CRNumber": None, "Comments": clean(r.get("SOW Name")),
                     "PartnerId": pid, "ApprovalStatusId": 32001, **audit(start)})
        SOW_BY_PARTNER[pid] = sid; potype = 21001
    pos.append({"Id": len(pos) + 1, "PONumber": clean(r.get("PO Number")), "SOWNumber": gp or contract, "SOWStartDate": start, "SOWEndDate": end,
                "POValue": tcv, "POTypeId": potype, "POStatusId": 20001 if end >= NOW else 20002, "ThresholdPercentage": 80,
                "IsAboutToExpire": NOW <= end <= NOW + dt.timedelta(days=60), "AmendmentValue": tcv if is_cr else 0.0,
                "PartnerId": pid, **audit(start)})
    if pid not in empanel:
        empanel[pid] = {"Id": len(empanel) + 1, "IsEmpaneledPartner": True, "EmpanelmentStartDate": start, "AgreementTypeId": agreement,
                        "ContractId": contract, "GPId": gp, "SOWSigningDate": start, "GPApprovalDate": start,
                        "EmpanelmentComments": clean(r.get("SOW Name")), "IsExtendEvaluation": False, "PartnerId": pid,
                        "IsThisGPApproved": True, **audit(start)}
engagements = []
for p in partners:
    engagements.append({"Id": len(engagements) + 1, "EngagementStatusId": 8001 if p["PartnerStatusId"] == 19001 else 8002,
                        "EngagementTypeId": 9001, "EvaluationStartDate": p["StartDate"], "EvaluationEndDate": p["_end"] or p["StartDate"] + dt.timedelta(days=365),
                        "EvaluationPeriod": 12, "EvaluatedBy": "Local Admin", "BusinessCenter": "Bengaluru", "BusinessId": p["_bu"],
                        "EvaluationStatusId": 11005, "PartnerId": p["Id"], "IsExtendedEvaluation": False, "IsCompletedEvaluation": True,
                        **audit(p["StartDate"])})

# =========================================================================== 8. Hiring
HSTAT = {"closed": 12007, "on hold": 12005, "open wip": 12002, "candidate identified": 12004, "active": 12002, "identified": 12004,
         "new": 12001, "called off": 12006, "offer accepted": 12003, "cancelled": 12008}
PRIO = {"critical": 18001, "high": 18002, "medium": 18003, "low": 18004, "identified": 18005}
JL = {"entry": 17001, "intern": 17001, "intermediate": 17002, "specialist": 17003, "expert": 17004, "master": 17005, "mg1": 17005}
RT = {"regular": 40001, "badged": 40001, "contract": 40002, "third party": 40002, "intern": 40003}
hiring = []; jobdetails = []; jobpositions = []; rcms = []; pcats = []; hrp = []; H = {}; hiring_by_id = {}   # legacy hrq -> new id
def hrq_code(i): return f"HRQ{(i-1)//999+1}{(i-1)%999+1:03d}"   # mirrors the computed column on Hiring.HrqId
used_ids = set(); next_free = [1]
def hiring_id_for(hrq):
    m = re.search(r"(\d+)", hrq or "")
    i = int(m.group(1)) if m else 0
    if i <= 0 or i in used_ids:
        while next_free[0] in used_ids: next_free[0] += 1
        i = next_free[0]
    used_ids.add(i); return i

partner_cols = [c for c in S_HIR[0].keys() if c not in ("All Partners Shared",) and partner_id(c, create=False)]
for r in S_HIR:
    if not clean(r.get("Job Title")) and not clean(r.get("HRQID")): continue
    hrq = clean(r.get("HRQID"))
    hid = hiring_id_for(hrq)
    hrq = hrq or f"HRQ-NA-{hid}"
    created = to_dt(r.get("created at")) or to_dt(r.get("Request Date")) or NOW
    updated = to_dt(r.get("updated  at")) or created
    reqdate = to_dt(r.get("Request Date")) or created
    start = to_dt(r.get("Project Start Date")) or reqdate
    status = HSTAT.get(norm(r.get("Hiring Status")) or norm(r.get("Current Status")), 12002)
    hm = find_user(r.get("Hiring Email"), "hiring manager") or find_user(r.get("Hiring Manager"), "hiring manager")
    give_role(hm, "HIRINGMANAGER")
    rm = find_user(r.get("Resource Manager"), "resource manager"); give_role(rm, "RMOwner")
    requestor = find_user(r.get("Created_By"), "requestor") or hm or ADMIN_UID
    approver = find_user(r.get("Approver"), "approver"); give_role(approver, "BETApprover")
    did = domain_id(r.get("Domain")); sub = subdomain_id(r.get("Sub Domain"), did)
    hc = to_int(r.get("HC Requirements")) or 1
    hiring_type = {"backfill": 13003, "new deal": 13001}.get(norm(r.get("Backfill/ New deal")))
    H[hrq] = hid
    hiring_by_id[hid] = {"Id": hid, "RequestorId": requestor, "RecordTypeId": 23001, "JobTitle": clean(r.get("Job Title")),
                   "RmOwnerAcceptedOn": created if rm else None, "RmOwnerId": rm, "IsRMOwnerAccepted": bool(rm),
                   "EngagementTypeId": 9001, "DomainId": did, "HiringMangerId": hm, "HiringManagerName": clean(r.get("Hiring Manager")),
                   "IsParentHRQ": norm(r.get("Master Req")) != "child", "ParentHrqId": None,
                   "RCMSProjectId": clean(r.get("RCMS_Project_ID")) or "", "RCMSResourceRequestId": str(clean(r.get("RCMS_Resource_Request_ID")) or ""),
                   "ProjectName": clean(r.get("Deal/Project")) or clean(r.get("Project")) or "", "BusinessId": bu_id(r.get("BU")) or 2001,
                   "RequestStartDate": start, "RequestCreationDate": created, "HiringTypeId": hiring_type, "HiringStatusId": status,
                   "ProjectDurationMonths": to_int(r.get("Project Duration")), "EmployeeId": clean(r.get("Emp ID")),
                   "ApproverUpdatedDate": created, "ApproverComments": "Migrated", "ApprovalStatusId": 32001,
                   "IsSinglePosition": hc == 1, "IsMultiplePositions": hc > 1, "NumberOfPositions": hc,
                   "ApproverEmail": clean(r.get("Approver")), "SkipScreening": False,
                   "OnholdDate": to_dt(r.get("On Hold Date")) if status == 12005 else None, "OnholdReasonId": 66001 if status == 12005 else None,
                   "OnholdComments": trunc(r.get("OnHold Reason"), 500) if status == 12005 else None,
                   "IsCandidateSelected": status in (12004, 12007, 12003), "BetApproverId": approver, "RequestApproverId": approver,
                   "ClosedDate": updated if status == 12007 else None, "CancelledDate": updated if status in (12006, 12008) else None,
                   **audit(created, requestor), "UpdatedAt": updated}
    hiring.append(hiring_by_id[hid])
    cid, sid = city_of(r.get("Location")); loc = clean(r.get("Location")) or ""
    cid2 = city_of(loc.split("/")[1])[0] if "/" in loc else None
    jobdetails.append({"Id": hid, "JobDescription": clean(r.get("Job Description")), "HiringActivityId": 14002 if "internal" in norm(r.get("Hiring Activity")) else 14001,
                       "JobPriorityId": PRIO.get(norm(r.get("Priority"))), "HiringDate": reqdate, "ResourceTypeId": RT.get(norm(r.get("Resource Type"))),
                       "SubDomainId": sub, "PrimarySkills": skill_ids(r.get("Primary Skill"), True), "SecondarySkills": skill_ids(r.get("Secondary Skills"), False),
                       "MandatoryCertification": clean(r.get("Certification")), "JobLevelId": JL.get(norm(r.get("Max Job Level"))),
                       "RelevantExperience": to_int(r.get("Min Rel Exp")) or 0, "TotalExperience": to_int(r.get("Min Tot Exp")) or 0,
                       "CountryId": 1, "StateId": sid or state_of(r.get("State")), "PrimaryCityId": cid, "SecondaryCityId": cid2,
                       "HiringRequestId": hid, "JobLocation": trunc(loc, 500), "BadgeRecId": to_int(r.get("Badge Req ID")),
                       "StateIds": jarr([sid]), "PrimaryCityIds": jarr([cid]), "SecondaryCityIds": jarr([cid2]),
                       **audit(created)})
    jobpositions.append({"Id": hid, "IsSinglePosition": hc == 1, "IsMultiplePositions": hc > 1, "NumberOfPositions": hc,
                         "ApproverEmail": clean(r.get("Approver")), "HiringRequestId": hid, **audit(created)})
    rcms.append({"Id": hid, "ProjectId": clean(r.get("RCMS_Project_ID")), "JobTitle": clean(r.get("Job Title")), "ProjectName": clean(r.get("Deal/Project")),
                 "RcMsResourceRequestId": str(clean(r.get("RCMS_Resource_Request_ID")) or ""), "RequestStartDate": start,
                 "HiringManagerName": clean(r.get("Hiring Manager")), "HiringManagerId": hm, "ResourceRequestId": to_int(r.get("RCMS_Resource_Request_ID")), **audit(created)})
    selected = [c for c in partner_cols if norm(r.get(c)) == "yes"]
    all_shared = norm(r.get("All Partners Shared")) == "yes"
    pcats.append({"Id": hid, "IsSpecificPartner": bool(selected) and not all_shared, "IsProxyPartner": False, "IsRecommendThePartner": all_shared,
                  "ProfileCAP": to_int(r.get("Partners Profile Limit")) or 10, "Comments": "Migrated", "HiringRequestId": hid, **audit(created)})
    for c in selected:
        hrp.append({"Id": len(hrp) + 1, "PartnerId": partner_id(c), "AssignedOn": reqdate, "PartnerCategoryId": hid, **audit(created)})

# =========================================================================== 9. Candidates, rounds, slots
ROUND = {"screening": 16001, "assessment": 16002, "online assessment": 16002, "code assessment": 16003, "business case": 16004,
         "technical": 16005, "technical ops": 16006, "tech ops": 16006, "ops": 16007, "final": 16008}
def round_id(r):
    v = to_int(r.get("RounStatus Id"))
    if v in master and master[v][0] == 16: return v
    n = norm(r.get("Round Status")) or norm(r.get("Interview round"))
    for k, i in ROUND.items():
        if n.startswith(k): return i
    if "tech" in n and "ops" in n: return 16006
    if "tech" in n: return 16005
    if "ops" in n: return 16007
    if "assess" in n or "test" in n: return 16002
    if "screen" in n: return 16001
    unmatched["interview round"][clean(r.get("Interview round"))] += 1
    return 16005
SLOT = {"selected": 50005, "rejected": 50006, "dropped": 50007, "screening pending": 50001, "interview scheduled": 50002,
        "interview rescheduled": 50003, "on hold": 50008, "interview completed": 50004}
INTAKE_FINAL = {"rejected": 15005, "candidate dropped": 15010, "offer declined": 15012, "offer accepted": 15011,
                "candidate identified": 15009}
INTAKE_LAST = {"selected": 15003, "screening pending": 15002, "interview scheduled": 15003, "interview rescheduled": 15003,
               "rejected": 15005, "dropped": 15010, "on hold": 15006, "interview completed": 15004}

cands = {}                # (hrq, email) -> row
rounds = {}               # (hid, order) -> round row
slots = []
cand_rows_src = collections.defaultdict(list)
for r in S_INT:
    hrq = clean(r.get("Hrq"))
    if hrq not in H: unmatched["slot HRQ not in Hiring"][hrq] += 1; continue
    email = (clean(r.get("Email")) or clean(r.get("Internal Email")) or "").lower()
    key = (hrq, email or norm(r.get("Candidate name")))
    cand_rows_src[key].append(r)
for key, rs in cand_rows_src.items():
    hrq, _ = key; hid = H[hrq]
    rs.sort(key=lambda x: (to_int(x.get("Round order")) or 0, to_dt(x.get("Scheduled date")) or NOW))
    first, last = rs[0], rs[-1]
    cid_ = len(cands) + 1
    pid = partner_id(first.get("Partners"))
    city, state = city_of(first.get("Location name"))
    final = norm(last.get("Final status")); last_status = norm(last.get("Interview status"))
    hrq_status = hiring_by_id[hid]["HiringStatusId"]
    if final in INTAKE_FINAL: intake = INTAKE_FINAL[final]
    elif final == "closed": intake = 15008 if last_status == "selected" else 15005
    else: intake = INTAKE_LAST.get(last_status, 15003)
    rn = master.get(round_id(last), (16, ""))[1]
    cstat = {("SCREENING", "selected"): 3001, ("SCREENING", "rejected"): 3002, ("TECHNICAL", "selected"): 3003, ("TECHNICAL", "rejected"): 3004,
             ("OPS", "selected"): 3008, ("OPS", "rejected"): 3009}.get((rn, last_status),
             3005 if last_status == "on hold" else 3007 if last_status == "dropped" else 3006 if last_status == "selected" else 3010 if last_status == "rejected" else None)
    created = min((to_dt(x.get("Scheduled date")) or NOW) for x in rs)
    created = min(created, to_dt(first.get("Start date")) or created)
    doj = to_dt(last.get("Doj"))
    cands[key] = {"Id": cid_, "PartnerId": pid, "HiringRequestId": hid, "HrqId": hrq_code(hid), "IsSingleEntry": True,
                  "FullName": clean(first.get("Candidate name")), "PhoneNumber": (str(clean(first.get("Phone number")) or ""))[:50],
                  "Email": (key[1] if "@" in key[1] else "")[:255], "CountryId": 1, "StateId": state, "CityId": city,
                  "Diversity": yesno(first.get("Diversity")), "NoticePeriod": to_int(first.get("Notice period (in days)")),
                  "RelevantExperience": to_int(first.get("Relevant experience (in years)")), "CurrentlyWorking": yesno(first.get("Currently working")),
                  "currentOrganisation": clean(first.get("Current organization")), "LastWorkingDay": to_dt(first.get("Last working day")),
                  "ResourceTypeId": RT.get(norm(first.get("Resource type"))), "IntakeStatusId": intake, "IsAgreedForTermsConditions": True,
                  "ApprovedBy": hiring_by_id[hid]["HiringMangerId"], "ApprovedDate": created, "IsDuplicate": False,
                  "IsScreeningCompleted": any(round_id(x) == 16001 and norm(x.get("Interview status")) in ("selected", "rejected") for x in rs),
                  "ScreeningStatus": any(round_id(x) == 16001 and norm(x.get("Interview status")) == "selected" for x in rs),
                  "ResumeUploadedOn": to_dt(first.get("Resume updated on")), "CandidateStatusId": cstat,
                  "RoleHiredFor": trunc(first.get("Job title"), 100), "PreferredWorkLocationId": city, "PreferredWorkLocationIds": jarr([city]),
                  "CandidateIdentifiedOn": created if intake in (15009, 15011, 15008) else None, "CandidateDroppedOn": to_dt(last.get("Interview time")) if intake == 15010 else None,
                  "CandidateRejectedOn": to_dt(last.get("Interview time")) if intake == 15005 else None, "OfferDeclinedOn": to_dt(last.get("Interview time")) if intake == 15012 else None,
                  "OfferAcceptedOn": to_dt(last.get("Interview time")) if intake == 15011 else None, "CandidateJoinedOn": doj if intake == 15008 else None,
                  "InterviewCompletedOn": to_dt(last.get("Interview time")) if intake in (15009, 15008, 15011) else None, "IsFreezed": False,
                  **audit(created, pid and None or SYS)}
    for x in rs:
        order = to_int(x.get("Round order"))
        if not order: continue
        rk = (hid, order)
        panel = clean(x.get("Interview panel"))
        panel_ids = jarr([by_email.get(e.lower()) for e in re.split(r"[,;\s]+", panel or "") if "@" in e])
        if rk not in rounds:
            rounds[rk] = {"Id": len(rounds) + 1, "RoundNumber": order, "RoundNameId": round_id(x), "PanelName": panel, "ModeOfInterview": 41002, "Candidates": None,
                          "Comments": "", "IsAddSpecificCandidates": False, "AddFeedbackCritria": False, "HiringRequestId": hid,
                          "SkipScreening": False, "ScreeningCap": 10, "Panel": panel_ids, **audit(hiring_by_id[hid]["CreatedAt"])}
        st = norm(x.get("Interview status"))
        when = to_dt(x.get("Scheduled date")); t = x.get("Schedule time") if isinstance(x.get("Schedule time"), dt.time) else None
        fb = clean(x.get("Comments")); fb = re.sub(r"<br\s*/?>", "\n", fb).strip() if fb else None
        slots.append({"Id": len(slots) + 1, "CandidateId": cid_, "CurrentRoundId": rounds[rk]["Id"], "Date": when, "Time": t, "ValidityHours": None,   # NULL: a non-null expired validity makes the API auto-cancel migrated slots
                      "IsPartnerAccepted": True, "RejectionCount": 0, "IsResheduled": st == "interview rescheduled", "Feedback": fb,
                      "CandidateInterviewStatusId": SLOT.get(st, 50001), "AvailableDays": None, "Duration": 60,
                      "IsInterviewCompleted": norm(x.get("Interview taken")) == "taken" or st in ("selected", "rejected"),
                      "PanelFeedbackGivenOn": to_dt(x.get("Interview time")) if st in ("selected", "rejected") else None,
                      "PartenrAcceptedOn": when, "PartnerInterviewConfirmedOn": when, "LastStatusUpdated": to_dt(x.get("Interview time")) or when,
                      "RescheduleCount": 1 if st == "interview rescheduled" else 0, "Panel": panel_ids, "PartnerId": pid,
                      "FeedbackGivenByUserId": None, "InterviewRoundStartDate": when, "InterviewRoundCompleteDate": to_dt(x.get("Interview time")) if st in ("selected", "rejected") else None,
                      **audit(when or created)})
give_role(None, "PANEL")
for rk, rd in rounds.items():
    for e in re.split(r"[,;\s]+", rd["PanelName"] or ""):
        if "@" in e: give_role(find_user(e, "panel"), "PANEL")

# partner logins: one user per partner
for p in partners:
    slug = re.sub(r"[^a-z0-9]", "", p["PartnerName"].lower())[:30]
    uid = add_user(f"{slug}@partner.local", p["PartnerName"], slug)
    p["UserId"] = uid; give_role(uid, "PARTNER", p["Id"])

# CandidateFormHistory: the candidate grid reads the LATEST history snapshot per CandidateCode, so write one per candidate.
HIST_COLS = ["PartnerId","HiringRequestId","IsSingleEntry","FullName","PhoneNumber","Email","Skills","CountryId","StateId","CityId","Diversity",
             "NoticePeriod","RelevantExperience","CurrentlyWorking","currentOrganisation","CurrentCTC","LastWorkingDay","ResumeId","EmployeeId",
             "ResourceTypeId","IntakeStatusId","CandidateStatusId","IsAgreedForTermsConditions","ApprovedBy","ApprovedDate","IsDuplicate",
             "IsScreeningCompleted","ScreeningStatus","ResumeUploadedOn","IsActive","CreatedBy","CreatedAt","UpdatedBy","UpdatedAt",
             "PrimarySkillIds","SecondarySkillIds","PreferredWorkLocationIds","InterviewCompletedOn","CandidateIdentifiedOn","CandidateDroppedOn",
             "OfferDeclinedOn","OfferAcceptedOn","CandidateRejectedOn","CandidateJoinedOn","IsFreezed"]
def cand_code(i): return f"CA{(i-1)//999+1}{(i-1)%999+1:03d}"   # mirrors computed CandidateForms.CandidateCode
cand_hist = []
for c in cands.values():
    h = {"Id": len(cand_hist) + 1, "CandidateId": c["Id"], "CandidateCode": cand_code(c["Id"])}
    for k in HIST_COLS: h[k] = c.get(k)
    cand_hist.append(h)

# =========================================================================== 10. misc lookups
quarters = [{"Id": 1, "StartDay": 1, "StartMonth": 11, "EndDay": 31, "EndMonth": 1, "IsActive": True, "CreatedAt": NOW, "CreatedBy": SYS, "UpdatedAt": NOW, "UpdatedBy": SYS},
            {"Id": 2, "StartDay": 1, "StartMonth": 2, "EndDay": 30, "EndMonth": 4, "IsActive": True, "CreatedAt": NOW, "CreatedBy": SYS, "UpdatedAt": NOW, "UpdatedBy": SYS},
            {"Id": 3, "StartDay": 1, "StartMonth": 5, "EndDay": 31, "EndMonth": 7, "IsActive": True, "CreatedAt": NOW, "CreatedBy": SYS, "UpdatedAt": NOW, "UpdatedBy": SYS},
            {"Id": 4, "StartDay": 1, "StartMonth": 8, "EndDay": 31, "EndMonth": 10, "IsActive": True, "CreatedAt": NOW, "CreatedBy": SYS, "UpdatedAt": NOW, "UpdatedBy": SYS}]
config = [{"Id": i + 1, "ConfigKey": k, "ConfigValue": v, "Description": k, **audit()} for i, (k, v) in enumerate([
    ("DefaultOnboardingManagerEmail", ADMIN_EMAIL), ("DefaultHiringManagerEmail", ADMIN_EMAIL), ("DefaultOnHoldNotificationRemainderInDays", "7"),
    ("DefaultOnHoldRejectInDays", "30"), ("DefaultPartnerInactiveInDays", "90"), ("DefaultRMOwnerEmail", ADMIN_EMAIL), ("DefaultRMOwnerAssignHours", "24")])]
joblevels = [{"Id": i, "Name": n, "ShortName": s, "DefaultExperience": d, "ExperienceRange": e, "StandardRate": 0, "INRStandardRate": 0, "ETRate": 0, "INRETRate": 0, "OrderId": i - 17000, **audit()}
             for i, n, s, d, e in [(17001, "Entry", "TCP01", 1, 3), (17002, "Intermediate", "TCP02", 3, 5), (17003, "Specialist", "TCP03", 5, 8),
                                   (17004, "Expert", "TCP04", 8, 10), (17005, "Master", "TCP05", 10, 15)]]

# =========================================================================== emit
for p in partners: p.pop("_bu"); p.pop("_end")
seen = set(); urm = []
for (u, r, p) in user_roles:
    if u and (u, r) not in seen:
        seen.add((u, r)); urm.append({"UserId": u, "RoleId": r, "PartnerId": p, "AssignedAt": NOW, **audit()})
out.append(":on error exit\nSET NOCOUNT ON; SET XACT_ABORT ON;\nBEGIN TRAN;")
for t in ["InterviewSlotAllocationHistory", "InterviewSlotAllocation", "InterviewRounds", "CandidateFormHistory", "CandidateForms", "CandidateBin", "HiringReqPartner",
          "PartnerCategories", "JobDetails", "JobPositions", "RCMSDetails", "OnholdHiringRequest", "Hiring", "SOWCRS", "PODetails", "SOWDetails",
          "PartnerEmpanel", "Engagements", "UserRolesMapping", "Partners", "M_SubDomains", "M_Domains", "M_Skills", "M_Cities", "M_States",
          "M_Countries", "M_JobLevel", "M_MasterData", "M_Configuration", "QuarterDateRanges", "Users", "Roles"]:
    out.append(f"DELETE FROM dbo.[{t}];")
insert("M_MasterData", md_rows)
insert("M_JobLevel", joblevels, identity=True)
insert("M_Countries", countries, identity=True); insert("M_States", states, identity=True); insert("M_Cities", cities, identity=True)
insert("QuarterDateRanges", quarters, identity=True); insert("M_Configuration", config, identity=True)
insert("Roles", role_rows, identity=True); insert("Users", users, identity=True)
insert("M_Domains", domains, identity=True); insert("M_SubDomains", subdomains, identity=True); insert("M_Skills", skills, identity=True)
insert("Partners", partners, identity=True); insert("UserRolesMapping", urm)
insert("Engagements", engagements, identity=True); insert("PartnerEmpanel", list(empanel.values()), identity=True)
insert("SOWDetails", sows, identity=True); insert("SOWCRS", sowcrs, identity=True); insert("PODetails", pos, identity=True)
insert("Hiring", hiring, identity=True); insert("JobDetails", jobdetails, identity=True); insert("JobPositions", jobpositions, identity=True)
insert("RCMSDetails", rcms, identity=True); insert("PartnerCategories", pcats, identity=True); insert("HiringReqPartner", hrp, identity=True)
insert("CandidateForms", list(cands.values()), identity=True); insert("CandidateFormHistory", cand_hist, identity=True); insert("InterviewRounds", list(rounds.values()), identity=True)
insert("InterviewSlotAllocation", slots, identity=True)
out.append("COMMIT;")
Path(OUT).write_text("\nGO\n".join(out) + "\nGO\n", encoding="utf-8")

# =========================================================================== report
print(f"SQL written to {OUT}")
counts = {"M_MasterData": len(md_rows), "Users": len(users), "UserRolesMapping": len(urm), "M_Domains": len(domains), "M_SubDomains": len(subdomains),
          "M_Skills": len(skills), "Partners": len(partners), "SOWDetails": len(sows), "SOWCRS": len(sowcrs), "PODetails": len(pos),
          "Hiring": len(hiring), "HiringReqPartner": len(hrp), "CandidateForms": len(cands), "InterviewRounds": len(rounds), "InterviewSlotAllocation": len(slots)}
for k, v in counts.items(): print(f"  {k:26s} {v}")
rc = collections.Counter(r for (_, r, _) in user_roles)
print("  roles:", {n: rc.get(i, 0) for n, i in roles})
print("\nUNMATCHED (kept with NULL FK):")
for k, c in unmatched.items():
    print(f"  {k} ({sum(c.values())} rows, {len(c)} distinct): " + ", ".join(f"{repr(n)[:35]}x{v}" for n, v in c.most_common(12)))
