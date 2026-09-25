"""Build the Throughline Business / Functional sales deck (PPTX) for a GCC buyer. Syntegreti · v0.2"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

# ---- Theme — Syntegreti palette -----------------------------------------
NAVY      = RGBColor(0x06, 0x08, 0x0D)   # Syntegreti dark / ink
NAVY_DARK = RGBColor(0x00, 0x00, 0x00)
ACCENT    = RGBColor(0x00, 0xE8, 0x7B)   # Syntegreti neon green (signature)
TEAL      = RGBColor(0x00, 0xD4, 0xFF)   # Syntegreti cyan
AMBER     = RGBColor(0xFF, 0xB8, 0x00)
GREEN     = RGBColor(0x2E, 0x8B, 0x57)   # darker forest green for status states
LIGHT     = RGBColor(0xF4, 0xF5, 0xF9)
LIGHTER   = RGBColor(0xFB, 0xFC, 0xFE)
GREY      = RGBColor(0x7A, 0x84, 0xA0)
GREY2     = RGBColor(0xB0, 0xB8, 0xCD)
TEXT      = RGBColor(0x06, 0x08, 0x0D)
WHITE     = RGBColor(0xFF, 0xFF, 0xFF)

FONT = "Calibri"
MONO = "Consolas"

SURFACE  = LIGHT
INK      = NAVY
BG       = WHITE
SYNT_BG  = RGBColor(0x06, 0x08, 0x0D)
SYNT_BG2 = RGBColor(0x0B, 0x0E, 0x17)

LOGO_PATH = "/Users/jjayaraj/workspaces/studios/epicenter/docs/assets/syntegreti-logo-white.png"

prs = Presentation()
prs.slide_width  = Inches(13.333)
prs.slide_height = Inches(7.5)
SW, SH = prs.slide_width, prs.slide_height
BLANK = prs.slide_layouts[6]


# ---- Helpers -------------------------------------------------------------
def add_rect(slide, x, y, w, h, fill, line=None, shape=MSO_SHAPE.RECTANGLE):
    shp = slide.shapes.add_shape(shape, x, y, w, h)
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
                bullet_color=None, line_spacing=1.25, marker="▸"):
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
        r0 = p.add_run()
        r0.text = f"{marker}  "
        r0.font.name = FONT
        r0.font.size = Pt(size)
        r0.font.bold = True
        r0.font.color.rgb = bullet_color
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


def add_header(slide, eyebrow, title):
    add_rect(slide, 0, 0, SW, Inches(0.18), ACCENT)
    add_text(slide, Inches(0.6), Inches(0.32), Inches(8), Inches(0.35),
             eyebrow.upper(), size=11, bold=True, color=GREY)
    add_text(slide, Inches(0.6), Inches(0.55), Inches(12.2), Inches(0.7),
             title, size=30, bold=True, color=NAVY)
    add_rect(slide, Inches(0.6), Inches(1.25), Inches(0.6), Emu(38100), ACCENT)


def add_footer(slide, page):
    add_text(slide, Inches(0.6), Inches(7.1), Inches(10), Inches(0.3),
             "Throughline  ·  Recruitment OS for GCCs  ·  Syntegreti  ·  v0.2",
             size=9, color=GREY)
    add_text(slide, Inches(11.5), Inches(7.1), Inches(1.3), Inches(0.3),
             str(page), size=9, color=GREY, align=PP_ALIGN.RIGHT)


def chip(slide, x, y, text, *, color=ACCENT, fg=WHITE, w=None, h=None,
         size=12):
    w = w or Inches(2.0)
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
    r.font.size = Pt(size)
    r.font.bold = True
    r.font.color.rgb = fg
    return shp


def metric_card(slide, x, y, w, h, big, label, *, color=ACCENT):
    add_rect(slide, x, y, w, h, LIGHT)
    add_rect(slide, x, y, Inches(0.1), h, color)
    add_text(slide, x + Inches(0.25), y + Inches(0.2),
             w - Inches(0.3), Inches(1.0),
             big, size=44, bold=True, color=NAVY)
    add_text(slide, x + Inches(0.25), y + Inches(1.15),
             w - Inches(0.3), Inches(0.5),
             label, size=12, color=GREY)


def feature_row(slide, y, label, body, *, color=ACCENT, size=12):
    add_rect(slide, Inches(0.6), y, Inches(0.12), Inches(0.7), color)
    add_text(slide, Inches(0.85), y, Inches(3.4), Inches(0.35),
             label, size=14, bold=True, color=NAVY)
    add_text(slide, Inches(4.3), y, Inches(8.5), Inches(0.7),
             body, size=size, color=TEXT)


# ---- 1. Cover (Syntegreti dark hero) -------------------------------------
def slide_cover():
    s = prs.slides.add_slide(BLANK)
    add_rect(s, 0, 0, SW, SH, SYNT_BG)
    add_rect(s, 0, 0, Inches(0.45), SH, ACCENT)

    # Real Syntegreti logo, top-right
    s.shapes.add_picture(LOGO_PATH, Inches(10.4), Inches(0.5),
                         Inches(2.4), Inches(0.96))
    # Brand-colour decorative stripes
    add_rect(s, Inches(11.5), Inches(1.65), Inches(1.4), Inches(0.10), ACCENT)
    add_rect(s, Inches(11.5), Inches(1.83), Inches(1.0), Inches(0.10), TEAL)
    add_rect(s, Inches(11.5), Inches(2.01), Inches(0.6), Inches(0.10), AMBER)

    add_text(s, Inches(0.9), Inches(2.45), Inches(11), Inches(0.5),
             "FOR GLOBAL CAPABILITY CENTERS  ·  v0.2", size=13, bold=True,
             color=ACCENT)
    add_text(s, Inches(0.9), Inches(2.85), Inches(11), Inches(1.4),
             "Throughline", size=66, bold=True, color=WHITE)
    add_text(s, Inches(0.9), Inches(4.25), Inches(11.5), Inches(0.7),
             "The Recruitment Operating System for high-volume,",
             size=22, color=WHITE)
    add_text(s, Inches(0.9), Inches(4.65), Inches(11.5), Inches(0.7),
             "multi-vendor enterprise hiring",
             size=22, color=WHITE)
    add_text(s, Inches(0.9), Inches(5.55), Inches(11), Inches(0.5),
             "Partners  ·  Hiring  ·  Candidates  —  one platform, end to end",
             size=14, color=GREY2)

    add_rect(s, 0, Inches(6.9), SW, Inches(0.6), SYNT_BG2)
    add_text(s, Inches(0.9), Inches(7.0), Inches(8.5), Inches(0.4),
             "Built for the way GCCs actually hire — multi-vendor, multi-role, audit-ready",
             size=12, color=GREY2)
    add_text(s, Inches(9.5), Inches(7.0), Inches(3.3), Inches(0.4),
             "a Syntegreti product", size=10, color=GREY,
             align=PP_ALIGN.RIGHT)


# ---- 2. The GCC Hiring Reality ------------------------------------------
def slide_problem():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "The Problem", "The GCC Hiring Reality")

    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "GCCs hire at scale across a fragmented vendor ecosystem — "
             "and pay the price in speed, cost and quality.",
             size=15, color=GREY)

    pains = [
        ("Fragmented stack",
         "ATS, vendor portals, spreadsheets and email do half the job each — nothing tells the full story."),
        ("Vendor sprawl",
         "Dozens of partners, each with different SLAs, rate cards and contact matrices — no single source of truth."),
        ("Slow time-to-hire",
         "HRQs sit unallocated, slots go unbooked, candidates drop off — every day of delay is a competing offer."),
        ("Weak governance",
         "No reliable audit trail of who approved what, when — painful at compliance / internal audit time."),
        ("Limited visibility",
         "Leadership has no live view of pipeline health, vendor performance or panel utilisation."),
        ("Onboarding gaps",
         "BGV, asset allocation and training tracked in disconnected sheets — joiners slip through the cracks."),
    ]
    # 2x3 grid
    cols = 3
    cw = Inches(4.05)
    ch = Inches(2.2)
    gap = Inches(0.1)
    sx = Inches(0.6)
    sy = Inches(2.25)
    for i, (label, body) in enumerate(pains):
        r, c = divmod(i, cols)
        x = sx + (cw + gap) * c
        y = sy + (ch + gap) * r
        add_rect(s, x, y, cw, ch, LIGHT)
        add_rect(s, x, y, cw, Inches(0.07), ACCENT)
        add_text(s, x + Inches(0.25), y + Inches(0.2),
                 cw - Inches(0.3), Inches(0.4),
                 label, size=15, bold=True, color=NAVY)
        add_text(s, x + Inches(0.25), y + Inches(0.7),
                 cw - Inches(0.4), ch - Inches(0.8),
                 body, size=12, color=TEXT)
    add_footer(s, 2)


# ---- 3. Introducing Throughline -----------------------------------------
def slide_intro():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "The Solution", "Introducing Throughline")

    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "One platform that runs your entire recruitment operation.",
             size=16, color=GREY)

    # Three pillars
    cards = [
        ("Partner Management",
         "PMS",
         "Onboard, score and govern your full vendor network with empanelment, "
         "engagements, SOWs, rate cards and escalation matrices.",
         NAVY),
        ("Hiring Management",
         "HMS",
         "From requisition to offer — HRQs, panels, calibration, interview slots, "
         "structured feedback, automated re-routing and SLAs.",
         TEAL),
        ("Candidate Lifecycle",
         "CMS",
         "Cart / Bin pipelines, BGV tracking, training, asset allocation and "
         "post-joining profile tracker — all on one record.",
         ACCENT),
    ]
    cw = Inches(4.05)
    gap = Inches(0.1)
    sx = Inches(0.6)
    y  = Inches(2.3)

    for i, (title, tag, body, color) in enumerate(cards):
        x = sx + (cw + gap) * i
        add_rect(s, x, y, cw, Inches(3.7), LIGHT)
        add_rect(s, x, y, cw, Inches(0.7), color)
        add_text(s, x + Inches(0.25), y + Inches(0.07),
                 cw - Inches(0.3), Inches(0.4),
                 tag, size=13, bold=True, color=WHITE)
        add_text(s, x + Inches(0.25), y + Inches(0.32),
                 cw - Inches(0.3), Inches(0.4),
                 title, size=18, bold=True, color=WHITE)
        add_text(s, x + Inches(0.25), y + Inches(0.95),
                 cw - Inches(0.4), Inches(2.6),
                 body, size=13, color=TEXT)

    add_text(s, Inches(0.6), Inches(6.4), Inches(12), Inches(0.5),
             "One login. One pipeline. One audit trail.",
             size=14, bold=True, color=ACCENT)
    add_footer(s, 3)


# ---- 4. Who it's for -----------------------------------------------------
def slide_personas():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Audience", "Built for Every Role in the Hiring Chain")

    personas = [
        ("TA / Hiring Leadership",
         "Live KPIs across vendors, requisitions, conversion and TAT — "
         "make budget and capacity calls with real numbers."),
        ("RM Owner / Vendor Manager",
         "Allocate HRQs, accept or reject within SLA, govern partners, "
         "approve SOWs, manage escalations."),
        ("Hiring Manager",
         "Raise requisitions, review shortlists, approve panels, "
         "watch the pipeline for their own openings."),
        ("Recruitment Partner / Vendor",
         "Self-serve portal — see assigned HRQs, submit candidates, "
         "book interview slots, track conversion."),
        ("Interview Panel",
         "Get scheduled invites, give structured feedback, "
         "participate in calibration sessions."),
        ("Onboarding SPOC",
         "Drive BGV, training, asset allocation and joining-date "
         "rescheduling on a single candidate record."),
    ]
    cw = Inches(6.05)
    ch = Inches(1.6)
    gap = Inches(0.15)
    sx = [Inches(0.6), Inches(6.8)]
    for i, (label, body) in enumerate(personas):
        col = i % 2
        row = i // 2
        x = sx[col]
        y = Inches(1.55) + (ch + gap) * row
        add_rect(s, x, y, cw, ch, LIGHT)
        add_rect(s, x, y, Inches(0.1), ch, ACCENT if col == 0 else TEAL)
        add_text(s, x + Inches(0.25), y + Inches(0.15),
                 cw - Inches(0.3), Inches(0.4),
                 label, size=14, bold=True, color=NAVY)
        add_text(s, x + Inches(0.25), y + Inches(0.6),
                 cw - Inches(0.4), ch - Inches(0.7),
                 body, size=12, color=TEXT)
    add_footer(s, 4)


# ---- 5. Business outcomes ------------------------------------------------
def slide_outcomes():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Value", "Business Outcomes Throughline Drives")

    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "Indicative impact based on workflows the platform automates today. "
             "Final benchmarks are calibrated to your baseline.",
             size=12, color=GREY)

    cw = Inches(2.95)
    gap = Inches(0.15)
    sx = Inches(0.6)
    y  = Inches(2.25)
    cards = [
        ("30–40%", "Faster time-to-hire",        ACCENT),
        ("3×",     "Vendor visibility & control", TEAL),
        ("100%",   "Auditable approval trail",   NAVY),
        ("1",      "Single platform for HMS · PMS · CMS", GREEN),
    ]
    for i, (big, label, color) in enumerate(cards):
        x = sx + (cw + gap) * i
        metric_card(s, x, y, cw, Inches(2.0), big, label, color=color)

    # "What gets better" list
    add_text(s, Inches(0.6), Inches(4.7), Inches(12), Inches(0.4),
             "What measurably improves", size=14, bold=True, color=NAVY)
    add_bullets(s, Inches(0.6), Inches(5.1), Inches(12.1), Inches(2.0), [
        ("Vendor performance",  "leaderboards by submission, conversion, joiner ratio."),
        ("HRQ aging",          "auto-reassignment when an RM Owner sits on a requisition."),
        ("Slot utilisation",    "auto-expiry of unbooked slots, reducing dead capacity."),
        ("Compliance posture", "every state change recorded — BGV, joining, asset allocation."),
    ], size=13, line_spacing=1.3)
    add_footer(s, 5)


# ---- 6. PMS pillar -------------------------------------------------------
def slide_pms():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Pillar 1 — PMS", "Partner / Vendor Management")

    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "Run your vendor network like a portfolio.",
             size=15, color=GREY)

    feats = [
        ("Onboarding",
         "Structured partner profiles, contact matrix and category / tier mapping."),
        ("Empanelment",
         "Evaluation period, approval workflow and renewal — with full approval history."),
        ("Engagements & SOWs",
         "SOWs, change requests, rate cards and PO details — versioned."),
        ("Escalation matrix",
         "Codified escalation paths so issues never get stuck in one inbox."),
        ("Auto-deactivation",
         "Inactive partners (no submissions in 30 days) flagged automatically."),
        ("Performance",
         "Submission rate, conversion rate, joiner-to-offer ratio per partner."),
    ]
    y = Inches(2.2)
    for label, body in feats:
        feature_row(s, y, label, body, color=NAVY, size=12)
        y += Inches(0.78)
    add_footer(s, 6)


# ---- 7. HMS pillar -------------------------------------------------------
def slide_hms():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Pillar 2 — HMS", "Hiring Management")

    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "Move requisitions from approval to offer with structure and SLAs.",
             size=15, color=GREY)

    feats = [
        ("Requisitions (HRQs)",
         "Capture role, level, domain, location, panel — route through BET approval."),
        ("Auto-allocation",
         "RM Owner receives HRQs; if not actioned within SLA, system reassigns."),
        ("Interview rounds",
         "Configurable rounds per role / domain with criteria and weights."),
        ("Panels",
         "Maintain panel rosters, history and availability per round."),
        ("Calibration",
         "Calibration sessions to keep feedback consistent across panels."),
        ("Slot management",
         "Vendors book against open slots; system expires stale slots automatically."),
    ]
    y = Inches(2.2)
    for label, body in feats:
        feature_row(s, y, label, body, color=TEAL, size=12)
        y += Inches(0.78)
    add_footer(s, 7)


# ---- 8. CMS pillar -------------------------------------------------------
def slide_cms():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Pillar 3 — CMS", "Candidate Lifecycle")

    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "One record from first submission to 90-day post-joining.",
             size=15, color=GREY)

    feats = [
        ("Cart / Bin pipeline",
         "Approved candidates flow to cart; flagged candidates land in bin for review."),
        ("Resume parsing",
         "DOCX and PDF parsed in-browser — no extra upload step."),
        ("Background verification",
         "BGV status, vendor and dates tracked on the candidate record."),
        ("Personal details",
         "Address, family, diversity and document upload in one place."),
        ("Asset allocation",
         "Laptop, phone, ID card — issued and tracked against the joiner."),
        ("Training & profile tracker",
         "Onboarding training records and 30/60/90-day profile progress."),
        ("Joining reschedule",
         "Joining-date changes captured with reason and full history."),
    ]
    y = Inches(2.2)
    for label, body in feats:
        feature_row(s, y, label, body, color=ACCENT, size=12)
        y += Inches(0.66)
    add_footer(s, 8)


# ---- 9. End-to-end workflow ---------------------------------------------
def slide_workflow():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Workflow", "End-to-End — Requisition to Day-90")

    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "Eight stages. One platform. Zero context switches.",
             size=14, color=GREY)

    steps = [
        ("Raise HRQ",            "Hiring Mgr"),
        ("BET Approval",         "BET Approver"),
        ("RM Owner Accept",      "RM Owner"),
        ("Vendor Allocation",    "Partner"),
        ("Slot & Interview",     "Panel"),
        ("Feedback & Offer",     "Hiring Mgr"),
        ("BGV & Onboarding",     "SPOC"),
        ("Day-30/60/90 Tracker", "TA Lead"),
    ]
    box_w = Inches(1.4)
    box_h = Inches(1.4)
    gap   = Inches(0.135)
    total = box_w * len(steps) + gap * (len(steps) - 1)
    sx    = (SW - total) / 2
    sy    = Inches(2.5)
    colors = [NAVY, NAVY, TEAL, TEAL, TEAL, ACCENT, ACCENT, GREEN]

    for i, (title, role) in enumerate(steps):
        x = sx + (box_w + gap) * i
        # Step circle (rounded)
        add_rect(s, x, sy, box_w, box_h, colors[i],
                 shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        add_text(s, x, sy + Inches(0.15), box_w, Inches(0.4),
                 str(i + 1), size=18, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER)
        add_text(s, x, sy + Inches(0.55), box_w, Inches(0.5),
                 title, size=11, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER)
        add_text(s, x, sy + Inches(0.95), box_w, Inches(0.4),
                 role, size=9, color=WHITE,
                 align=PP_ALIGN.CENTER)
        # Arrow connector to next
        if i < len(steps) - 1:
            ax = x + box_w
            ay = sy + box_h / 2
            arrow = s.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW,
                                        ax, ay - Inches(0.08),
                                        gap, Inches(0.16))
            arrow.fill.solid()
            arrow.fill.fore_color.rgb = GREY2
            arrow.line.fill.background()
            arrow.shadow.inherit = False

    # Lane labels under
    add_text(s, Inches(0.6), Inches(4.6), Inches(12), Inches(0.4),
             "Automated cross-cutting actions", size=14, bold=True, color=NAVY)
    add_bullets(s, Inches(0.6), Inches(5.0), Inches(12.1), Inches(2.0), [
        ("Hourly", "expire stale slots, drop candidates after 3 rejections, refresh slot counts."),
        ("Daily",  "reassign aged HRQs, reject stale on-hold candidates, deactivate inactive partners, trigger escalations."),
        ("Always", "audit log of every state change · email notifications · role-based dashboards."),
    ], size=13, line_spacing=1.3)
    add_footer(s, 9)


# ---- 10. Dashboards ------------------------------------------------------
def slide_dashboards():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Visibility", "Real-time Dashboards & Analytics")

    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "Every role sees the data that matters to them — live, no exports.",
             size=14, color=GREY)

    # Mock dashboard — KPI tiles
    tiles = [
        ("Active Partners",   "47",  TEAL),
        ("Active HRQs",       "128", NAVY),
        ("Candidates in Pipeline", "612", ACCENT),
        ("Unassigned HRQs",   "9",   GREEN),
    ]
    cw = Inches(2.95)
    gap = Inches(0.15)
    sx = Inches(0.6)
    y  = Inches(2.2)
    for i, (label, value, color) in enumerate(tiles):
        x = sx + (cw + gap) * i
        add_rect(s, x, y, cw, Inches(1.4), LIGHT)
        add_rect(s, x, y, Inches(0.1), Inches(1.4), color)
        add_text(s, x + Inches(0.25), y + Inches(0.15),
                 cw - Inches(0.3), Inches(0.5),
                 value, size=32, bold=True, color=NAVY)
        add_text(s, x + Inches(0.25), y + Inches(0.85),
                 cw - Inches(0.3), Inches(0.4),
                 label, size=12, color=GREY)

    # Charts area (illustrative blocks)
    cy = Inches(3.85)
    # Submission trend "bars"
    add_rect(s, Inches(0.6), cy, Inches(6.0), Inches(2.7), LIGHT)
    add_text(s, Inches(0.8), cy + Inches(0.15), Inches(5.6), Inches(0.4),
             "Weekly Submissions", size=13, bold=True, color=NAVY)
    bar_x = Inches(0.85)
    bar_y_base = cy + Inches(2.4)
    bar_w = Inches(0.55)
    heights = [0.7, 1.1, 0.9, 1.4, 1.6, 1.2, 1.8]
    for i, h in enumerate(heights):
        bx = bar_x + (bar_w + Inches(0.2)) * i
        bh = Inches(h)
        add_rect(s, bx, bar_y_base - bh, bar_w, bh, ACCENT)

    # Candidate Stage Mix — stacked bar with proportional segments
    add_rect(s, Inches(6.85), cy, Inches(5.85), Inches(2.7), LIGHT)
    add_text(s, Inches(7.05), cy + Inches(0.15), Inches(5.5), Inches(0.4),
             "Candidate Stage Mix", size=13, bold=True, color=NAVY)
    seg_x = Inches(7.1)
    seg_y = cy + Inches(0.85)
    seg_w = Inches(5.4)
    seg_h = Inches(0.55)
    segments = [("Sourced",      TEAL,   0.45),
                ("In Interview", ACCENT, 0.30),
                ("Offered",      NAVY,   0.15),
                ("Joined",       GREEN,  0.10)]
    cx = seg_x
    for label, color, frac in segments:
        sw = int(seg_w * frac)
        seg_rect = add_rect(s, cx, seg_y, sw, seg_h, color)
        # Label inside segment when wide enough
        if frac >= 0.20:
            add_text(s, cx, seg_y, sw, seg_h,
                     f"{int(frac * 100)}%", size=12, bold=True,
                     color=WHITE, align=PP_ALIGN.CENTER,
                     anchor=MSO_ANCHOR.MIDDLE)
        cx += sw
    # Legend row below the bar
    ly = seg_y + seg_h + Inches(0.45)
    lx = seg_x
    for label, color, _ in segments:
        add_rect(s, lx, ly + Inches(0.04),
                 Inches(0.22), Inches(0.22), color)
        add_text(s, lx + Inches(0.3), ly, Inches(1.4), Inches(0.35),
                 label, size=11, color=TEXT)
        lx += Inches(1.35)
    add_footer(s, 10)


# ---- 11. Interview Ops ---------------------------------------------------
def slide_interview_ops():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Operations", "Interview Operations at Scale")

    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "The hardest part of GCC hiring is interview logistics. Throughline automates it.",
             size=14, color=GREY)

    feats = [
        ("Slot pools",
         "Panels publish slots; vendors book against them; double-booking is impossible."),
        ("Auto-expiry",
         "Unbooked slots expire after a configurable validity window — capacity isn't lost."),
        ("Round configuration",
         "Different rounds per role / domain with weighted criteria."),
        ("Structured feedback",
         "Feedback templates per round; aggregated automatically into a hire / no-hire view."),
        ("Calibration sessions",
         "Run calibration so different panels score the same candidate consistently."),
        ("Panel history",
         "Full record of who interviewed whom — useful for re-interviews and audits."),
    ]
    y = Inches(2.2)
    for label, body in feats:
        feature_row(s, y, label, body, color=TEAL, size=12)
        y += Inches(0.78)
    add_footer(s, 11)


# ---- 12. Onboarding ------------------------------------------------------
def slide_onboarding():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Operations", "Onboarding & Post-Joining")

    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "Day 0 to Day 90 — every joiner ends on the right side of compliance.",
             size=14, color=GREY)

    feats = [
        ("Background verification",
         "BGV vendor, status, dates and result tracked per candidate."),
        ("Personal & document details",
         "Address, family, diversity data, ID documents — uploaded once."),
        ("Asset allocation",
         "Laptop, phone, access cards issued and tracked."),
        ("Training records",
         "Onboarding sessions attended; gaps flagged automatically."),
        ("Profile tracker",
         "30 / 60 / 90-day post-joining progress with reminders."),
        ("Joining reschedule history",
         "Every change captured with reason — answers 'why did this offer slip?'"),
    ]
    y = Inches(2.2)
    for label, body in feats:
        feature_row(s, y, label, body, color=ACCENT, size=12)
        y += Inches(0.78)
    add_footer(s, 12)


# ---- 13. Governance ------------------------------------------------------
def slide_governance():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Trust", "Governance · Audit · Compliance")

    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "Audit-ready by design — not a feature you switch on.",
             size=15, color=GREY)

    cards = [
        ("Full audit trail",
         "Every state change — candidate, engagement, panel, bin, PO, joining — "
         "is recorded with who, when and why."),
        ("Granular RBAC",
         "Permission matrix at module × form level. Different roles, "
         "same screens, different powers."),
        ("Approval workflows",
         "BET approval, RM Owner accept, partner empanelment — "
         "each step gated and logged."),
        ("Configurable masters",
         "Domains, skills, locations, levels, status codes — configurable "
         "without code changes."),
    ]
    cw = Inches(6.05)
    ch = Inches(2.4)
    gap = Inches(0.15)
    sx = [Inches(0.6), Inches(6.8)]
    for i, (label, body) in enumerate(cards):
        col = i % 2
        row = i // 2
        x = sx[col]
        y = Inches(2.2) + (ch + gap) * row
        add_rect(s, x, y, cw, ch, LIGHT)
        add_rect(s, x, y, cw, Inches(0.07), NAVY)
        add_text(s, x + Inches(0.25), y + Inches(0.2),
                 cw - Inches(0.3), Inches(0.5),
                 label, size=16, bold=True, color=NAVY)
        add_text(s, x + Inches(0.25), y + Inches(0.8),
                 cw - Inches(0.4), ch - Inches(0.9),
                 body, size=13, color=TEXT)
    add_footer(s, 13)


# ---- 14. Security & Enterprise readiness --------------------------------
def slide_security():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Trust", "Security & Enterprise Readiness")

    items = [
        ("Single Sign-On",
         "SAML 2.0 (Okta), Azure AD and JWT — fits your existing identity stack."),
        ("Role-based access",
         "Permission matrix in the database; UI mirrors the same flags."),
        ("Cloud-native",
         "Runs on Azure — SQL Database, Blob Storage, Functions, App Service."),
        ("Containerised",
         "Multi-stage Docker image; deployable on any container host."),
        ("Observability",
         "Structured logging with daily rolling files; per-request timing."),
        ("Email delegation",
         "Outbound email through a serverless function — no SMTP credentials in app."),
        ("Open API",
         "Swagger / OpenAPI auto-published — easy to integrate with HRMS, BI, etc."),
        ("Data residency",
         "Stays in your Azure tenant — your data, your geography."),
    ]
    cw = Inches(6.05)
    ch = Inches(0.95)
    gap = Inches(0.12)
    sx = [Inches(0.6), Inches(6.8)]
    for i, (label, body) in enumerate(items):
        col = i % 2
        row = i // 2
        x = sx[col]
        y = Inches(1.6) + (ch + gap) * row
        add_rect(s, x, y, cw, ch, LIGHT)
        add_rect(s, x, y, Inches(0.08), ch, ACCENT if col == 0 else TEAL)
        add_text(s, x + Inches(0.2), y + Inches(0.1),
                 cw - Inches(0.25), Inches(0.4),
                 label, size=13, bold=True, color=NAVY)
        add_text(s, x + Inches(0.2), y + Inches(0.45),
                 cw - Inches(0.3), ch - Inches(0.5),
                 body, size=11, color=TEXT)
    add_footer(s, 14)


# ---- 15. Why Throughline for a GCC --------------------------------------
def slide_why_gcc():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Differentiators", "Why Throughline for a GCC")

    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "Not a generic ATS. Built around the realities of captive-centre hiring.",
             size=15, color=GREY)

    items = [
        ("Multi-vendor first",
         "Empanelment, engagement, SOWs and escalation matrices are first-class — not bolt-ons."),
        ("Workflow-driven",
         "BET approval, RM Owner ownership, calibration and escalations match how GCCs already operate."),
        ("Audit-ready",
         "Every change recorded — built for organisations that will be audited."),
        ("Lifecycle, not just sourcing",
         "Continues past offer into BGV, training, assets and 90-day tracking."),
        ("Configurable",
         "Masters, roles, slot rules, escalation paths — change without code."),
        ("Cloud-native, integrate-ready",
         "Azure-native, OpenAPI-published — drops into your stack."),
    ]
    cw = Inches(6.05)
    ch = Inches(1.4)
    gap = Inches(0.15)
    sx = [Inches(0.6), Inches(6.8)]
    for i, (label, body) in enumerate(items):
        col = i % 2
        row = i // 2
        x = sx[col]
        y = Inches(2.2) + (ch + gap) * row
        add_rect(s, x, y, cw, ch, LIGHT)
        add_rect(s, x, y, Inches(0.1), ch, ACCENT if i % 2 == 0 else NAVY)
        add_text(s, x + Inches(0.25), y + Inches(0.15),
                 cw - Inches(0.3), Inches(0.4),
                 label, size=14, bold=True, color=NAVY)
        add_text(s, x + Inches(0.25), y + Inches(0.6),
                 cw - Inches(0.4), ch - Inches(0.7),
                 body, size=12, color=TEXT)
    add_footer(s, 15)


# ---- 16. Implementation -------------------------------------------------
def slide_implementation():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Adoption", "Implementation & Go-Live")

    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "A typical GCC rollout. Tunable to your scale and integrations.",
             size=14, color=GREY)

    phases = [
        ("Week 1–2", "Discovery",
         "Vendor list · approval matrix · masters · SLAs · integration map."),
        ("Week 3–4", "Configure",
         "Roles · permission matrix · escalation rules · email templates · slot rules."),
        ("Week 5–6", "Pilot",
         "1–2 domains live with a subset of vendors and a real HRQ funnel."),
        ("Week 7–8", "Roll-out",
         "Open to all domains and vendors · full reporting · onboarding flows."),
        ("Ongoing", "Run & Improve",
         "Vendor scorecards · TAT tuning · new dashboards · integrations."),
    ]
    cw = Inches(2.45)
    gap = Inches(0.12)
    sx = Inches(0.6)
    y  = Inches(2.3)
    colors = [NAVY, NAVY, TEAL, ACCENT, GREEN]
    for i, (when, what, body) in enumerate(phases):
        x = sx + (cw + gap) * i
        add_rect(s, x, y, cw, Inches(4.0), LIGHT)
        add_rect(s, x, y, cw, Inches(0.65), colors[i])
        add_text(s, x + Inches(0.2), y + Inches(0.05),
                 cw - Inches(0.3), Inches(0.35),
                 when, size=11, bold=True, color=WHITE)
        add_text(s, x + Inches(0.2), y + Inches(0.3),
                 cw - Inches(0.3), Inches(0.4),
                 what, size=15, bold=True, color=WHITE)
        add_text(s, x + Inches(0.2), y + Inches(0.85),
                 cw - Inches(0.3), Inches(3.0),
                 body, size=12, color=TEXT)
    add_footer(s, 16)


# ---- 17. Engagement model / CTA -----------------------------------------
def slide_cta():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Next Step", "Let's Run a Pilot")

    add_text(s, Inches(0.6), Inches(1.55), Inches(12), Inches(0.5),
             "We learn your data. You see the platform on it. Decision in 6 weeks.",
             size=15, color=GREY)

    steps = [
        ("1", "30-min discovery",
         "Walk through your current vendor list, approval matrix and pain points."),
        ("2", "Tailored demo",
         "Show Throughline on a sandbox configured to look like your environment."),
        ("3", "6-week pilot",
         "Two domains, ten vendors, real HRQs — measure TAT and conversion uplift."),
        ("4", "Roll-out plan",
         "Pricing, integration plan and rollout calendar built off pilot results."),
    ]
    cw = Inches(2.95)
    gap = Inches(0.15)
    sx = Inches(0.6)
    y  = Inches(2.4)
    for i, (n, title, body) in enumerate(steps):
        x = sx + (cw + gap) * i
        add_rect(s, x, y, cw, Inches(3.4), LIGHT)
        add_rect(s, x, y, cw, Inches(0.75), NAVY)
        add_text(s, x + Inches(0.25), y + Inches(0.08),
                 Inches(0.6), Inches(0.55),
                 n, size=24, bold=True, color=ACCENT)
        add_text(s, x + Inches(0.85), y + Inches(0.18),
                 cw - Inches(1.0), Inches(0.5),
                 title, size=14, bold=True, color=WHITE)
        add_text(s, x + Inches(0.25), y + Inches(0.95),
                 cw - Inches(0.4), Inches(2.4),
                 body, size=13, color=TEXT)

    # CTA strip
    add_rect(s, Inches(0.6), Inches(6.2), Inches(12.1), Inches(0.7), ACCENT)
    add_text(s, Inches(0.85), Inches(6.32), Inches(12), Inches(0.5),
             "Ready to start the conversation?  Let's set up a 30-min discovery this week.",
             size=15, bold=True, color=WHITE)
    add_footer(s, 17)


# ---- 18. Closing (Syntegreti dark) ---------------------------------------
def slide_close():
    s = prs.slides.add_slide(BLANK)
    add_rect(s, 0, 0, SW, SH, SYNT_BG)
    add_rect(s, 0, 0, Inches(0.45), SH, ACCENT)

    s.shapes.add_picture(LOGO_PATH, Inches(10.4), Inches(0.5),
                         Inches(2.4), Inches(0.96))

    add_text(s, Inches(0.9), Inches(2.4), Inches(11), Inches(1.2),
             "Thank you", size=72, bold=True, color=WHITE)
    add_text(s, Inches(0.9), Inches(3.7), Inches(11), Inches(0.6),
             "Throughline — built for the way GCCs actually hire.",
             size=22, color=ACCENT)
    add_text(s, Inches(0.9), Inches(5.0), Inches(11), Inches(0.4),
             "CONTACT", size=12, bold=True, color=ACCENT)
    add_bullets(s, Inches(0.9), Inches(5.4), Inches(12), Inches(1.6), [
        "Set up a 30-minute discovery call",
        "Request a tailored demo on your vendor list",
        "Scope a 6-week pilot with measurable TAT goals",
    ], size=14, color=WHITE, bullet_color=ACCENT, line_spacing=1.4)

    add_rect(s, 0, Inches(6.9), SW, Inches(0.6), SYNT_BG2)
    add_text(s, Inches(0.9), Inches(7.0), Inches(11), Inches(0.4),
             "Throughline  ·  a Syntegreti product",
             size=11, color=GREY2)
    add_text(s, Inches(10.0), Inches(7.0), Inches(2.8), Inches(0.4),
             "v0.2", size=10, color=GREY, align=PP_ALIGN.RIGHT)


# ---- Build ---------------------------------------------------------------
slide_cover()
slide_problem()
slide_intro()
slide_personas()
slide_outcomes()
slide_pms()
slide_hms()
slide_cms()
slide_workflow()
slide_dashboards()
slide_interview_ops()
slide_onboarding()
slide_governance()
slide_security()
slide_why_gcc()
slide_implementation()
slide_cta()
slide_close()

out = "/Users/jjayaraj/workspaces/studios/epicenter/docs/Throughline-Business-Pitch-v0.2.pptx"
prs.save(out)
print("Saved:", out)
