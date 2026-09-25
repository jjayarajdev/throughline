#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "09 — Create Submissions (18 total)"

submit() {
  local token="$1" var="$2" role_id="$3" s3_key="$4" name="$5" email="$6" phone="$7" ctc="$8" notice="$9" label="${10}"
  step "Submitting $label..."
  api_post "/submissions" "{
    \"roleId\":\"${role_id}\",
    \"candidateName\":\"${name}\",
    \"candidateEmail\":\"${email}\",
    \"candidatePhone\":\"${phone}\",
    \"s3Key\":\"${s3_key}\",
    \"cvOriginalFilename\":\"${name// /-}.pdf\",
    \"cvSizeBytes\":${PDF_SIZE},
    \"cvMimeType\":\"application/pdf\",
    \"expectedCtc\":${ctc},
    \"noticePeriodDays\":${notice}
  }" "$token"
  expect "201" "Submit $label"
  local sub_id=$(json_val "$RESP" "data.id")
  save_var "$var" "$sub_id"
  ok "$label (id: $sub_id)"
}

# ── R1: Senior Backend Engineer (Alpha, per_shortlist) ──
submit "$PRIYA_TOKEN" "S1_ID" "$R1_ID" "$CV_S1_KEY"  "Rahul Kumar"   "rahul.k@example.com"   "+919800000001" 2500000 30 "S1: Rahul -> R1"
submit "$PRIYA_TOKEN" "S2_ID" "$R1_ID" "$CV_S2_KEY"  "Anita Singh"   "anita.s@example.com"   "+919800000002" 2800000 15 "S2: Anita -> R1"
submit "$ARJUN_TOKEN" "S11_ID" "$R1_ID" "$CV_S11_KEY" "Manoj Tiwari" "manoj.t@example.com"   "+919800000011" 2200000 60 "S11: Manoj -> R1 (arjun)"

# ── R2: DevOps Lead (Alpha, per_hire) ──
submit "$PRIYA_TOKEN" "S3_ID" "$R2_ID" "$CV_S3_KEY"  "Vikram Rao"    "vikram.r@example.com"  "+919800000003" 3000000 30 "S3: Vikram -> R2"
submit "$ARJUN_TOKEN" "S12_ID" "$R2_ID" "$CV_S12_KEY" "Sneha Reddy"  "sneha.r@example.com"   "+919800000012" 3200000 45 "S12: Sneha -> R2 (arjun)"

# ── R3: VP of Engineering (Alpha, hybrid/headhunting) ──
submit "$PRIYA_TOKEN" "S4_ID" "$R3_ID" "$CV_S4_KEY"  "Deepa Menon"   "deepa.m@example.com"   "+919800000004" 10000000 90 "S4: Deepa -> R3"
submit "$PRIYA_TOKEN" "S5_ID" "$R3_ID" "$CV_S5_KEY"  "Suresh Iyer"   "suresh.i@example.com"  "+919800000005" 9500000 60 "S5: Suresh -> R3"

# ── R6: Frontend Developer (Beta, per_shortlist) ──
submit "$PRIYA_TOKEN" "S6_ID" "$R6_ID" "$CV_S7_KEY"  "Amit Verma"    "amit.v@example.com"    "+919800000007" 2000000 30 "S6: Amit -> R6"
submit "$ARJUN_TOKEN" "S13_ID" "$R6_ID" "$CV_S13_KEY" "Kiran Bhat"   "kiran.b@example.com"   "+919800000013" 1800000 15 "S13: Kiran -> R6 (arjun)"
submit "$ARJUN_TOKEN" "S14_ID" "$R6_ID" "$CV_S14_KEY" "Lakshmi Nair" "lakshmi.n@example.com" "+919800000014" 2200000 30 "S14: Lakshmi -> R6 (arjun)"

# ── R7: Product Manager (Beta, per_hire) ──
submit "$PRIYA_TOKEN" "S7_ID" "$R7_ID" "$CV_S8_KEY"  "Pooja Desai"   "pooja.d@example.com"   "+919800000008" 2500000 45 "S7: Pooja -> R7"
submit "$ARJUN_TOKEN" "S15_ID" "$R7_ID" "$CV_S15_KEY" "Rajesh Gupta" "rajesh.g@example.com"  "+919800000015" 2800000 30 "S15: Rajesh -> R7 (arjun)"

# ── R8: CTO (Beta, hybrid/headhunting) ──
submit "$PRIYA_TOKEN" "S8_ID" "$R8_ID" "$CV_S9_KEY"  "Ravi Prasad"   "ravi.p@example.com"    "+919800000009" 18000000 90 "S8: Ravi -> R8"
submit "$ARJUN_TOKEN" "S16_ID" "$R8_ID" "$CV_S16_KEY" "Divya Pillai" "divya.p@example.com"   "+919800000016" 15000000 60 "S16: Divya -> R8 (arjun)"

# ── R9: UX Designer (Beta, per_shortlist) ──
submit "$PRIYA_TOKEN" "S9_ID" "$R9_ID" "$CV_S10_KEY" "Nisha Agarwal" "nisha.a@example.com"   "+919800000010" 1800000 30 "S9: Nisha -> R9"
submit "$ARJUN_TOKEN" "S17_ID" "$R9_ID" "$CV_S17_KEY" "Sanjay Kumar" "sanjay.k@example.com"  "+919800000017" 1600000 15 "S17: Sanjay -> R9 (arjun)"

# ── R10: Mobile Developer (Beta, per_hire) ──
submit "$PRIYA_TOKEN" "S10_ID" "$R10_ID" "$CV_S6_KEY" "Kavita Joshi" "kavita.j@example.com"  "+919800000006" 2200000 30 "S10: Kavita -> R10"
submit "$ARJUN_TOKEN" "S18_ID" "$R10_ID" "$CV_S18_KEY" "Megha Shah"  "megha.s@example.com"   "+919800000018" 2000000 45 "S18: Megha -> R10 (arjun)"

header "09 PASSED — 18 submissions created across 8 active roles"
