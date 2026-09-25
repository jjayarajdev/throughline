#!/usr/bin/env python3
"""
Run scripts/project-core.sql (throughline.* -> core.*) in one transaction and print a
markdown migration report to stdout.

    python3 scripts/project-core-report.py                 # run + commit, report on stdout
    python3 scripts/project-core-report.py --out docs/db/core-migration-report.md
    python3 scripts/project-core-report.py --dry-run       # run, report, ROLLBACK

Env: PG_HOST/PG_PORT/PG_DB/PG_USER/PG_PASSWORD (defaults: localhost 5433 platform postgres).
The SQL script leaves mig_* temp tables in the session; the report reads them here, so the
script and the report always describe the same run.
"""
import argparse, datetime, os, sys
import psycopg

HERE = os.path.dirname(os.path.abspath(__file__))
SQL_FILE = os.path.join(HERE, "project-core.sql")
PG = (f"host={os.getenv('PG_HOST', 'localhost')} port={os.getenv('PG_PORT', '5433')} "
      f"dbname={os.getenv('PG_DB', 'platform')} user={os.getenv('PG_USER', 'postgres')} "
      f"password={os.getenv('PG_PASSWORD', 'Your_strong_Pass1')}")

# core table -> (source description, rows-in SQL)
ROWS_IN = [
    ("countries",       "M_Countries",                      'SELECT count(*) FROM throughline."M_Countries"'),
    ("states",          "M_States",                         'SELECT count(*) FROM throughline."M_States"'),
    ("cities",          "M_Cities",                         'SELECT count(*) FROM throughline."M_Cities"'),
    ("domains",         "M_Domains",                        'SELECT count(*) FROM throughline."M_Domains"'),
    ("sub_domains",     "M_SubDomains",                     'SELECT count(*) FROM throughline."M_SubDomains"'),
    ("skills",          "M_Skills",                         'SELECT count(*) FROM throughline."M_Skills"'),
    ("skill_aliases",   "(only if slugs collide)",          "SELECT 0"),
    ("job_levels",      "M_JobLevel",                       'SELECT count(*) FROM throughline."M_JobLevel"'),
    ("lookups",         "M_MasterData (reference groups)",  'SELECT count(*) FROM throughline."M_MasterData" WHERE "MasterTypeId" IN (1,2,7,9,13,14,16,18,21,23,24,33,40,41,56,61,66,83,86,87,88,89)'),
    ("users",           "Users",                            'SELECT count(*) FROM throughline."Users"'),
    ("organisations",   "Partners + 1 platform org",        'SELECT count(*) + 1 FROM throughline."Partners"'),
    ("organisation_domains", "Partners.SubDomainIds elements", 'SELECT coalesce(sum(cardinality("SubDomainIds")),0) FROM throughline."Partners"'),
    ("organisation_skills",  "Partners.SkillIds elements",     'SELECT coalesce(sum(cardinality("SkillIds")),0) FROM throughline."Partners"'),
    ("organisation_members", "ContactMatrices + EscalationMatrices", 'SELECT (SELECT count(*) FROM throughline."ContactMatrices") + (SELECT count(*) FROM throughline."EscalationMatrices")'),
    ("jobs",            "Hiring (JOIN JobDetails)",         'SELECT count(*) FROM throughline."Hiring"'),
    ("job_skills",      "JobDetails Primary+SecondarySkills elements", 'SELECT coalesce(sum(cardinality("PrimarySkills")),0) + coalesce(sum(cardinality("SecondarySkills")),0) FROM throughline."JobDetails"'),
    ("job_locations",   "JobDetails Primary+SecondaryCityIds elements", 'SELECT coalesce(sum(cardinality("PrimaryCityIds")),0) + coalesce(sum(cardinality("SecondaryCityIds")),0) FROM throughline."JobDetails"'),
    ("people",          "CandidateForms",                   'SELECT count(*) FROM throughline."CandidateForms"'),
    ("person_skills",   "CandidateForms Primary+SecondarySkillIds elements", 'SELECT coalesce(sum(cardinality("PrimarySkillIds")),0) + coalesce(sum(cardinality("SecondarySkillIds")),0) FROM throughline."CandidateForms"'),
    ("person_preferred_locations", "CandidateForms.PreferredWorkLocationIds elements", 'SELECT coalesce(sum(cardinality("PreferredWorkLocationIds")),0) FROM throughline."CandidateForms"'),
    ("applications",    "CandidateForms",                   'SELECT count(*) FROM throughline."CandidateForms"'),
    ("application_stage_history", "(insert trigger, 1 per application)", "SELECT 0"),
    ("outbox",          "(insert triggers; deleted at end)", "SELECT 0"),
]


def md_table(headers, rows):
    def cell(v):
        if v is None:
            return ""
        if isinstance(v, (datetime.datetime, datetime.date)):
            return v.isoformat(sep=" ") if isinstance(v, datetime.datetime) else v.isoformat()
        return str(v).replace("|", "\\|").replace("\n", " ")
    out = ["| " + " | ".join(headers) + " |", "|" + "|".join("---" for _ in headers) + "|"]
    for r in rows:
        out.append("| " + " | ".join(cell(v) for v in r) + " |")
    return "\n".join(out) if rows else "_none_"


def q(cur, sql, params=None):
    cur.execute(sql, params)
    return cur.fetchall()


def one(cur, sql, params=None):
    return q(cur, sql, params)[0][0]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", help="also write the report to this file")
    ap.add_argument("--dry-run", action="store_true", help="run everything, then ROLLBACK")
    args = ap.parse_args()

    sql = open(SQL_FILE, encoding="utf-8").read()
    started = datetime.datetime.now()
    conn = psycopg.connect(PG, autocommit=False)
    cur = conn.cursor()
    try:
        cur.execute(sql)  # multi-statement; runs inside this connection's transaction
    except Exception as e:
        conn.rollback()
        print(f"project-core.sql failed: {e}", file=sys.stderr)
        sys.exit(1)

    L = []
    p = L.append
    p(f"# core migration report — throughline -> core")
    p("")
    p(f"Run: {started:%Y-%m-%d %H:%M:%S} · script: `scripts/project-core.sql` · "
      f"database: `{one(cur, 'SELECT current_database()')}` @ {os.getenv('PG_HOST', 'localhost')}:{os.getenv('PG_PORT', '5433')}"
      f"{' · DRY RUN (rolled back)' if args.dry_run else ''}")
    p("")

    # ---- rows in -> rows out -------------------------------------------------
    p("## Rows in -> rows out")
    p("")
    rows = []
    for tbl, src, sql_in in ROWS_IN:
        rows.append((f"core.{tbl}", src, one(cur, sql_in), one(cur, f"SELECT count(*) FROM core.{tbl}")))
    p(md_table(["core table", "source", "rows in", "rows out"], rows))
    p("")
    run = dict(q(cur, "SELECT k, v FROM mig_run"))
    p(f"`core.application_stage_history` keeps the {run.get('stage_history_rows', 0)} rows the insert trigger wrote "
      f"(one `NULL -> stage` row per application). `core.outbox`: {run.get('outbox_deleted', 0)} rows written by the "
      f"insert triggers during this run were deleted (`origin = 'migration'` candidate.submitted events, plus the "
      f"requisition.published events for the migrated jobs, which carry `origin = 'throughline'` because the jobs do) "
      f"so the migration replays nothing to partners; {run.get('outbox_remaining', 0)} unrelated outbox rows remain.")
    p("")

    # ---- people merge --------------------------------------------------------
    p("## People merge (core.upsert_person)")
    p("")
    n_cand = one(cur, 'SELECT count(*) FROM throughline."CandidateForms"')
    n_map = one(cur, "SELECT count(*) FROM mig_person_map")
    n_people = one(cur, "SELECT count(DISTINCT person_id) FROM mig_person_map")
    n_skipped = one(cur, "SELECT count(*) FROM mig_people_skipped")
    merged = q(cur, "SELECT count(*), coalesce(sum(n),0) FROM (SELECT person_id, count(*) n FROM mig_person_map GROUP BY 1 HAVING count(*) >= 2) x")[0]
    p(f"- CandidateForms rows: **{n_cand}** -> upserted: **{n_map}** -> distinct people: **{n_people}** "
      f"(skipped, no email and no 10-digit phone: **{n_skipped}**)")
    p(f"- People built from 2+ candidate rows: **{merged[0]}** (covering {merged[1]} candidate rows); "
      f"largest group: {one(cur, 'SELECT coalesce(max(n),0) FROM (SELECT count(*) n FROM mig_person_map GROUP BY person_id) x')} rows")
    p(f"- Merge key: normalised email (`lower(trim(email))`) OR last 10 digits of the phone; first row (lowest Id) wins "
      f"for name/contact, later rows only fill blanks.")
    dist = q(cur, "SELECT n, count(*) FROM (SELECT count(*) n FROM mig_person_map GROUP BY person_id) x GROUP BY n ORDER BY n")
    p("")
    p(md_table(["candidate rows per person", "people"], dist))
    p("")
    p("Top 10 merged groups (check for false merges — same phone or email shared by different names):")
    p("")
    top = q(cur, """
        SELECT count(*) AS rows, string_agg(DISTINCT full_name, ' / ' ORDER BY full_name) AS names,
               string_agg(DISTINCT coalesce(email,'-'), ' / ') AS emails,
               string_agg(DISTINCT coalesce(phone,'-'), ' / ') AS phones,
               string_agg(candidate_id::text, ',' ORDER BY candidate_id) AS candidate_ids
        FROM mig_person_map GROUP BY person_id ORDER BY count(*) DESC, min(candidate_id) LIMIT 10""")
    p(md_table(["rows", "names", "emails", "phones", "CandidateForms.Id"], top))
    p("")
    susp = q(cur, """
        SELECT count(*) FROM (SELECT person_id FROM mig_person_map GROUP BY person_id
                              HAVING count(DISTINCT lower(regexp_replace(full_name, '\\s+', ' ', 'g'))) > 1) x""")[0][0]
    p(f"Merged groups whose rows carry more than one distinct name (candidates for manual review): **{susp}**")
    if susp:
        p("")
        p(md_table(["rows", "names", "emails", "phones", "CandidateForms.Id"], q(cur, """
            SELECT count(*), string_agg(DISTINCT full_name, ' / ' ORDER BY full_name),
                   string_agg(DISTINCT coalesce(email,'-'), ' / '), string_agg(DISTINCT coalesce(phone,'-'), ' / '),
                   string_agg(candidate_id::text, ',' ORDER BY candidate_id)
            FROM mig_person_map GROUP BY person_id
            HAVING count(DISTINCT lower(regexp_replace(full_name, '\\s+', ' ', 'g'))) > 1
            ORDER BY count(*) DESC, min(candidate_id) LIMIT 40""")))
    if n_skipped:
        p("")
        p("Skipped (no email and no 10-digit phone):")
        p("")
        p(md_table(["CandidateForms.Id", "code", "name", "email", "phone"],
                   q(cur, "SELECT * FROM mig_people_skipped ORDER BY candidate_id")))
    cleaned = q(cur, "SELECT detail FROM mig_note WHERE section='people' ORDER BY detail")
    p("")
    p(f"Emails cleaned before upsert (first well-formed address kept; raw -> used): **{len(cleaned)}**")
    if cleaned:
        p("")
        for (d,) in cleaned:
            p(f"- `{d}`")
    p("")

    # ---- applications --------------------------------------------------------
    p("## Applications")
    p("")
    n_apps = one(cur, "SELECT count(*) FROM core.applications")
    dupes = q(cur, "SELECT * FROM mig_app_dupes ORDER BY hrq, kept_candidate_id, candidate_id")
    skipped = q(cur, "SELECT * FROM mig_app_skipped ORDER BY candidate_id")
    p(f"- CandidateForms rows: **{n_cand}** -> applications: **{n_apps}**; "
      f"collapsed onto an existing (job, person, source organisation) key and NOT inserted: **{len(dupes)}**; "
      f"skipped (no person / no job): **{len(skipped)}**")
    p("- Stage precedence (first match wins): joined > offer_accepted > offered > withdrawn (offer declined) > rejected > "
      "dropped > on_hold > shortlisted (candidate identified) > interviewing (incl. feedback pending) > screening > submitted; "
      "each from the milestone timestamp OR the 15xxx `IntakeStatusId`.")
    p("")
    p(md_table(["stage", "applications"], q(cur, "SELECT stage, count(*) FROM core.applications GROUP BY 1 ORDER BY 2 DESC")))
    p("")
    p("Duplicate list (kept = earliest CreatedAt, then lowest Id; the listed rows were not inserted):")
    p("")
    p(md_table(["dropped Id", "code", "kept Id", "kept code", "HRQ", "name", "email", "phone", "partner", "created", "stage"], dupes))
    if skipped:
        p("")
        p("Skipped:")
        p("")
        p(md_table(["CandidateForms.Id", "code", "reason"], skipped))
    p("")

    # ---- status mappings -----------------------------------------------------
    p("## Status / enum mapping coverage")
    p("")
    for kind, title, note in [
        ("hiring_status", "Hiring.HiringStatusId -> core.jobs.status",
         "12001 NEW -> pending_approval · 12002 WIP -> published · 12003 OFFER_ACCEPTED -> published · 12004 CANDIDATE_IDENTIFIED -> published · "
         "12005 ON_HOLD -> on_hold · 12006 CALLED_OFF -> cancelled · 12007 CLOSED -> closed · 12008 CANCELLED -> cancelled · else draft"),
        ("employment_type(EngagementTypeId/HiringTypeId/ResourceTypeId)", "Hiring.EngagementTypeId / HiringTypeId / JobDetails.ResourceTypeId -> core.jobs.employment_type",
         "7001 -> permanent, 7002 -> contract when present on EngagementTypeId or HiringTypeId; otherwise ResourceTypeId 40002 (Contract) -> contract, else permanent"),
        ("partner_status", "Partners.PartnerStatusId -> core.organisations.status",
         "19001/25001 -> active · 19002/25002 -> inactive · 19003 -> pending_approval · 19004 -> rejected · else draft"),
        ("candidate_intake_status -> stage", "CandidateForms.IntakeStatusId (15xxx) -> core.applications.stage", None),
        ("candidate_status (3xxx, informational) -> stage", "CandidateForms.CandidateStatusId (3xxx screen/tech/ops outcome) -> resulting stage (not used for mapping, shown for coverage)", None),
    ]:
        p(f"### {title}")
        p("")
        if note:
            p(note)
            p("")
        rows = q(cur, "SELECT legacy_id, legacy_name, core_value, n FROM mig_status_map WHERE kind=%s ORDER BY legacy_id NULLS LAST, core_value", (kind,))
        rows = [(lid, nm if nm else ("(null)" if lid is None else "(no M_MasterData row)"), cv, n) for lid, nm, cv, n in rows]
        p(md_table(["legacy id", "legacy name", "core value", "rows"], rows))
        unm = [r for r in rows if r[2] in ("draft", "submitted") and r[0] is not None]
        if unm:
            p("")
            p("Flagged (fell through to the default): " + ", ".join(f"{r[0]} ({r[1]}) x{r[3]}" for r in unm))
        p("")
    p("### M_MasterData groups -> core.lookups lists")
    p("")
    p(md_table(["MasterTypeId", "list", "rows"], q(cur, "SELECT legacy_id, core_value, n FROM mig_status_map WHERE kind='lookup_list' ORDER BY legacy_id")))
    p("")
    p("Groups left out on purpose (workflow statuses or app internals, stay as throughline int ids): "
      "3 candidate status, 4 contact-matrix type, 5 name type, 6 email category, 8 engagement status, 10 escalation type, "
      "11 evaluation status, 12 hiring status, 15 candidate intake status, 19 partner status, 20 PO status, 25 active/inactive, "
      "32 approval status, 42 notification category, 47 slot status, 50 interview slot status, 60 yes/no, 79 compliance followed, "
      "80 joining status, 85 review status.")
    p("")

    # ---- dangling ids --------------------------------------------------------
    p("## Dangling legacy ids (referenced but not in the taxonomy / target table)")
    p("")
    dang = q(cur, "SELECT source, ref, legacy_id, n FROM mig_dangling ORDER BY source, legacy_id")
    p(md_table(["source column", "expected in", "legacy id", "references"], dang))
    p("")
    p(f"Total dangling references: **{sum(r[3] for r in dang)}** (all skipped; FK columns set to NULL, array elements dropped).")
    p("")

    # ---- users ---------------------------------------------------------------
    p("## Users")
    p("")
    us = q(cur, "SELECT user_id, email, full_name, reason FROM mig_users_skipped ORDER BY user_id")
    n_users_in = one(cur, 'SELECT count(*) FROM throughline."Users"')
    n_users_out = one(cur, "SELECT count(*) FROM core.users")
    user_status = ", ".join(f"{s} x{n}" for s, n in q(cur, "SELECT status, count(*) FROM core.users GROUP BY 1 ORDER BY 1"))
    p(f"- Users rows: **{n_users_in}** -> core.users: **{n_users_out}**; "
      f"skipped: **{len(us)}** (dedupe on lower(email), lowest UserId kept)")
    p(f"- status: {user_status}")
    if us:
        p("")
        p(md_table(["UserId", "email", "name", "reason"], us))
    p("")

    # ---- organisations -------------------------------------------------------
    p("## Organisations")
    p("")
    p(md_table(["kind", "status", "rows"], q(cur, "SELECT kind, status, count(*) FROM core.organisations GROUP BY 1,2 ORDER BY 1,2")))
    p("")
    for sec, key, detail, n in q(cur, "SELECT * FROM mig_note WHERE section IN ('organisation_members','skills') ORDER BY section, key"):
        p(f"- {sec}: {key}{': ' + detail if detail else ''} ({n})")
    p("")

    # ---- judgement calls -----------------------------------------------------
    p("## Judgement calls")
    p("")
    for line in [
        "`CandidateForms.IntakeStatusId` holds the 15xxx pipeline statuses (Screening/Interviewing/Rejected/Onboarded...) and "
        "`CandidateStatusId` holds the 3xxx screen/tech/ops outcomes; the stage is derived from IntakeStatusId + milestone timestamps, "
        "CandidateStatusId is reported only.",
        "`Hiring.EngagementTypeId` is 9001 (Labour) on every row and `HiringTypeId` is a 13xxx deal type, so the 7001/7002 rule never "
        "fires; `JobDetails.ResourceTypeId` 40002 (Contract) is used as the fallback for `employment_type`.",
        "`HiringStatusId` 12003 OFFER_ACCEPTED and 12004 CANDIDATE_IDENTIFIED are 'in-progress' per the enum comments and map to "
        "published; 12006 CALLED_OFF maps to cancelled. Only unknown ids fall through to draft.",
        "`Partners.PartnerStatusId` uses the PARTNER_STATUS group (19001..19004), not ACTIVE_INACTIVE (25001/25002); both are mapped.",
        "Intake 15012 OFFER_DECLINED maps to `withdrawn` and 15009 CANDIDATE_IDENTIFIED to `shortlisted` (closest core stages).",
        "Every legacy job is owned by one `platform` organisation `Throughline` (code THROUGHLINE, origin migration).",
        "Country iso2 comes from `M_Countries.CountryCode`; currency by iso2 (IN->INR, MY->MYR, ...; unknown -> USD).",
        "`CandidateForms.Diversity` is Yes/No, not a gender id, so `people.diversity_lookup_id` is left NULL.",
        "`ConsideredForFutureRequirements` is NULL on every row, so `talent_pool_consent` is false everywhere.",
        "Legacy `timestamp without time zone` values are read as Asia/Kolkata wall-clock time.",
        "Re-runs DELETE (not TRUNCATE) the filled core tables child->parent, so the script stops instead of cascading if some other "
        "system has already attached rows (e.g. core.documents) to migrated users/people.",
    ]:
        p(f"- {line}")
    p("")

    report = "\n".join(L)
    if args.dry_run:
        conn.rollback()
    else:
        conn.commit()
    conn.close()
    print(report)
    if args.out:
        with open(args.out, "w", encoding="utf-8") as f:
            f.write(report + "\n")
        print(f"\n(report written to {args.out})", file=sys.stderr)


if __name__ == "__main__":
    main()
