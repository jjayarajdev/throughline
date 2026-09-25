#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "08 — Upload CVs to S3"

# ── Generate minimal valid PDF ──
PDF_FILE="$SCRIPT_DIR/test.pdf"
if [[ ! -f "$PDF_FILE" ]]; then
  step "Generating test PDF..."
  node -e "
const pdf = Buffer.from(
  '%PDF-1.0\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj 2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj 3 0 obj<</Type/Page/MediaBox[0 0 3 3]>>endobj\nxref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF\n'
);
require('fs').writeFileSync(process.argv[1], pdf);
console.log(pdf.length);
" "$PDF_FILE"
  ok "Test PDF created ($(wc -c < "$PDF_FILE") bytes)"
else
  ok "Test PDF already exists ($(wc -c < "$PDF_FILE") bytes)"
fi

PDF_SIZE=$(wc -c < "$PDF_FILE" | tr -d ' ')
save_var "PDF_SIZE" "$PDF_SIZE"

# ── Upload helper ──
upload_cv() {
  local token="$1" cv_var="$2" label="$3"
  
  # Get pre-signed URL
  api_post "/upload/cv-intent" "{\"filename\":\"${label}.pdf\",\"sizeBytes\":${PDF_SIZE},\"mimeType\":\"application/pdf\"}" "$token"
  expect "201" "CV intent for $label"
  
  local upload_url=$(json_val "$RESP" "data.uploadUrl")
  local s3_key=$(json_val "$RESP" "data.s3Key")
  
  # Upload to S3
  api_put_file "$upload_url" "$PDF_FILE" "application/pdf"
  expect "200" "S3 upload for $label"
  
  save_var "$cv_var" "$s3_key"
  ok "$label uploaded (key: ${s3_key:0:40}...)"
}

# 18 CV uploads: S1-S10 from priya, S11-S18 from arjun
# (submission numbering matches script 09)

step "Uploading CVs for Priya's submissions..."
upload_cv "$PRIYA_TOKEN" "CV_S1_KEY"  "Rahul-Kumar-BE"
upload_cv "$PRIYA_TOKEN" "CV_S2_KEY"  "Anita-Singh-BE"
upload_cv "$PRIYA_TOKEN" "CV_S3_KEY"  "Vikram-Rao-DevOps"
upload_cv "$PRIYA_TOKEN" "CV_S4_KEY"  "Deepa-Menon-VP"
upload_cv "$PRIYA_TOKEN" "CV_S5_KEY"  "Suresh-Iyer-VP"
upload_cv "$PRIYA_TOKEN" "CV_S6_KEY"  "Kavita-Joshi-QA"
upload_cv "$PRIYA_TOKEN" "CV_S7_KEY"  "Amit-Verma-FE"
upload_cv "$PRIYA_TOKEN" "CV_S8_KEY"  "Pooja-Desai-PM"
upload_cv "$PRIYA_TOKEN" "CV_S9_KEY"  "Ravi-Prasad-CTO"
upload_cv "$PRIYA_TOKEN" "CV_S10_KEY" "Nisha-Agarwal-UX"

step "Uploading CVs for Arjun's submissions..."
upload_cv "$ARJUN_TOKEN" "CV_S11_KEY" "Manoj-Tiwari-BE"
upload_cv "$ARJUN_TOKEN" "CV_S12_KEY" "Sneha-Reddy-DevOps"
upload_cv "$ARJUN_TOKEN" "CV_S13_KEY" "Kiran-Bhat-FE"
upload_cv "$ARJUN_TOKEN" "CV_S14_KEY" "Lakshmi-Nair-FE"
upload_cv "$ARJUN_TOKEN" "CV_S15_KEY" "Rajesh-Gupta-PM"
upload_cv "$ARJUN_TOKEN" "CV_S16_KEY" "Divya-Pillai-CTO"
upload_cv "$ARJUN_TOKEN" "CV_S17_KEY" "Sanjay-Kumar-UX"
upload_cv "$ARJUN_TOKEN" "CV_S18_KEY" "Megha-Shah-Mobile"

header "08 PASSED — 18 CVs uploaded to S3"
