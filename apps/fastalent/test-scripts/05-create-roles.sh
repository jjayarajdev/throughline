#!/usr/bin/env bash
source "$(dirname "$0")/env.sh"

header "05 — Create Roles (10 roles, all start as draft)"

create_role() {
  local token="$1" body="$2" var_name="$3" label="$4"
  step "Creating $label..."
  api_post "/roles" "$body" "$token"
  expect "201" "Create $label"
  local role_id=$(json_val "$RESP" "data.id")
  save_var "$var_name" "$role_id"
  ok "$label created (id: $role_id)"
}

# ── Alpha Technologies roles (R1-R5) ──

create_role "$ALPHA_TOKEN" '{
  "title":"Senior Backend Engineer",
  "description":"We are looking for an experienced backend engineer to join our platform team and build scalable microservices.",
  "roleType":"regular",
  "location":"Bangalore",
  "isRemote":false,
  "employmentType":"full_time",
  "experienceMin":5,
  "experienceMax":10,
  "skills":["Node.js","TypeScript","PostgreSQL","Redis","Docker"],
  "ctcMin":2000000,
  "ctcMax":3500000,
  "payoutType":"per_shortlist",
  "payoutPerShortlist":15000,
  "maxSubmissions":20,
  "maxPerRecruiter":5
}' "R1_ID" "R1: Senior Backend Engineer (Alpha, per_shortlist)"

create_role "$ALPHA_TOKEN" '{
  "title":"DevOps Lead",
  "description":"Seeking a DevOps lead to manage our cloud infrastructure and CI/CD pipelines across multiple environments.",
  "roleType":"regular",
  "location":"Bangalore",
  "isRemote":true,
  "employmentType":"full_time",
  "experienceMin":7,
  "experienceMax":12,
  "skills":["AWS","Kubernetes","Terraform","Jenkins","Python"],
  "ctcMin":2500000,
  "ctcMax":4000000,
  "payoutType":"per_hire",
  "payoutPerHire":75000,
  "maxSubmissions":15,
  "maxPerRecruiter":3
}' "R2_ID" "R2: DevOps Lead (Alpha, per_hire)"

create_role "$ALPHA_TOKEN" '{
  "title":"VP of Engineering",
  "description":"Executive search for VP Engineering to lead a team of 50+ engineers building our next-generation SaaS platform.",
  "roleType":"headhunting",
  "location":"Bangalore",
  "isRemote":false,
  "employmentType":"full_time",
  "experienceMin":15,
  "experienceMax":25,
  "skills":["Engineering Leadership","System Design","Agile","Cloud Architecture"],
  "ctcMin":8000000,
  "ctcMax":15000000,
  "payoutType":"hybrid",
  "payoutPerShortlist":25000,
  "payoutPerHire":200000,
  "maxSubmissions":10,
  "maxPerRecruiter":3
}' "R3_ID" "R3: VP of Engineering (Alpha, hybrid/headhunting)"

create_role "$ALPHA_TOKEN" '{
  "title":"QA Engineer",
  "description":"Join our quality assurance team to build automated test suites and ensure product reliability across releases.",
  "roleType":"regular",
  "location":"Hyderabad",
  "isRemote":false,
  "employmentType":"full_time",
  "experienceMin":2,
  "experienceMax":5,
  "skills":["Selenium","Jest","Cypress","API Testing","CI/CD"],
  "ctcMin":800000,
  "ctcMax":1500000,
  "payoutType":"per_shortlist",
  "payoutPerShortlist":8000,
  "maxSubmissions":25,
  "maxPerRecruiter":5
}' "R4_ID" "R4: QA Engineer (Alpha, per_shortlist — will be paused)"

create_role "$ALPHA_TOKEN" '{
  "title":"Data Analyst",
  "description":"Looking for a data analyst to derive insights from our product analytics and support business decision making.",
  "roleType":"regular",
  "location":"Bangalore",
  "isRemote":true,
  "employmentType":"contract",
  "experienceMin":1,
  "experienceMax":4,
  "skills":["SQL","Python","Tableau","Excel","Statistics"],
  "ctcMin":600000,
  "ctcMax":1200000,
  "payoutType":"per_hire",
  "payoutPerHire":30000,
  "maxSubmissions":20,
  "maxPerRecruiter":5
}' "R5_ID" "R5: Data Analyst (Alpha — stays DRAFT)"

# ── Beta Solutions roles (R6-R10) ──

create_role "$BETA_TOKEN" '{
  "title":"Frontend Developer",
  "description":"We need a skilled frontend developer to build responsive healthcare dashboards using React and TypeScript.",
  "roleType":"regular",
  "location":"Mumbai",
  "isRemote":true,
  "employmentType":"full_time",
  "experienceMin":3,
  "experienceMax":7,
  "skills":["React","TypeScript","CSS","GraphQL","Testing"],
  "ctcMin":1500000,
  "ctcMax":2800000,
  "payoutType":"per_shortlist",
  "payoutPerShortlist":12000,
  "maxSubmissions":20,
  "maxPerRecruiter":5
}' "R6_ID" "R6: Frontend Developer (Beta, per_shortlist)"

create_role "$BETA_TOKEN" '{
  "title":"Product Manager",
  "description":"Seeking a product manager to own the patient engagement module roadmap and work closely with engineering.",
  "roleType":"regular",
  "location":"Mumbai",
  "isRemote":false,
  "employmentType":"full_time",
  "experienceMin":5,
  "experienceMax":10,
  "skills":["Product Strategy","Agile","Analytics","Healthcare","Stakeholder Management"],
  "ctcMin":2000000,
  "ctcMax":3500000,
  "payoutType":"per_hire",
  "payoutPerHire":60000,
  "maxSubmissions":10,
  "maxPerRecruiter":3
}' "R7_ID" "R7: Product Manager (Beta, per_hire)"

create_role "$BETA_TOKEN" '{
  "title":"Chief Technology Officer",
  "description":"Executive search for a CTO to drive technical vision for our healthcare platform and lead the engineering org.",
  "roleType":"headhunting",
  "location":"Mumbai",
  "isRemote":false,
  "employmentType":"full_time",
  "experienceMin":18,
  "experienceMax":30,
  "skills":["CTO","Healthcare Tech","Cloud","Engineering Leadership","AI/ML"],
  "ctcMin":12000000,
  "ctcMax":25000000,
  "payoutType":"hybrid",
  "payoutPerShortlist":30000,
  "payoutPerHire":300000,
  "maxSubmissions":8,
  "maxPerRecruiter":2
}' "R8_ID" "R8: CTO (Beta, hybrid/headhunting — will be closed)"

create_role "$BETA_TOKEN" '{
  "title":"UX Designer",
  "description":"Join our design team to create intuitive healthcare user experiences that patients and doctors will love.",
  "roleType":"regular",
  "location":"Pune",
  "isRemote":true,
  "employmentType":"full_time",
  "experienceMin":3,
  "experienceMax":8,
  "skills":["Figma","User Research","Prototyping","Design Systems","Accessibility"],
  "ctcMin":1200000,
  "ctcMax":2500000,
  "payoutType":"per_shortlist",
  "payoutPerShortlist":10000,
  "maxSubmissions":15,
  "maxPerRecruiter":5
}' "R9_ID" "R9: UX Designer (Beta, per_shortlist)"

create_role "$BETA_TOKEN" '{
  "title":"Mobile Developer",
  "description":"Build our cross-platform mobile application for patient health tracking and telemedicine appointments.",
  "roleType":"regular",
  "location":"Mumbai",
  "isRemote":false,
  "employmentType":"full_time",
  "experienceMin":3,
  "experienceMax":7,
  "skills":["React Native","TypeScript","iOS","Android","REST APIs"],
  "ctcMin":1800000,
  "ctcMax":3000000,
  "payoutType":"per_hire",
  "payoutPerHire":50000,
  "maxSubmissions":15,
  "maxPerRecruiter":4
}' "R10_ID" "R10: Mobile Developer (Beta, per_hire)"

header "05 PASSED — 10 roles created (all draft)"
