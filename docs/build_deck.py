"""Build the Throughline technical overview deck (PPTX). Syntegreti · v0.2"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

# ---- Theme — Syntegreti palette -----------------------------------------
NAVY      = RGBColor(0x06, 0x08, 0x0D)   # Syntegreti dark / ink
NAVY_DARK = RGBColor(0x00, 0x00, 0x00)
ACCENT    = RGBColor(0x00, 0xE8, 0x7B)   # Syntegreti neon green (signature)
TEAL      = RGBColor(0x00, 0xD4, 0xFF)   # Syntegreti cyan
AMBER     = RGBColor(0xFF, 0xB8, 0x00)   # Syntegreti amber (logo accent)
LIGHT     = RGBColor(0xF4, 0xF5, 0xF9)
GREY      = RGBColor(0x7A, 0x84, 0xA0)
TEXT      = RGBColor(0x06, 0x08, 0x0D)
WHITE     = RGBColor(0xFF, 0xFF, 0xFF)
GREY_LITE = RGBColor(0xB0, 0xB8, 0xCD)
SURFACE   = LIGHT
INK       = NAVY
BG        = WHITE
SYNT_BG   = RGBColor(0x06, 0x08, 0x0D)   # dark hero background
SYNT_BG2  = RGBColor(0x0B, 0x0E, 0x17)   # slightly lighter dark surface

FONT = "Calibri"
MONO = "Consolas"

LOGO_PATH = "/Users/jjayaraj/workspaces/studios/epicenter/docs/assets/syntegreti-logo-white.png"

# 16:9
prs = Presentation()
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)
SW, SH = prs.slide_width, prs.slide_height

BLANK = prs.slide_layouts[6]


# ---- Helpers -------------------------------------------------------------
def add_rect(slide, x, y, w, h, fill, line=None):
    shp = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, x, y, w, h)
    shp.fill.solid()
    shp.fill.fore_color.rgb = fill
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line
    shp.shadow.inherit = False
    return shp


def add_text(slide, x, y, w, h, text, *, size=18, bold=False, color=TEXT,
             font=FONT, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP):
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = Inches(0.05)
    tf.margin_top = tf.margin_bottom = Inches(0.02)
    tf.vertical_anchor = anchor
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    r.font.name = font
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.color.rgb = color
    return tb


def add_bullets(slide, x, y, w, h, items, *, size=16, color=TEXT,
                bullet_color=None, line_spacing=1.2):
    bullet_color = bullet_color or ACCENT
    tb = slide.shapes.add_textbox(x, y, w, h)
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.05)
    tf.margin_right = Inches(0.05)
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.line_spacing = line_spacing
        # Bullet marker
        r0 = p.add_run()
        r0.text = "▸  "
        r0.font.name = FONT
        r0.font.size = Pt(size)
        r0.font.bold = True
        r0.font.color.rgb = bullet_color
        # Item text — supports tuple (label, body) for label-bold lines
        if isinstance(item, tuple):
            label, body = item
            r1 = p.add_run()
            r1.text = label
            r1.font.name = FONT
            r1.font.size = Pt(size)
            r1.font.bold = True
            r1.font.color.rgb = color
            r2 = p.add_run()
            r2.text = " — " + body
            r2.font.name = FONT
            r2.font.size = Pt(size)
            r2.font.color.rgb = color
        else:
            r1 = p.add_run()
            r1.text = item
            r1.font.name = FONT
            r1.font.size = Pt(size)
            r1.font.color.rgb = color
    return tb


def add_code_block(slide, x, y, w, h, text, *, size=12):
    add_rect(slide, x, y, w, h, NAVY_DARK)
    tb = slide.shapes.add_textbox(x + Inches(0.2), y + Inches(0.15),
                                  w - Inches(0.4), h - Inches(0.3))
    tf = tb.text_frame
    tf.word_wrap = True
    lines = text.split("\n")
    for i, ln in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.line_spacing = 1.1
        r = p.add_run()
        r.text = ln if ln else " "
        r.font.name = MONO
        r.font.size = Pt(size)
        r.font.color.rgb = WHITE


def add_header(slide, eyebrow, title):
    # Top accent bar
    add_rect(slide, 0, 0, SW, Inches(0.18), ACCENT)
    # Eyebrow
    add_text(slide, Inches(0.6), Inches(0.32), Inches(8), Inches(0.35),
             eyebrow.upper(), size=11, bold=True, color=GREY)
    # Title
    add_text(slide, Inches(0.6), Inches(0.55), Inches(12.2), Inches(0.7),
             title, size=30, bold=True, color=NAVY)
    # Underline
    add_rect(slide, Inches(0.6), Inches(1.25), Inches(0.6), Emu(38100), ACCENT)


def add_footer(slide, page):
    add_text(slide, Inches(0.6), Inches(7.1), Inches(10), Inches(0.3),
             "Throughline  ·  Technical Overview  ·  Syntegreti  ·  v0.2",
             size=9, color=GREY)
    add_text(slide, Inches(11.5), Inches(7.1), Inches(1.3), Inches(0.3),
             str(page), size=9, color=GREY, align=PP_ALIGN.RIGHT)


def add_two_col_bullets(slide, top, items_left, items_right, *, size=15):
    add_bullets(slide, Inches(0.6),  top, Inches(6.05), Inches(5.5),
                items_left,  size=size)
    add_bullets(slide, Inches(6.85), top, Inches(6.05), Inches(5.5),
                items_right, size=size)


def add_table(slide, x, y, w, h, headers, rows, *, header_size=13, body_size=12):
    cols = len(headers)
    nrows = len(rows) + 1
    tbl_shape = slide.shapes.add_table(nrows, cols, x, y, w, h)
    table = tbl_shape.table

    # Column widths — first col 35%, rest split
    table.columns[0].width = int(w * 0.35)
    rest = (w - table.columns[0].width) // (cols - 1)
    for c in range(1, cols):
        table.columns[c].width = rest

    for c, htxt in enumerate(headers):
        cell = table.cell(0, c)
        cell.fill.solid()
        cell.fill.fore_color.rgb = NAVY
        cell.text = ""
        tf = cell.text_frame
        tf.margin_left = Inches(0.12)
        tf.margin_right = Inches(0.12)
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.LEFT
        r = p.add_run()
        r.text = htxt
        r.font.name = FONT
        r.font.size = Pt(header_size)
        r.font.bold = True
        r.font.color.rgb = WHITE

    for ri, row in enumerate(rows, start=1):
        for ci, val in enumerate(row):
            cell = table.cell(ri, ci)
            cell.fill.solid()
            cell.fill.fore_color.rgb = WHITE if ri % 2 else LIGHT
            cell.text = ""
            tf = cell.text_frame
            tf.margin_left = Inches(0.12)
            tf.margin_right = Inches(0.12)
            tf.margin_top = Inches(0.05)
            tf.margin_bottom = Inches(0.05)
            p = tf.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT
            r = p.add_run()
            r.text = val
            r.font.name = FONT
            r.font.size = Pt(body_size)
            r.font.color.rgb = TEXT
            if ci == 0:
                r.font.bold = True
                r.font.color.rgb = NAVY
    return table


def chip(slide, x, y, text, *, color=ACCENT, fg=WHITE, w=None, h=None):
    w = w or Inches(1.7)
    h = h or Inches(0.42)
    shp = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, x, y, w, h)
    shp.fill.solid()
    shp.fill.fore_color.rgb = color
    shp.line.fill.background()
    shp.shadow.inherit = False
    tf = shp.text_frame
    tf.margin_left = Inches(0.1)
    tf.margin_right = Inches(0.1)
    tf.margin_top = Inches(0.02)
    tf.margin_bottom = Inches(0.02)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = text
    r.font.name = FONT
    r.font.size = Pt(12)
    r.font.bold = True
    r.font.color.rgb = fg
    return shp


# ---- SLIDE 1 — Title (Syntegreti dark hero) ------------------------------
def slide_title():
    s = prs.slides.add_slide(BLANK)
    # Dark Syntegreti background
    add_rect(s, 0, 0, SW, SH, SYNT_BG)
    # Left accent stripe — Syntegreti green
    add_rect(s, 0, 0, Inches(0.45), SH, ACCENT)
    # Real Syntegreti logo, top-right (white-on-dark, perfect on this bg)
    s.shapes.add_picture(LOGO_PATH, Inches(10.4), Inches(0.5),
                         Inches(2.4), Inches(0.96))
    # Brand-colour decorative stripes (echo of the logo's S)
    add_rect(s, Inches(11.5), Inches(1.65), Inches(1.4), Inches(0.10), ACCENT)
    add_rect(s, Inches(11.5), Inches(1.83), Inches(1.0), Inches(0.10), TEAL)
    add_rect(s, Inches(11.5), Inches(2.01), Inches(0.6), Inches(0.10), AMBER)

    add_text(s, Inches(0.9), Inches(2.6), Inches(11), Inches(0.5),
             "TECHNICAL OVERVIEW  ·  v0.2", size=13, bold=True, color=ACCENT)
    add_text(s, Inches(0.9), Inches(3.0), Inches(11), Inches(1.4),
             "Throughline", size=66, bold=True, color=WHITE)
    add_text(s, Inches(0.9), Inches(4.4), Inches(11), Inches(0.7),
             "Enterprise Hiring & Partner Management Platform",
             size=22, color=WHITE)
    add_text(s, Inches(0.9), Inches(5.2), Inches(11), Inches(0.6),
             ".NET 8  ·  Next.js 15  ·  React 19  ·  Azure SQL  ·  SAML / JWT",
             size=14, color=GREY_LITE)

    # Bottom strip — slightly lighter dark
    add_rect(s, 0, Inches(6.9), SW, Inches(0.6), SYNT_BG2)
    add_text(s, Inches(0.9), Inches(7.0), Inches(8.5), Inches(0.4),
             "HMS  ·  PMS  ·  CMS    Three sub-systems, one platform",
             size=12, color=GREY_LITE)
    add_text(s, Inches(9.5), Inches(7.0), Inches(3.3), Inches(0.4),
             "a Syntegreti product", size=10, color=GREY,
             align=PP_ALIGN.RIGHT)


# ---- SLIDE 2 — What is Throughline ---------------------------------------
def slide_what():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Overview", "What is Throughline?")
    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "A centralized recruitment operating system that unifies three sub-systems.",
             size=16, color=GREY)

    cards = [
        ("HMS", "Hiring Management",
         "Job requisitions (HRQs), interview rounds, panels, calibration, feedback."),
        ("PMS", "Partner Management",
         "Vendor onboarding, empanelment, engagements, SOWs, escalation matrices."),
        ("CMS", "Candidate Management",
         "Cart/Bin pipeline, BGV, training, asset allocation, post-joining tracking."),
    ]
    card_w = Inches(4.0)
    gap = Inches(0.15)
    start_x = Inches(0.6)
    top = Inches(2.3)

    for i, (tag, title, body) in enumerate(cards):
        x = start_x + (card_w + gap) * i
        add_rect(s, x, top, card_w, Inches(3.6), LIGHT)
        add_rect(s, x, top, card_w, Inches(0.55), NAVY)
        add_text(s, x + Inches(0.3), top + Inches(0.05), Inches(3.5), Inches(0.5),
                 tag, size=18, bold=True, color=ACCENT)
        add_text(s, x + Inches(0.3), top + Inches(0.75), Inches(3.5), Inches(0.5),
                 title, size=18, bold=True, color=NAVY)
        add_text(s, x + Inches(0.3), top + Inches(1.35), Inches(3.5), Inches(2.0),
                 body, size=14, color=TEXT)

    add_text(s, Inches(0.6), Inches(6.35), Inches(12), Inches(0.5),
             "Built for enterprise staffing with strict workflow, audit and RBAC requirements.",
             size=13, color=GREY)
    add_footer(s, 2)


# ---- SLIDE 3 — Architecture ----------------------------------------------
def slide_arch():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Architecture", "High-Level System Architecture")

    # Two repos / two layers
    # Frontend box
    fx, fy, fw, fh = Inches(0.7), Inches(2.0), Inches(3.5), Inches(2.4)
    add_rect(s, fx, fy, fw, fh, LIGHT)
    add_rect(s, fx, fy, fw, Inches(0.5), TEAL)
    add_text(s, fx + Inches(0.2), fy + Inches(0.05), fw, Inches(0.5),
             "apps/throughline-web", size=14, bold=True, color=WHITE)
    add_text(s, fx + Inches(0.2), fy + Inches(0.65), fw, Inches(0.4),
             "Next.js 15 + React 19", size=14, bold=True, color=NAVY)
    add_bullets(s, fx + Inches(0.2), fy + Inches(1.05), fw - Inches(0.3),
                Inches(1.5),
                ["TypeScript · Tailwind · shadcn",
                 "Zustand + React Query",
                 "Axios w/ JWT interceptor"], size=12, line_spacing=1.15)

    # Backend box
    bx, by, bw, bh = Inches(5.1), Inches(2.0), Inches(3.5), Inches(2.4)
    add_rect(s, bx, by, bw, bh, LIGHT)
    add_rect(s, bx, by, bw, Inches(0.5), NAVY)
    add_text(s, bx + Inches(0.2), by + Inches(0.05), bw, Inches(0.5),
             "apps/throughline-api", size=14, bold=True, color=WHITE)
    add_text(s, bx + Inches(0.2), by + Inches(0.65), bw, Inches(0.4),
             "ASP.NET Core 8 API", size=14, bold=True, color=NAVY)
    add_bullets(s, bx + Inches(0.2), by + Inches(1.05), bw - Inches(0.3),
                Inches(1.5),
                ["Clean Architecture, 287 .cs files",
                 "EF Core 8 + Dapper",
                 "JWT + SAML (Okta) + Azure AD"], size=12, line_spacing=1.15)

    # Data box
    dx, dy, dw, dh = Inches(9.5), Inches(2.0), Inches(3.2), Inches(2.4)
    add_rect(s, dx, dy, dw, dh, LIGHT)
    add_rect(s, dx, dy, dw, Inches(0.5), ACCENT)
    add_text(s, dx + Inches(0.2), dy + Inches(0.05), dw, Inches(0.5),
             "Azure Data Plane", size=14, bold=True, color=WHITE)
    add_text(s, dx + Inches(0.2), dy + Inches(0.65), dw, Inches(0.4),
             "Azure SQL · Blob · Functions",
             size=14, bold=True, color=NAVY)
    add_bullets(s, dx + Inches(0.2), dy + Inches(1.05), dw - Inches(0.3),
                Inches(1.5),
                ["Epicenterv2 SQL DB",
                 "Blob storage (SAS URL)",
                 "SendEmailFunction (Azure Fn)"], size=12, line_spacing=1.15)

    # Arrows
    a1 = s.shapes.add_connector(1, fx + fw, Inches(3.2), bx, Inches(3.2))
    a1.line.color.rgb = NAVY
    a1.line.width = Pt(2.5)
    add_text(s, fx + fw + Inches(0.05), Inches(2.85), Inches(0.85), Inches(0.3),
             "HTTPS · JWT", size=10, color=GREY)

    a2 = s.shapes.add_connector(1, bx + bw, Inches(3.2), dx, Inches(3.2))
    a2.line.color.rgb = NAVY
    a2.line.width = Pt(2.5)
    add_text(s, bx + bw + Inches(0.05), Inches(2.85), Inches(0.85), Inches(0.3),
             "EF Core / Dapper", size=10, color=GREY)

    # External integrations row
    add_text(s, Inches(0.7), Inches(4.85), Inches(12), Inches(0.4),
             "External integrations", size=14, bold=True, color=NAVY)
    chips = ["Okta SAML 2.0", "Microsoft Graph", "LDAP / AD",
             "MailKit SMTP", "ClosedXML / EPPlus", "Serilog → File"]
    cx = Inches(0.7)
    for label in chips:
        chip(s, cx, Inches(5.3), label, color=NAVY, w=Inches(2.0))
        cx += Inches(2.05)

    # Deploy footer
    add_text(s, Inches(0.7), Inches(6.1), Inches(12), Inches(0.4),
             "Deploy", size=14, bold=True, color=NAVY)
    add_text(s, Inches(0.7), Inches(6.45), Inches(12), Inches(0.5),
             "Backend → Docker (multi-stage .NET 8) on Azure VM, GitHub Actions SSH deploy.    "
             "Frontend → PM2 on port 8080, typically behind Windows IIS reverse proxy.",
             size=12, color=TEXT)
    add_footer(s, 3)


# ---- SLIDE 4 — Backend tech stack ----------------------------------------
def slide_backend_stack():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Backend", "Technology Stack")

    rows = [
        ("Runtime",       ".NET 8 (LTS) — ASP.NET Core Web API"),
        ("Database",      "Azure SQL Server  ·  Catalog: Epicenterv2"),
        ("ORM",           "EF Core 8  +  Dapper 2.1  +  EFCore.BulkExtensions"),
        ("Auth",          "JWT (HS256)  +  SAML 2.0 (Sustainsys / Okta)  +  Azure AD"),
        ("Mapping",       "AutoMapper 13"),
        ("Logging",       "Serilog 9  ·  rolling daily file sinks  ·  Logs/requests-*.log"),
        ("API Docs",      "Swashbuckle / Swagger (/swagger)"),
        ("Email",         "MailKit  +  delegated Azure Function (SendEmailFunction)"),
        ("Files",         "Azure Blob Storage  ·  SAS URL"),
        ("Office I/O",    "ClosedXML  ·  EPPlus 8 — Excel import/export"),
        ("Identity APIs", "Microsoft Graph 5  ·  System.DirectoryServices (LDAP)"),
    ]
    add_table(s, Inches(0.6), Inches(1.55), Inches(12.1), Inches(5.3),
              ["Layer", "Choice"], rows, header_size=13, body_size=12)
    add_footer(s, 4)


# ---- SLIDE 5 — Backend project structure ---------------------------------
def slide_backend_structure():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Backend", "Project Structure — Clean Architecture")

    code = """apps/throughline-api/
├── Controllers/         31 HTTP endpoints (resource-per-controller)
├── Application/         Services · DTOs · business orchestration
├── Domain/              59 entities — CMS · HMS · PMS · Masters
├── Infrastructure/      DbContext · repositories · LINQ queries
├── BackgroundServices/  Hourly · Daily · Email workers
├── Middleware/          ExceptionMiddleware · RequestLoggingMiddleware
├── Extensions/          DI · CORS · Serilog · AutoMapper wiring
└── Program.cs           Composition root"""
    add_code_block(s, Inches(0.6), Inches(1.6), Inches(8.2), Inches(4.8),
                   code, size=13)

    add_text(s, Inches(9.1), Inches(1.6), Inches(3.7), Inches(0.4),
             "Highlights", size=14, bold=True, color=NAVY)
    add_bullets(s, Inches(9.1), Inches(2.0), Inches(3.7), Inches(4.5), [
        "287 C# source files",
        "Cleanly layered, repo + DI pattern throughout",
        "Domain split by sub-system, not by entity type",
        "Heavy *History entities — audit is first-class",
        "Not strict CQRS / DDD — pragmatic services",
    ], size=13, line_spacing=1.25)
    add_footer(s, 5)


# ---- SLIDE 6 — Controllers -----------------------------------------------
def slide_controllers():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Backend", "31 Controllers — Grouped by Sub-system")

    groups = [
        ("Auth & Users", NAVY,
         ["AuthController", "UserController"]),
        ("Hiring (HMS)", TEAL,
         ["HiringRequestController", "JobDetailsController",
          "InterviewRoundController", "InterviewSlotController",
          "CandidateFormController", "CalibrationController",
          "PanelController"]),
        ("Candidates (CMS)", ACCENT,
         ["CandidateBinController", "CandidateBgvController",
          "CandidatePersonalDetailsController", "AssetDetailsController",
          "TrainingDetailsController", "ProfileTrackerController",
          "JoiningRescheduleHistoryController"]),
        ("Partners (PMS)", NAVY,
         ["PartnerController", "PartnerCategoryController",
          "EmpanelmentController", "EngagementController",
          "ContactMatrixController", "EscalationMatrixController",
          "SOWController"]),
        ("Operations", TEAL,
         ["DashboardController", "NotificationController",
          "EmailTemplateController", "MasterController",
          "FileServerController", "SearchColumnController",
          "RCMSController"]),
    ]
    # 2-column layout
    col_x = [Inches(0.6), Inches(6.85)]
    col_y = [Inches(1.55), Inches(1.55)]
    col_w = Inches(6.05)

    for i, (title, color, items) in enumerate(groups):
        col = i % 2
        x = col_x[col]
        y = col_y[col]
        # Title pill
        add_rect(s, x, y, col_w, Inches(0.42), color)
        add_text(s, x + Inches(0.2), y + Inches(0.04), col_w - Inches(0.2),
                 Inches(0.4), title, size=14, bold=True, color=WHITE)
        bh = Inches(0.32) * len(items) + Inches(0.25)
        add_bullets(s, x + Inches(0.05), y + Inches(0.5),
                    col_w - Inches(0.1), bh, items,
                    size=12, line_spacing=1.15, bullet_color=color)
        col_y[col] += Inches(0.5) + bh + Inches(0.15)
    add_footer(s, 6)


# ---- SLIDE 7 — Domain model ----------------------------------------------
def slide_domain():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Backend", "Domain Model — 59 Entities")

    cols = [
        ("CMS", ACCENT, [
            "Candidate · CandidateHistory",
            "CandidateBin",
            "CandidatePersonalDetails",
            "CandidateBgvDetails",
            "AssetDetails · TrainingDetails",
            "ProfileTracker · CandidateRateCard",
            "InterviewSlot · InterviewActionLog",
            "CandidateInterviewFeedBack",
        ]),
        ("HMS", TEAL, [
            "HiringRequest",
            "JobDetails · InterviewRound",
            "Calibration",
            "Feedback · FeedbackDetail",
            "PanelHistory",
            "OnholdHiringRequest",
        ]),
        ("PMS", NAVY, [
            "Partner · PartnerCategory",
            "PartnerEmpanel",
            "Engagement",
            "ContactMatrix",
            "EscalationMatrix",
            "SOW · SOW_CR",
            "PODetail",
        ]),
        ("Masters / RBAC", GREY, [
            "M_Country · State · City",
            "M_Domain · SubDomain · Skill",
            "M_JobLevel · MasterData",
            "M_Configuration",
            "M_Module · Form · RoleFormAccess",
            "Users · Role · UserRole",
        ]),
    ]
    card_w = Inches(2.95)
    gap = Inches(0.15)
    start_x = Inches(0.6)
    top = Inches(1.55)

    for i, (title, color, items) in enumerate(cols):
        x = start_x + (card_w + gap) * i
        add_rect(s, x, top, card_w, Inches(5.0), LIGHT)
        add_rect(s, x, top, card_w, Inches(0.5), color)
        add_text(s, x + Inches(0.2), top + Inches(0.05), card_w, Inches(0.5),
                 title, size=14, bold=True, color=WHITE)
        add_bullets(s, x + Inches(0.1), top + Inches(0.65),
                    card_w - Inches(0.2), Inches(4.3), items,
                    size=11, line_spacing=1.25, bullet_color=color)

    add_text(s, Inches(0.6), Inches(6.7), Inches(12), Inches(0.4),
             "Heavy use of *History entities means full audit trails are first-class.",
             size=12, color=GREY)
    add_footer(s, 7)


# ---- SLIDE 8 — Background workers ----------------------------------------
def slide_workers():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Backend", "Background Workers")

    cards = [
        ("EpiCenterHourlyService", "Every hour", TEAL, [
            "Auto-expire interview slots past validity hours",
            "Mark candidates as dropped after 3 rejections",
            "Refresh interview slot counts",
        ]),
        ("EpiCenterDailyService", "Once per day", ACCENT, [
            "Detect inactive partners (no uploads 30d+)",
            "Auto-deactivate partners w/ expired evaluation periods",
            "Reassign HRQs to RM owner past acceptance threshold",
            "Reject on-hold candidates exceeding hold duration",
            "Trigger escalations on stalled requisitions",
        ]),
        ("EpicenterEmailService", "Wired (currently disabled)", NAVY, [
            "Workflow-driven outbound email",
            "Templates editable via EmailTemplateController",
            "Currently delegates send to Azure Function",
        ]),
    ]
    card_w = Inches(4.0)
    gap = Inches(0.15)
    start_x = Inches(0.6)
    top = Inches(1.55)

    for i, (title, sub, color, items) in enumerate(cards):
        x = start_x + (card_w + gap) * i
        add_rect(s, x, top, card_w, Inches(5.2), LIGHT)
        add_rect(s, x, top, card_w, Inches(0.7), color)
        add_text(s, x + Inches(0.2), top + Inches(0.06),
                 card_w - Inches(0.2), Inches(0.4),
                 title, size=14, bold=True, color=WHITE)
        add_text(s, x + Inches(0.2), top + Inches(0.4),
                 card_w - Inches(0.2), Inches(0.3),
                 sub, size=11, color=WHITE)
        add_bullets(s, x + Inches(0.15), top + Inches(0.85),
                    card_w - Inches(0.3), Inches(4.2), items,
                    size=12, line_spacing=1.3, bullet_color=color)
    add_footer(s, 8)


# ---- SLIDE 9 — Cross-cutting concerns ------------------------------------
def slide_xcut():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Backend", "Cross-cutting Concerns")

    left = [
        ("ExceptionMiddleware",
         "Global error handler · uniform ApiResponseDto<T> · logs full inner-exception chain via Serilog."),
        ("RequestLoggingMiddleware",
         "Per-request timing & correlation through the pipeline."),
        ("Serilog",
         "Structured logs to Logs/requests-*.log, daily rolling files."),
    ]
    right = [
        ("JWT Validation",
         "Issuer · audience · lifetime · signing key all enforced."),
        ("CORS",
         "Permissive — AnyOrigin / AnyMethod / AnyHeader + credentials. Tighten per env."),
        ("Swagger",
         "Auto-generated OpenAPI from XML doc comments on controllers."),
    ]
    add_two_col_bullets(s, Inches(1.7), left, right, size=14)
    add_footer(s, 9)


# ---- SLIDE 10 — Backend deployment ---------------------------------------
def slide_backend_deploy():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Backend", "Build & Deployment")

    code = """# Multi-stage Docker build
FROM mcr.microsoft.com/dotnet/sdk:8.0    AS build
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime

EXPOSE 8080  8081
ENTRYPOINT ["dotnet", "EpicenterX.dll"]

# .github/workflows/deploy_backend.yml
on: { push: { branches: [master, Development] } }
deploy:
  - SSH key from secrets → Azure VM 52.159.149.78
  - master       → ~/dbackend.sh             (production)
  - Development  → ~/development_backend.sh  (dev)"""
    add_code_block(s, Inches(0.6), Inches(1.6), Inches(8.2), Inches(4.8),
                   code, size=12)

    add_text(s, Inches(9.1), Inches(1.6), Inches(3.7), Inches(0.4),
             "Notes", size=14, bold=True, color=NAVY)
    add_bullets(s, Inches(9.1), Inches(2.0), Inches(3.7), Inches(4.5), [
        "Multi-stage build keeps runtime image small",
        "Two long-lived branches: master + Development",
        "Secrets via .NET User Secrets locally; appsettings overrides in prod",
        "Future: move secrets to Azure Key Vault",
    ], size=13, line_spacing=1.3)
    add_footer(s, 10)


# ---- SLIDE 11 — Frontend tech stack --------------------------------------
def slide_frontend_stack():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Frontend", "Technology Stack")

    rows = [
        ("Framework",     "Next.js 15.2 (App Router · Turbopack)  on  React 19"),
        ("Language",      "TypeScript 5 — strict"),
        ("UI Kit",        "shadcn/ui on Radix  +  Tailwind CSS 4  +  Lucide icons"),
        ("Client State",  "Zustand 5 — persisted to sessionStorage (key: hp-storage)"),
        ("Server State",  "TanStack React Query 5"),
        ("HTTP",          "Axios — interceptors inject JWT, handle 401 / 5xx"),
        ("Forms",         "React Hook Form 7  +  Zod 3  +  @hookform/resolvers"),
        ("Tables",        "TanStack Table 8  +  react-window virtualization"),
        ("Charts",        "Recharts  +  react-gauge-chart"),
        ("Files",         "mammoth (DOCX)  ·  react-pdftotext  ·  xlsx"),
        ("UX",            "Sonner toasts  ·  next-themes  ·  Lottie  ·  react-day-picker"),
    ]
    add_table(s, Inches(0.6), Inches(1.55), Inches(12.1), Inches(5.3),
              ["Layer", "Choice"], rows, header_size=13, body_size=12)
    add_footer(s, 11)


# ---- SLIDE 12 — Frontend route map ---------------------------------------
def slide_routes():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Frontend", "App Router Map")

    code = """/                              Login (Zod-validated)
/unauthorized                  403 page
/panel-feedback/[id]           Standalone interview-feedback form

/home/                         Authenticated shell (sidebar + header)
  ├─ dashboard                 KPIs · charts · role-filtered views
  ├─ partner-onboarding        Add / edit partner · [profile]
  ├─ partner-engagement        Performance tracking
  ├─ partner-podetails         PO details
  ├─ (hiring-management)/...   HRQs · review requests · details
  ├─ candidate-management      Create / edit / profile
  ├─ candidate-approval        Cart / Bin approval flows
  ├─ candidate-onboarding      Post-hire workflows
  ├─ candidate-feedback-review Interview feedback
  ├─ (interview-slot)/slot-management
  ├─ application-roles  /  master   Admin & master data
  └─ edit-profile"""
    add_code_block(s, Inches(0.6), Inches(1.55), Inches(12.1), Inches(5.4),
                   code, size=12)
    add_footer(s, 12)


# ---- SLIDE 13 — Feature highlights ---------------------------------------
def slide_features():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Frontend", "Feature Highlights")

    features = [
        ("Dashboard",
         "Active partners / candidates / HRQs · weekly submission bars · "
         "candidate-stage pie · interview KPIs · views differ per role."),
        ("Cart / Bin model",
         "Approved candidates → cart; rejected/flagged → bin with re-evaluation flow."),
        ("Hiring workflow",
         "Create → BET Approver → RM Owner accept → Slot allocation → "
         "Submission → Feedback → Hire."),
        ("Resume parsing",
         "Client-side DOCX extraction (mammoth) and PDF (react-pdftotext)."),
        ("Slot management",
         "Partner self-service + admin allocation with conflict detection."),
    ]
    y = Inches(1.6)
    for label, body in features:
        add_rect(s, Inches(0.6), y, Inches(0.12), Inches(0.7), ACCENT)
        add_text(s, Inches(0.85), y, Inches(3.1), Inches(0.35),
                 label, size=14, bold=True, color=NAVY)
        add_text(s, Inches(0.85), y + Inches(0.32), Inches(11.8), Inches(0.6),
                 body, size=12, color=TEXT)
        y += Inches(0.85)
    add_footer(s, 13)


# ---- SLIDE 14 — State, Auth, API -----------------------------------------
def slide_state_auth():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Frontend", "State · Auth · API")

    # Three columns
    col_w = Inches(4.0)
    gap = Inches(0.15)
    start_x = Inches(0.6)
    top = Inches(1.6)

    cols = [
        ("Stores (Zustand)", NAVY, [
            "userStore",
            "useHiringStore",
            "useCandidateStore",
            "useCandidateOnboarding",
            "userPartnerStore",
            "Persisted in sessionStorage",
        ]),
        ("Auth Flow", TEAL, [
            "POST /Auth/login (email + password)",
            "Zod schema validates form",
            "Response → token + roles",
            "Saved to userStore + cookies",
            "redirectBasedOnRole() routes user",
            "Roles: Admin · RM Owner · Partner · …",
        ]),
        ("API Layer", ACCENT, [
            "/src/services/api/*",
            "hiring · candidate · partner · slot",
            "onboarding · user · master",
            "Base URL = NEXT_PUBLIC_API_BASE_URL",
            "Axios interceptor: JWT bearer",
            "Centralized 401 / 5xx handling",
        ]),
    ]
    for i, (title, color, items) in enumerate(cols):
        x = start_x + (col_w + gap) * i
        add_rect(s, x, top, col_w, Inches(5.0), LIGHT)
        add_rect(s, x, top, col_w, Inches(0.55), color)
        add_text(s, x + Inches(0.2), top + Inches(0.07),
                 col_w - Inches(0.2), Inches(0.5),
                 title, size=14, bold=True, color=WHITE)
        add_bullets(s, x + Inches(0.15), top + Inches(0.7),
                    col_w - Inches(0.3), Inches(4.2),
                    items, size=12, line_spacing=1.35, bullet_color=color)

    add_text(s, Inches(0.6), Inches(6.8), Inches(12), Inches(0.4),
             "Permission flags (isHiringCreate, isHiringEdit, isShowslotAllocation, …) gate the UI per role.",
             size=12, color=GREY)
    add_footer(s, 14)


# ---- SLIDE 15 — Components & build ---------------------------------------
def slide_components():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Frontend", "Components & Build")

    code = """src/components/
├── ui/              34 shadcn primitives (Radix-based)
├── layout/          AppHeader · AppSidebar · UserRoles
├── dashboard/       DashboardDemo · skeletons
├── hiring-forms/    HiringForm · HiringTable · CartTable
├── candidate/       Profile · CartTable · BinTable
├── partner-form/  partner-profile/  onboarding/
├── slot-management/ form-fields/  common/  error/
└── providers.tsx    Query · Theme · Sidebar providers"""
    add_code_block(s, Inches(0.6), Inches(1.6), Inches(8.2), Inches(4.0),
                   code, size=13)

    add_text(s, Inches(9.1), Inches(1.6), Inches(3.7), Inches(0.4),
             "~206 component files", size=14, bold=True, color=NAVY)
    add_bullets(s, Inches(9.1), Inches(2.0), Inches(3.7), Inches(3.6), [
        "Feature-folder layout",
        "Reusable form-fields module",
        "Skeletons + error boundaries",
        "Shared common/ utilities",
    ], size=13, line_spacing=1.3)

    # Build / deploy strip
    add_text(s, Inches(0.6), Inches(5.85), Inches(12), Inches(0.4),
             "Build & Deploy", size=14, bold=True, color=NAVY)
    chips_data = [
        ("npm run dev (turbopack)", TEAL),
        ("npm run build", TEAL),
        ("npm start :8080", TEAL),
        ("PM2 (start_epicenter.json)", ACCENT),
        ("Behind Windows IIS", ACCENT),
    ]
    cx = Inches(0.6)
    for label, color in chips_data:
        chip(s, cx, Inches(6.25), label, color=color, w=Inches(2.4))
        cx += Inches(2.45)
    add_footer(s, 15)


# ---- SLIDE 16 — Security posture -----------------------------------------
def slide_security():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Quality", "Security Posture")

    left = [
        ("Authentication",
         "JWT bearer (HS256) — issuer/audience/lifetime/signature all validated. "
         "Optional SAML 2.0 SSO via Okta and Azure AD support."),
        ("Authorization",
         "RBAC matrix in DB — M_Module · M_Form · M_RoleFormAccess. "
         "UI mirrors the same flags per role."),
        ("Audit",
         "*History entities track candidate, engagement, panel, bin, PO, "
         "joining-reschedule changes."),
        ("Transport",
         "HTTPS enforced. Sensitive config via .NET User Secrets locally."),
    ]
    add_text(s, Inches(0.6), Inches(1.55), Inches(6.05), Inches(0.4),
             "Strengths", size=14, bold=True, color=TEAL)
    add_bullets(s, Inches(0.6), Inches(2.0), Inches(6.05), Inches(5.0),
                left, size=13, line_spacing=1.3, bullet_color=TEAL)

    right = [
        ("CORS",
         "Currently AnyOrigin + credentials — tighten per environment."),
        ("Build hygiene",
         "next.config.ts ignores TypeScript errors during build — re-enable in CI."),
        ("Email service",
         "EpicenterEmailService is wired but commented out — re-enable after template QA."),
        ("Secrets",
         "Move from appsettings.Production.json to Azure Key Vault."),
    ]
    add_text(s, Inches(6.85), Inches(1.55), Inches(6.05), Inches(0.4),
             "Items to address", size=14, bold=True, color=ACCENT)
    add_bullets(s, Inches(6.85), Inches(2.0), Inches(6.05), Inches(5.0),
                right, size=13, line_spacing=1.3, bullet_color=ACCENT)
    add_footer(s, 16)


# ---- SLIDE 17 — Roadmap --------------------------------------------------
def slide_roadmap():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Next", "Roadmap & Talking Points")

    items_left = [
        ("Tighten CORS",
         "Per-environment allow-list instead of AnyOrigin."),
        ("Re-enable email worker",
         "Once template QA is complete."),
        ("Re-enable Next.js type-check",
         "Stop suppressing build-time TS errors in CI."),
    ]
    items_right = [
        ("Secrets to Key Vault",
         "Move appsettings secrets to Azure Key Vault."),
        ("Consider CQRS / MediatR",
         "As controller bodies grow, plus integration tests around "
         "the Hourly / Daily background services."),
        ("Generate typed API client",
         "From the Swashbuckle OpenAPI spec, replace manual Axios services."),
    ]
    add_two_col_bullets(s, Inches(1.7), items_left, items_right, size=14)
    add_footer(s, 17)


# ---- SLIDE 18 — Closing (Syntegreti dark) --------------------------------
def slide_close():
    s = prs.slides.add_slide(BLANK)
    add_rect(s, 0, 0, SW, SH, SYNT_BG)
    add_rect(s, 0, 0, Inches(0.45), SH, ACCENT)

    # Logo top-right
    s.shapes.add_picture(LOGO_PATH, Inches(10.4), Inches(0.5),
                         Inches(2.4), Inches(0.96))

    add_text(s, Inches(0.9), Inches(2.4), Inches(11), Inches(1.2),
             "Thank you", size=72, bold=True, color=WHITE)
    add_text(s, Inches(0.9), Inches(3.7), Inches(11), Inches(0.6),
             "Questions & discussion", size=22, color=ACCENT)

    add_text(s, Inches(0.9), Inches(5.0), Inches(11), Inches(0.4),
             "QUICK LINKS", size=12, bold=True, color=ACCENT)
    add_bullets(s, Inches(0.9), Inches(5.4), Inches(12), Inches(1.6), [
        "Repos — apps/throughline-api  ·  apps/throughline-web",
        "Swagger — /swagger on the API host",
        "Logs — Logs/requests-*.log (Serilog daily rolling)",
        "CI — .github/workflows/deploy_backend.yml",
    ], size=14, color=WHITE, bullet_color=ACCENT, line_spacing=1.4)

    # Syntegreti footer strip
    add_rect(s, 0, Inches(6.9), SW, Inches(0.6), SYNT_BG2)
    add_text(s, Inches(0.9), Inches(7.0), Inches(11), Inches(0.4),
             "Throughline  ·  a Syntegreti product",
             size=11, color=GREY_LITE)
    add_text(s, Inches(10.0), Inches(7.0), Inches(2.8), Inches(0.4),
             "v0.2", size=10, color=GREY, align=PP_ALIGN.RIGHT)


# ---- Build all -----------------------------------------------------------
slide_title()
slide_what()
slide_arch()
slide_backend_stack()
slide_backend_structure()
slide_controllers()
slide_domain()
slide_workers()
slide_xcut()
slide_backend_deploy()
slide_frontend_stack()
slide_routes()
slide_features()
slide_state_auth()
slide_components()
slide_security()
slide_roadmap()
slide_close()

out = "/Users/jjayaraj/workspaces/studios/epicenter/docs/Throughline-Technical-Overview-v0.2.pptx"
prs.save(out)
print("Saved:", out)
print("Slides:", len(prs.slides.__iter__.__self__._sldIdLst))
