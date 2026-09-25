# core migration report — throughline -> core

Run: 2026-09-25 20:34:46 · script: `scripts/project-core.sql` · database: `platform` @ localhost:5433

## Rows in -> rows out

| core table | source | rows in | rows out |
|---|---|---|---|
| core.countries | M_Countries | 2 | 2 |
| core.states | M_States | 16 | 16 |
| core.cities | M_Cities | 33 | 33 |
| core.domains | M_Domains | 24 | 24 |
| core.sub_domains | M_SubDomains | 114 | 114 |
| core.skills | M_Skills | 103 | 103 |
| core.skill_aliases | (only if slugs collide) | 0 | 0 |
| core.job_levels | M_JobLevel | 5 | 5 |
| core.lookups | M_MasterData (reference groups) | 77 | 77 |
| core.users | Users | 986 | 986 |
| core.organisations | Partners + 1 platform org | 40 | 40 |
| core.organisation_domains | Partners.SubDomainIds elements | 0 | 0 |
| core.organisation_skills | Partners.SkillIds elements | 0 | 0 |
| core.organisation_members | ContactMatrices + EscalationMatrices | 0 | 0 |
| core.jobs | Hiring (JOIN JobDetails) | 289 | 289 |
| core.job_skills | JobDetails Primary+SecondarySkills elements | 143 | 143 |
| core.job_locations | JobDetails Primary+SecondaryCityIds elements | 298 | 298 |
| core.people | CandidateForms | 3938 | 3772 |
| core.person_skills | CandidateForms Primary+SecondarySkillIds elements | 0 | 0 |
| core.person_preferred_locations | CandidateForms.PreferredWorkLocationIds elements | 3905 | 3739 |
| core.applications | CandidateForms | 3938 | 3938 |
| core.application_stage_history | (insert trigger, 1 per application) | 0 | 3938 |
| core.outbox | (insert triggers; deleted at end) | 0 | 0 |

`core.application_stage_history` keeps the 3938 rows the insert trigger wrote (one `NULL -> stage` row per application). `core.outbox`: 3988 rows written by the insert triggers during this run were deleted (`origin = 'migration'` candidate.submitted events, plus the requisition.published events for the migrated jobs, which carry `origin = 'throughline'` because the jobs do) so the migration replays nothing to partners; 0 unrelated outbox rows remain.

## People merge (core.upsert_person)

- CandidateForms rows: **3938** -> upserted: **3938** -> distinct people: **3772** (skipped, no email and no 10-digit phone: **0**)
- People built from 2+ candidate rows: **154** (covering 320 candidate rows); largest group: 4 rows
- Merge key: normalised email (`lower(trim(email))`) OR last 10 digits of the phone; first row (lowest Id) wins for name/contact, later rows only fill blanks.

| candidate rows per person | people |
|---|---|
| 1 | 3618 |
| 2 | 143 |
| 3 | 10 |
| 4 | 1 |

Top 10 merged groups (check for false merges — same phone or email shared by different names):

| rows | names | emails | phones | CandidateForms.Id |
|---|---|---|---|---|
| 4 | Selvam Dilli | sel.2k8@gmail.com | 7338811757 | 728,1032,2325,2760 |
| 3 | Ashok Ranoji | ashok.ranoji@hotmail.com | 9980768536 | 80,2207,2753 |
| 3 | Chandra Kumar S | chandru.5654@gmail.com | 8073744935 | 746,1084,1477 |
| 3 | Mekala Veera Kumar | veerakumar0064@gmail.com | 9108940064 | 827,1046,3310 |
| 3 | B K Kameswar | kameswarbk1@gmail.com | 9844109839 | 972,1104,1235 |
| 3 | ABHISHEK KUMAR | meet_abhishekh@hotmail.com | 9560538345 | 988,1031,1105 |
| 3 | Jijumon Gopalan | jijumon.g73@gmail.com | 9995443957 | 1042,1720,2478 |
| 3 | Amol Singh Chauhan | amolsinghchauhan48@gmail.com | 7905182641 | 2256,2435,2812 |
| 3 | Seshan P | seshan_1992@yahoo.com | 9500729712 | 2258,3914,3934 |
| 3 | Anuradha V / Anuradha veerapaneni | anuradharhel17@gmail.com | 7993651108 | 2306,2694,2746 |

Merged groups whose rows carry more than one distinct name (candidates for manual review): **1**

| rows | names | emails | phones | CandidateForms.Id |
|---|---|---|---|---|
| 3 | Anuradha V / Anuradha veerapaneni | anuradharhel17@gmail.com | 7993651108 | 2306,2694,2746 |

Emails cleaned before upsert (first well-formed address kept; raw -> used): **12**

- `1073: ramya.jayaraman87@gmail.com 9986703989 -> ramya.jayaraman87@gmail.com`
- `1525: robinmichael.pmp@gmail.com 7975828514 -> robinmichael.pmp@gmail.com`
- `172: shuklaneelanshu2018@gmail.com/neelanshus0@gmail.com -> shuklaneelanshu2018@gmail.com`
- `2192: gunthotihariharanath387@gmail.com sql -> gunthotihariharanath387@gmail.com`
- `3118: bhattacharyya.anindita @gmail.com -> bhattacharyya.anindita@gmail.com`
- `3231: prabhatsmu@gmail.com/prabhatcort@gmail.com -> prabhatsmu@gmail.com`
- `3709: somya.sanu01@gmail.com r -> somya.sanu01@gmail.com`
- `478: nvyas145@gmail.com 8209336727 -> nvyas145@gmail.com`
- `502: vipulpatil254@gmail.com 8780671535 -> vipulpatil254@gmail.com`
- `628: suvedhakadungo097 @gmail.com -> suvedhakadungo097@gmail.com`
- `719: rajdeepshrivastava4048@gmail.com 8103843216 -> rajdeepshrivastava4048@gmail.com`
- `769: subasb462@gmail.com 9632194903 -> subasb462@gmail.com`

## Applications

- CandidateForms rows: **3938** -> applications: **3938**; collapsed onto an existing (job, person, source organisation) key and NOT inserted: **0**; skipped (no person / no job): **0**
- Stage precedence (first match wins): joined > offer_accepted > offered > withdrawn (offer declined) > rejected > dropped > on_hold > shortlisted (candidate identified) > interviewing (incl. feedback pending) > screening > submitted; each from the milestone timestamp OR the 15xxx `IntakeStatusId`.

| stage | applications |
|---|---|
| rejected | 2124 |
| dropped | 809 |
| interviewing | 472 |
| screening | 325 |
| joined | 140 |
| withdrawn | 45 |
| shortlisted | 15 |
| offer_accepted | 8 |

Duplicate list (kept = earliest CreatedAt, then lowest Id; the listed rows were not inserted):

_none_

## Status / enum mapping coverage

### Hiring.HiringStatusId -> core.jobs.status

12001 NEW -> pending_approval · 12002 WIP -> published · 12003 OFFER_ACCEPTED -> published · 12004 CANDIDATE_IDENTIFIED -> published · 12005 ON_HOLD -> on_hold · 12006 CALLED_OFF -> cancelled · 12007 CLOSED -> closed · 12008 CANCELLED -> cancelled · else draft

| legacy id | legacy name | core value | rows |
|---|---|---|---|
| 12002 | Open-WIP | published | 26 |
| 12004 | Candidate Identified | published | 24 |
| 12005 | On Hold | on_hold | 52 |
| 12007 | Closed | closed | 187 |

### Hiring.EngagementTypeId / HiringTypeId / JobDetails.ResourceTypeId -> core.jobs.employment_type

7001 -> permanent, 7002 -> contract when present on EngagementTypeId or HiringTypeId; otherwise ResourceTypeId 40002 (Contract) -> contract, else permanent

| legacy id | legacy name | core value | rows |
|---|---|---|---|
| 0 | EngagementTypeId 9001 / HiringTypeId null / ResourceTypeId null | permanent | 6 |
| 40001 | EngagementTypeId 9001 / HiringTypeId 13003 / ResourceTypeId 40001 | permanent | 2 |
| 40001 | EngagementTypeId 9001 / HiringTypeId null / ResourceTypeId 40001 | permanent | 32 |
| 40002 | EngagementTypeId 9001 / HiringTypeId 13003 / ResourceTypeId 40002 | contract | 8 |
| 40002 | EngagementTypeId 9001 / HiringTypeId null / ResourceTypeId 40002 | contract | 179 |
| 40002 | EngagementTypeId 9001 / HiringTypeId 13001 / ResourceTypeId 40002 | contract | 2 |
| 40003 | EngagementTypeId 9001 / HiringTypeId null / ResourceTypeId 40003 | permanent | 60 |

### Partners.PartnerStatusId -> core.organisations.status

19001/25001 -> active · 19002/25002 -> inactive · 19003 -> pending_approval · 19004 -> rejected · else draft

| legacy id | legacy name | core value | rows |
|---|---|---|---|
| 19001 | Active | active | 39 |

### CandidateForms.IntakeStatusId (15xxx) -> core.applications.stage

| legacy id | legacy name | core value | rows |
|---|---|---|---|
| 15002 | Screening | screening | 325 |
| 15003 | Interviewing | interviewing | 455 |
| 15004 | Feedback Pending | interviewing | 17 |
| 15005 | Rejected | rejected | 2124 |
| 15008 | Onboarded | joined | 140 |
| 15009 | Candidate Identified | shortlisted | 15 |
| 15010 | Candidate Drop | dropped | 809 |
| 15011 | Offer Accepted | offer_accepted | 8 |
| 15012 | Offer Declined | withdrawn | 45 |

### CandidateForms.CandidateStatusId (3xxx screen/tech/ops outcome) -> resulting stage (not used for mapping, shown for coverage)

| legacy id | legacy name | core value | rows |
|---|---|---|---|
| 3001 | Screen Select | dropped | 100 |
| 3001 | Screen Select | interviewing | 89 |
| 3002 | Screen Reject | dropped | 1 |
| 3002 | Screen Reject | rejected | 1274 |
| 3003 | Tech Select | dropped | 21 |
| 3003 | Tech Select | interviewing | 17 |
| 3003 | Tech Select | joined | 58 |
| 3003 | Tech Select | withdrawn | 2 |
| 3004 | Tech Reject | rejected | 634 |
| 3005 | Candidate On Hold | rejected | 40 |
| 3006 | Selected | dropped | 2 |
| 3006 | Selected | interviewing | 9 |
| 3006 | Selected | joined | 24 |
| 3006 | Selected | offer_accepted | 1 |
| 3006 | Selected | rejected | 2 |
| 3006 | Selected | shortlisted | 2 |
| 3006 | Selected | withdrawn | 20 |
| 3007 | Candidate Drop | dropped | 658 |
| 3007 | Candidate Drop | rejected | 1 |
| 3008 | Ops Select | dropped | 4 |
| 3008 | Ops Select | interviewing | 42 |
| 3008 | Ops Select | joined | 58 |
| 3008 | Ops Select | offer_accepted | 2 |
| 3008 | Ops Select | shortlisted | 13 |
| 3008 | Ops Select | withdrawn | 19 |
| 3009 | Ops Reject | rejected | 30 |
| 3010 | Rejected | rejected | 94 |
|  | (null) | dropped | 23 |
|  | (null) | interviewing | 315 |
|  | (null) | offer_accepted | 5 |
|  | (null) | rejected | 49 |
|  | (null) | screening | 325 |
|  | (null) | withdrawn | 4 |

### M_MasterData groups -> core.lookups lists

| MasterTypeId | list | rows |
|---|---|---|
| 1 | agreement_type | 2 |
| 2 | business_unit | 4 |
| 7 | employee_type | 2 |
| 9 | engagement_type | 5 |
| 13 | hiring_type | 4 |
| 14 | hiring_activity_type | 2 |
| 16 | interview_round | 8 |
| 18 | priority | 5 |
| 21 | po_type | 2 |
| 23 | record_type | 2 |
| 24 | rejection_reason | 3 |
| 33 | feedback_category | 4 |
| 40 | resource_type | 3 |
| 41 | interview_mode | 8 |
| 56 | sow_cr_type | 2 |
| 61 | diversity | 3 |
| 66 | hrq_onhold_reason | 3 |
| 83 | partner_category | 3 |
| 86 | partner_tier | 3 |
| 87 | candidate_drop_reason | 3 |
| 88 | candidate_reinitiate_reason | 3 |
| 89 | candidate_reconsider_reason | 3 |

Groups left out on purpose (workflow statuses or app internals, stay as throughline int ids): 3 candidate status, 4 contact-matrix type, 5 name type, 6 email category, 8 engagement status, 10 escalation type, 11 evaluation status, 12 hiring status, 15 candidate intake status, 19 partner status, 20 PO status, 25 active/inactive, 32 approval status, 42 notification category, 47 slot status, 50 interview slot status, 60 yes/no, 79 compliance followed, 80 joining status, 85 review status.

## Dangling legacy ids (referenced but not in the taxonomy / target table)

_none_

Total dangling references: **0** (all skipped; FK columns set to NULL, array elements dropped).

## Users

- Users rows: **986** -> core.users: **986**; skipped: **0** (dedupe on lower(email), lowest UserId kept)
- status: active x986

## Organisations

| kind | status | rows |
|---|---|---|
| vendor | active | 39 |
| platform | active | 1 |

- organisation_members: contact rows without a matching core.users email (0)
- organisation_members: escalation rows without a matching core.users email (0)

## Judgement calls

- `CandidateForms.IntakeStatusId` holds the 15xxx pipeline statuses (Screening/Interviewing/Rejected/Onboarded...) and `CandidateStatusId` holds the 3xxx screen/tech/ops outcomes; the stage is derived from IntakeStatusId + milestone timestamps, CandidateStatusId is reported only.
- `Hiring.EngagementTypeId` is 9001 (Labour) on every row and `HiringTypeId` is a 13xxx deal type, so the 7001/7002 rule never fires; `JobDetails.ResourceTypeId` 40002 (Contract) is used as the fallback for `employment_type`.
- `HiringStatusId` 12003 OFFER_ACCEPTED and 12004 CANDIDATE_IDENTIFIED are 'in-progress' per the enum comments and map to published; 12006 CALLED_OFF maps to cancelled. Only unknown ids fall through to draft.
- `Partners.PartnerStatusId` uses the PARTNER_STATUS group (19001..19004), not ACTIVE_INACTIVE (25001/25002); both are mapped.
- Intake 15012 OFFER_DECLINED maps to `withdrawn` and 15009 CANDIDATE_IDENTIFIED to `shortlisted` (closest core stages).
- Every legacy job is owned by one `platform` organisation `Throughline` (code THROUGHLINE, origin migration).
- Country iso2 comes from `M_Countries.CountryCode`; currency by iso2 (IN->INR, MY->MYR, ...; unknown -> USD).
- `CandidateForms.Diversity` is Yes/No, not a gender id, so `people.diversity_lookup_id` is left NULL.
- `ConsideredForFutureRequirements` is NULL on every row, so `talent_pool_consent` is false everywhere.
- Legacy `timestamp without time zone` values are read as Asia/Kolkata wall-clock time.
- Re-runs DELETE (not TRUNCATE) the filled core tables child->parent, so the script stops instead of cascading if some other system has already attached rows (e.g. core.documents) to migrated users/people.

