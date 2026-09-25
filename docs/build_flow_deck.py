"""Build the Throughline Process Flow Diagrams deck (PPTX). Syntegreti · v0.2

Each slide is one diagram. Boxes carry ≤3-word labels; the explanation lives
in a small caption strip at the bottom of the slide so the diagram stays the
hero.
"""
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR

# ---- Theme — Syntegreti palette -----------------------------------------
NAVY      = RGBColor(0x06, 0x08, 0x0D)   # Syntegreti dark / ink
NAVY_DARK = RGBColor(0x00, 0x00, 0x00)
ACCENT    = RGBColor(0x00, 0xE8, 0x7B)   # Syntegreti neon green
TEAL      = RGBColor(0x00, 0xD4, 0xFF)   # Syntegreti cyan
AMBER     = RGBColor(0xFF, 0xB8, 0x00)
GREEN     = RGBColor(0x2E, 0x8B, 0x57)   # forest green for status states
RED       = RGBColor(0xC0, 0x39, 0x2B)
LIGHT     = RGBColor(0xF4, 0xF5, 0xF9)
BORDER    = RGBColor(0xD0, 0xD7, 0xE2)
GREY      = RGBColor(0x7A, 0x84, 0xA0)
GREY2     = RGBColor(0xB0, 0xB8, 0xCD)
TEXT      = RGBColor(0x06, 0x08, 0x0D)
WHITE     = RGBColor(0xFF, 0xFF, 0xFF)

FONT = "Calibri"

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


# ---- Primitives ----------------------------------------------------------
def add_rect(slide, x, y, w, h, fill, *, line=None, shape=MSO_SHAPE.RECTANGLE,
             line_w=None):
    shp = slide.shapes.add_shape(shape, x, y, w, h)
    shp.fill.solid()
    shp.fill.fore_color.rgb = fill
    if line is None:
        shp.line.fill.background()
    else:
        shp.line.color.rgb = line
        if line_w is not None:
            shp.line.width = line_w
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


def text_in_shape(shape, text, *, size=12, bold=True, color=WHITE,
                  align=PP_ALIGN.CENTER):
    tf = shape.text_frame
    tf.margin_left = Inches(0.05)
    tf.margin_right = Inches(0.05)
    tf.margin_top = Inches(0.04)
    tf.margin_bottom = Inches(0.04)
    tf.vertical_anchor = MSO_ANCHOR.MIDDLE
    tf.word_wrap = True
    lines = text.split("\n")
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        r = p.add_run()
        r.text = line
        r.font.name = FONT
        r.font.size = Pt(size if i == 0 else size - 2)
        r.font.bold = bold if i == 0 else False
        r.font.color.rgb = color


def stage(slide, x, y, w, h, label, *, color=NAVY, sub=None,
          shape=MSO_SHAPE.ROUNDED_RECTANGLE):
    shp = add_rect(slide, x, y, w, h, color, shape=shape)
    if sub:
        text_in_shape(shp, f"{label}\n{sub}", size=14, color=WHITE)
    else:
        text_in_shape(shp, label, size=14, color=WHITE)
    return shp


def diamond(slide, x, y, w, h, label, *, color=ACCENT):
    shp = add_rect(slide, x, y, w, h, color, shape=MSO_SHAPE.DIAMOND)
    text_in_shape(shp, label, size=11, color=WHITE)
    return shp


def pill(slide, x, y, w, h, label, *, color=GREEN):
    shp = add_rect(slide, x, y, w, h, color, shape=MSO_SHAPE.ROUNDED_RECTANGLE)
    text_in_shape(shp, label, size=12, color=WHITE)
    return shp


def arrow_right(slide, x, y, w, *, color=GREY2, h=None):
    h = h or Inches(0.18)
    arr = slide.shapes.add_shape(MSO_SHAPE.RIGHT_ARROW, x, y - h / 2, w, h)
    arr.fill.solid()
    arr.fill.fore_color.rgb = color
    arr.line.fill.background()
    arr.shadow.inherit = False
    return arr


def arrow_left(slide, x, y, w, *, color=GREY2, h=None):
    h = h or Inches(0.18)
    arr = slide.shapes.add_shape(MSO_SHAPE.LEFT_ARROW, x, y - h / 2, w, h)
    arr.fill.solid()
    arr.fill.fore_color.rgb = color
    arr.line.fill.background()
    arr.shadow.inherit = False
    return arr


def arrow_down(slide, x, y, h, *, color=GREY2, w=None):
    w = w or Inches(0.18)
    arr = slide.shapes.add_shape(MSO_SHAPE.DOWN_ARROW, x - w / 2, y, w, h)
    arr.fill.solid()
    arr.fill.fore_color.rgb = color
    arr.line.fill.background()
    arr.shadow.inherit = False
    return arr


def line_connector(slide, x1, y1, x2, y2, *, color=GREY2, weight=Pt(1.5),
                   dashed=False):
    conn = slide.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, x1, y1, x2, y2)
    conn.line.color.rgb = color
    conn.line.width = weight
    if dashed:
        # set dash via XML
        from pptx.oxml.ns import qn
        ln = conn.line._get_or_add_ln()
        prstDash = ln.makeelement(qn('a:prstDash'),
                                  {'val': 'dash'}, nsmap=None)
        ln.append(prstDash)
    return conn


def add_header(slide, eyebrow, title):
    add_rect(slide, 0, 0, SW, Inches(0.18), ACCENT)
    add_text(slide, Inches(0.6), Inches(0.32), Inches(8), Inches(0.35),
             eyebrow.upper(), size=11, bold=True, color=GREY)
    add_text(slide, Inches(0.6), Inches(0.55), Inches(12.2), Inches(0.7),
             title, size=28, bold=True, color=NAVY)
    add_rect(slide, Inches(0.6), Inches(1.25), Inches(0.6), Emu(38100), ACCENT)


def add_footer(slide, page):
    add_text(slide, Inches(0.6), Inches(7.1), Inches(10), Inches(0.3),
             "Throughline  ·  Process Flow Diagrams  ·  Syntegreti  ·  v0.2",
             size=9, color=GREY)
    add_text(slide, Inches(11.5), Inches(7.1), Inches(1.3), Inches(0.3),
             str(page), size=9, color=GREY, align=PP_ALIGN.RIGHT)


def caption(slide, text, y=Inches(6.55)):
    add_rect(slide, Inches(0.6), y, Inches(12.1), Inches(0.45), LIGHT)
    add_rect(slide, Inches(0.6), y, Inches(0.1), Inches(0.45), ACCENT)
    add_text(slide, Inches(0.85), y + Inches(0.06), Inches(11.8),
             Inches(0.4), text, size=12, color=TEXT)


def legend(slide, x, y, items):
    """items: list of (label, color)."""
    cx = x
    for label, color in items:
        sw = Inches(0.22)
        add_rect(slide, cx, y + Inches(0.05), sw, sw, color,
                 shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        add_text(slide, cx + sw + Inches(0.06), y, Inches(2.0),
                 Inches(0.35), label, size=11, color=GREY)
        cx += Inches(2.0)


# =========================================================================
# 1. Cover
# =========================================================================
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

    add_text(s, Inches(0.9), Inches(2.4), Inches(11), Inches(0.5),
             "THROUGHLINE  ·  v0.2", size=13, bold=True, color=ACCENT)
    add_text(s, Inches(0.9), Inches(2.85), Inches(11), Inches(1.4),
             "Process Flow Diagrams", size=58, bold=True, color=WHITE)
    add_text(s, Inches(0.9), Inches(4.25), Inches(11.5), Inches(0.7),
             "How work moves through the platform — at a glance.",
             size=22, color=WHITE)

    # Mini index
    items = ["1  Master Flow",
             "2  HRQ Lifecycle",
             "3  Partner Lifecycle",
             "4  Candidate Journey",
             "5  Interview Slot",
             "6  Onboarding (Day 0→90)",
             "7  Roles × Stages"]
    iy = Inches(5.4)
    for i, it in enumerate(items):
        col = i % 4
        row = i // 4
        add_text(s, Inches(0.9) + Inches(3.0) * col,
                 iy + Inches(0.45) * row,
                 Inches(2.9), Inches(0.4),
                 it, size=13, color=GREY2)

    # Bottom Syntegreti strip
    add_rect(s, 0, Inches(6.9), SW, Inches(0.6), SYNT_BG2)
    add_text(s, Inches(0.9), Inches(7.0), Inches(8.5), Inches(0.4),
             "Throughline  ·  Process Flow Diagrams",
             size=12, color=GREY2)
    add_text(s, Inches(9.5), Inches(7.0), Inches(3.3), Inches(0.4),
             "a Syntegreti product", size=10, color=GREY,
             align=PP_ALIGN.RIGHT)


# =========================================================================
# 2. Master Flow — 8 stages, horizontal pipeline
# =========================================================================
def slide_master_flow():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Diagram 1", "Master Flow — Requisition to Day-90")

    stages_data = [
        ("Raise HRQ",          "Hiring Mgr",       NAVY),
        ("BET Approval",       "BET Approver",     NAVY),
        ("RM Owner Accept",    "RM Owner",         NAVY),
        ("Vendor Allocation",  "Partner",          TEAL),
        ("Slot & Interview",   "Panel",            TEAL),
        ("Feedback & Offer",   "Hiring Mgr",       TEAL),
        ("BGV & Onboarding",   "SPOC",             ACCENT),
        ("Day 30/60/90",       "TA Lead",          GREEN),
    ]
    n = len(stages_data)
    box_w = Inches(1.4)
    box_h = Inches(1.4)
    gap   = Inches(0.16)
    total = box_w * n + gap * (n - 1)
    sx    = (SW - total) / 2
    sy    = Inches(2.3)

    # Stage circles
    for i, (label, role, color) in enumerate(stages_data):
        x = sx + (box_w + gap) * i
        shp = add_rect(s, x, sy, box_w, box_h, color,
                       shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        # number
        add_text(s, x, sy + Inches(0.12), box_w, Inches(0.4),
                 str(i + 1), size=18, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER)
        # title
        add_text(s, x, sy + Inches(0.5), box_w, Inches(0.55),
                 label, size=12, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER)
        # role
        add_text(s, x, sy + Inches(1.0), box_w, Inches(0.35),
                 role, size=9, color=WHITE,
                 align=PP_ALIGN.CENTER)
        # arrow
        if i < n - 1:
            arrow_right(s, x + box_w + Inches(0.005),
                        sy + box_h / 2, gap - Inches(0.01),
                        color=GREY2)

    # Sub-system bands
    add_text(s, sx, sy + Inches(1.7), box_w * 3 + gap * 2, Inches(0.3),
             "HMS  ·  Approval & Routing", size=11, bold=True, color=NAVY,
             align=PP_ALIGN.CENTER)
    add_text(s, sx + (box_w + gap) * 3, sy + Inches(1.7),
             box_w * 3 + gap * 2, Inches(0.3),
             "PMS  ·  Vendor & Interview", size=11, bold=True, color=TEAL,
             align=PP_ALIGN.CENTER)
    add_text(s, sx + (box_w + gap) * 6, sy + Inches(1.7),
             box_w + gap, Inches(0.3),
             "CMS  ·  Onboarding", size=11, bold=True, color=ACCENT,
             align=PP_ALIGN.CENTER)
    add_text(s, sx + (box_w + gap) * 7, sy + Inches(1.7),
             box_w, Inches(0.3),
             "Tracker", size=11, bold=True, color=GREEN,
             align=PP_ALIGN.CENTER)

    # Background automation strip
    auto_y = Inches(4.85)
    add_rect(s, Inches(0.6), auto_y, Inches(12.1), Inches(1.4), LIGHT)
    add_text(s, Inches(0.85), auto_y + Inches(0.1),
             Inches(12), Inches(0.4),
             "Background automation that quietly keeps the pipeline moving",
             size=13, bold=True, color=NAVY)

    autos = [
        ("Hourly", "Expire stale slots · drop after 3 rejections", TEAL),
        ("Daily",  "Reassign aged HRQs · deactivate idle vendors",  ACCENT),
        ("Always", "Audit log · email alerts · role dashboards",    NAVY),
    ]
    aw = Inches(3.85)
    ag = Inches(0.15)
    ax = Inches(0.85)
    ay = auto_y + Inches(0.55)
    for i, (k, v, c) in enumerate(autos):
        x = ax + (aw + ag) * i
        add_rect(s, x, ay, Inches(0.85), Inches(0.65), c,
                 shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        add_text(s, x, ay + Inches(0.13), Inches(0.85), Inches(0.4),
                 k, size=12, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER)
        add_text(s, x + Inches(0.95), ay + Inches(0.05),
                 aw - Inches(1.0), Inches(0.7),
                 v, size=11, color=TEXT, anchor=MSO_ANCHOR.MIDDLE)

    caption(s, "Eight stages, three sub-systems, one audit trail. "
               "Automations keep work moving without human chasing.")
    add_footer(s, 2)


# =========================================================================
# 3. HRQ Lifecycle — with decision + auto-reassign loop
# =========================================================================
def slide_hrq():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Diagram 2", "HRQ Lifecycle — with Auto-Reassign Loop")

    box_w = Inches(2.0)
    box_h = Inches(0.9)
    y_top = Inches(2.0)
    y_mid = Inches(3.6)
    y_bot = Inches(5.2)

    # Top row: HRQ Created → BET Review → RM Owner Inbox
    x_positions = [Inches(0.7), Inches(3.4), Inches(6.1)]
    for x, label, color in zip(
        x_positions,
        ["HRQ Created", "BET Review", "RM Owner Inbox"],
        [NAVY, NAVY, NAVY],
    ):
        stage(s, x, y_top, box_w, box_h, label, color=color)
    arrow_right(s, x_positions[0] + box_w, y_top + box_h / 2,
                x_positions[1] - x_positions[0] - box_w)
    arrow_right(s, x_positions[1] + box_w, y_top + box_h / 2,
                x_positions[2] - x_positions[1] - box_w)

    # Decision diamond after RM Owner inbox
    diamond_x = Inches(8.9)
    diamond_w = Inches(2.0)
    diamond_h = Inches(1.6)
    diamond(s, diamond_x, y_top - Inches(0.35),
            diamond_w, diamond_h, "Accepted\nin SLA?",
            color=ACCENT)
    arrow_right(s, x_positions[2] + box_w, y_top + box_h / 2,
                diamond_x - (x_positions[2] + box_w))

    # Yes branch → right
    yes_x = Inches(11.2)
    pill(s, yes_x, y_top + Inches(0.05), Inches(2.0), Inches(0.7),
         "Open for\nSubmissions", color=TEAL)
    arrow_right(s, diamond_x + diamond_w, y_top + box_h / 2,
                yes_x - (diamond_x + diamond_w))
    add_text(s, diamond_x + diamond_w + Inches(0.05),
             y_top + box_h / 2 - Inches(0.3),
             Inches(1), Inches(0.3), "Yes", size=11, bold=True,
             color=GREEN)

    # No branch → down (auto reassign loop)
    no_y = Inches(4.5)
    pill(s, diamond_x - Inches(0.1), no_y, Inches(2.2), Inches(0.7),
         "Auto-Reassign", color=RED)
    add_text(s, diamond_x + diamond_w / 2 + Inches(0.05),
             y_top + diamond_h - Inches(0.05),
             Inches(1), Inches(0.3), "No", size=11, bold=True,
             color=RED)
    line_connector(s,
                   diamond_x + diamond_w / 2,
                   y_top + diamond_h - Inches(0.4),
                   diamond_x + diamond_w / 2,
                   no_y,
                   color=RED, weight=Pt(2))
    arrow_down(s, diamond_x + diamond_w / 2,
               y_top + diamond_h - Inches(0.4),
               no_y - (y_top + diamond_h - Inches(0.4)),
               color=RED)
    # Loop back arrow up to RM Owner Inbox
    line_connector(s, diamond_x, no_y + Inches(0.35),
                   x_positions[2] + box_w / 2, no_y + Inches(0.35),
                   color=RED, weight=Pt(2), dashed=True)
    line_connector(s, x_positions[2] + box_w / 2, no_y + Inches(0.35),
                   x_positions[2] + box_w / 2, y_top + box_h,
                   color=RED, weight=Pt(2), dashed=True)
    add_text(s, x_positions[2] + box_w / 2 + Inches(0.1),
             y_top + box_h + Inches(0.25),
             Inches(2.5), Inches(0.3),
             "Loop until accepted",
             size=10, color=RED, bold=True)

    # Bottom row, right-to-left snake from under Open-for-Submissions:
    # Submissions (rightmost) → Interview Rounds → Offer · Hire (leftmost)
    bottom_labels = ["Submissions", "Interview Rounds", "Offer · Hire"]
    bottom_colors = [TEAL, TEAL, GREEN]
    bgap = Inches(0.5)
    right_x = yes_x  # align Submissions directly under Open-for-Submissions
    positions = [right_x - (box_w + bgap) * i for i in range(len(bottom_labels))]
    for x, label, color in zip(positions, bottom_labels, bottom_colors):
        stage(s, x, y_bot, box_w, box_h, label, color=color)
    # Arrows pointing LEFT between boxes (flow goes right-to-left along snake)
    for i in range(len(positions) - 1):
        x_start = positions[i + 1] + box_w
        width = positions[i] - x_start
        arrow_left(s, x_start, y_bot + box_h / 2, width)

    # Vertical connector: Open-for-Submissions DOWN to Submissions
    sub_center_x = right_x + box_w / 2
    arrow_down(s, sub_center_x,
               y_top + Inches(0.75),
               y_bot - (y_top + Inches(0.75)),
               color=TEAL)

    legend(s, Inches(0.7), Inches(6.15),
           [("Stage (HMS)", NAVY), ("Submissions", TEAL),
            ("Decision", ACCENT), ("Auto / Exception", RED)])
    caption(s, "Every HRQ has a clock. If the RM Owner doesn't accept in SLA, "
               "Throughline reassigns it automatically — no chasing.")
    add_footer(s, 3)


# =========================================================================
# 4. Partner Lifecycle (PMS)
# =========================================================================
def slide_partner():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Diagram 3", "Partner Lifecycle (PMS)")

    # Linear top row
    steps = ["Add Partner", "Empanelment", "SOW · Rate Card",
             "Active Engagement", "Performance Score"]
    n = len(steps)
    bw = Inches(2.1)
    bh = Inches(0.9)
    bg = Inches(0.18)
    total = bw * n + bg * (n - 1)
    sx = (SW - total) / 2
    sy = Inches(2.1)
    for i, label in enumerate(steps):
        x = sx + (bw + bg) * i
        stage(s, x, sy, bw, bh, label, color=NAVY)
        if i < n - 1:
            arrow_right(s, x + bw, sy + bh / 2, bg)

    # Decision diamond center
    dy = Inches(3.7)
    dx = (SW - Inches(2.4)) / 2
    diamond(s, dx, dy, Inches(2.4), Inches(1.4),
            "Meeting SLA &\nactive in 30d?", color=ACCENT)
    # Arrow from middle stage down to diamond
    mid_x = sx + (bw + bg) * 4 + bw / 2  # under "Performance Score"
    line_connector(s, mid_x, sy + bh,
                   mid_x, dy + Inches(0.02),
                   color=GREY2, weight=Pt(2))
    arrow_down(s, mid_x, sy + bh,
               dy - (sy + bh) + Inches(0.05),
               color=GREY2)

    # Yes branch
    yx = Inches(10.0)
    yy = Inches(4.0)
    pill(s, yx, yy, Inches(2.5), Inches(0.8), "Renew · Continue",
         color=GREEN)
    line_connector(s, dx + Inches(2.4), dy + Inches(0.7),
                   yx, yy + Inches(0.4),
                   color=GREEN, weight=Pt(2))
    add_text(s, dx + Inches(2.45), dy + Inches(0.45),
             Inches(1.0), Inches(0.3), "Yes", size=11, bold=True, color=GREEN)

    # No branch
    nx = Inches(0.8)
    ny = Inches(4.0)
    pill(s, nx, ny, Inches(2.5), Inches(0.8), "Auto-Deactivate",
         color=RED)
    line_connector(s, dx, dy + Inches(0.7),
                   nx + Inches(2.5), ny + Inches(0.4),
                   color=RED, weight=Pt(2))
    add_text(s, dx - Inches(0.4), dy + Inches(0.45),
             Inches(0.6), Inches(0.3), "No", size=11, bold=True, color=RED)

    # Reactivate loop (dashed) back to Add Partner
    line_connector(s, nx + Inches(1.25), ny + Inches(0.8),
                   nx + Inches(1.25), Inches(5.5),
                   color=GREY2, weight=Pt(1.5), dashed=True)
    line_connector(s, nx + Inches(1.25), Inches(5.5),
                   sx + bw / 2, Inches(5.5),
                   color=GREY2, weight=Pt(1.5), dashed=True)
    line_connector(s, sx + bw / 2, Inches(5.5),
                   sx + bw / 2, sy + bh,
                   color=GREY2, weight=Pt(1.5), dashed=True)
    add_text(s, nx + Inches(0.1), Inches(5.55), Inches(4),
             Inches(0.3), "Re-empanel later (manual)",
             size=10, color=GREY)

    legend(s, Inches(0.7), Inches(6.15),
           [("PMS Stage", NAVY), ("Decision", ACCENT),
            ("Continue", GREEN), ("Exit", RED)])
    caption(s, "Vendors run as a portfolio. Performance is scored continuously; "
               "30 days of inactivity triggers an automatic deactivation.")
    add_footer(s, 4)


# =========================================================================
# 5. Candidate Journey — Cart vs Bin
# =========================================================================
def slide_candidate():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Diagram 4", "Candidate Journey — Cart vs Bin")

    bw = Inches(1.9)
    bh = Inches(0.85)

    # Start
    sx = Inches(0.7)
    sy = Inches(3.0)
    stage(s, sx, sy, bw, bh, "Submission", color=TEAL)

    # Initial review diamond
    dx = Inches(3.0)
    dy = Inches(2.85)
    diamond(s, dx, dy, Inches(2.0), Inches(1.15), "Initial\nReview?",
            color=ACCENT)
    arrow_right(s, sx + bw, sy + bh / 2,
                dx - (sx + bw))

    # Cart branch (top)
    cart_y = Inches(1.5)
    cart_x = Inches(5.6)
    pill(s, cart_x, cart_y, bw, bh, "Cart", color=GREEN)
    line_connector(s, dx + Inches(1.0), dy + Inches(0.05),
                   cart_x + bw / 2, cart_y + bh,
                   color=GREEN, weight=Pt(2))
    add_text(s, dx + Inches(1.05), dy - Inches(0.3),
             Inches(2), Inches(0.3), "Approved",
             size=10, bold=True, color=GREEN)

    # Bin branch (bottom)
    bin_y = Inches(4.7)
    bin_x = Inches(5.6)
    pill(s, bin_x, bin_y, bw, bh, "Bin", color=RED)
    line_connector(s, dx + Inches(1.0), dy + Inches(1.1),
                   bin_x + bw / 2, bin_y,
                   color=RED, weight=Pt(2))
    add_text(s, dx + Inches(1.05), dy + Inches(1.15),
             Inches(2), Inches(0.3), "Flagged",
             size=10, bold=True, color=RED)

    # Cart → Interview Rounds → Offer
    rounds_x = Inches(8.0)
    stage(s, rounds_x, cart_y, bw, bh, "Interview\nRounds", color=TEAL)
    arrow_right(s, cart_x + bw, cart_y + bh / 2,
                rounds_x - (cart_x + bw), color=GREEN)
    offer_x = Inches(10.4)
    pill(s, offer_x, cart_y, bw, bh, "Offer · Hire", color=GREEN)
    arrow_right(s, rounds_x + bw, cart_y + bh / 2,
                offer_x - (rounds_x + bw), color=GREEN)

    # Bin → Re-evaluate decision diamond
    re_x = Inches(8.0)
    re_y = Inches(4.55)
    diamond(s, re_x, re_y, Inches(2.0), Inches(1.15),
            "Re-evaluate?", color=ACCENT)
    arrow_right(s, bin_x + bw, bin_y + bh / 2,
                re_x - (bin_x + bw), color=RED)

    # Re-evaluate Yes → back up to Cart
    line_connector(s, re_x + Inches(1.0), re_y + Inches(0.05),
                   re_x + Inches(1.0), cart_y + bh + Inches(0.4),
                   color=GREEN, weight=Pt(1.5), dashed=True)
    line_connector(s, re_x + Inches(1.0), cart_y + bh + Inches(0.4),
                   cart_x + bw, cart_y + bh - Inches(0.1),
                   color=GREEN, weight=Pt(1.5), dashed=True)
    arrow_right(s, cart_x + bw - Inches(0.05),
                cart_y + bh - Inches(0.1), Inches(0.05), color=GREEN)
    add_text(s, re_x - Inches(0.4), re_y - Inches(0.3),
             Inches(2), Inches(0.3), "Yes → Move to Cart",
             size=10, bold=True, color=GREEN)

    # Re-evaluate No → Drop
    drop_x = Inches(10.4)
    drop_y = re_y + Inches(0.15)
    pill(s, drop_x, drop_y, bw, bh, "Dropped", color=RED)
    arrow_right(s, re_x + Inches(2.0), re_y + Inches(0.7),
                drop_x - (re_x + Inches(2.0)), color=RED)

    # Auto-drop callout
    add_rect(s, Inches(0.7), Inches(6.0), Inches(12.1), Inches(0.4), LIGHT)
    add_text(s, Inches(0.85), Inches(6.05), Inches(12), Inches(0.35),
             "Auto-rule: 3 rejections from interviews → candidate moved to "
             "Bin and flagged for review.", size=11, color=GREY)

    caption(s, "Cart accelerates approved candidates. Bin is the safety net — "
               "nothing leaves the system without an explicit decision.")
    add_footer(s, 5)


# =========================================================================
# 6. Interview Slot Flow
# =========================================================================
def slide_slot():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Diagram 5", "Interview Slot — Self-Serve Flow")

    bw = Inches(2.1)
    bh = Inches(0.9)
    sy = Inches(2.0)

    steps = [
        ("Panel\nPublishes Slot", TEAL),
        ("Vendor\nViews Slot",    NAVY),
        ("Vendor\nBooks Candidate", NAVY),
    ]
    sx = Inches(0.7)
    bg = Inches(0.45)
    for i, (label, color) in enumerate(steps):
        x = sx + (bw + bg) * i
        stage(s, x, sy, bw, bh, label, color=color)
        if i < len(steps) - 1:
            arrow_right(s, x + bw, sy + bh / 2, bg)

    # Decision: booked in window?
    dx = sx + (bw + bg) * 3
    dy = Inches(1.8)
    diamond(s, dx, dy, Inches(2.0), Inches(1.3),
            "Booked in\nvalidity?", color=ACCENT)
    arrow_right(s, sx + (bw + bg) * 2 + bw, sy + bh / 2,
                dx - (sx + (bw + bg) * 2 + bw))

    # Yes → Interview Held → Feedback (stacked vertically to fit the slide)
    yx = dx + Inches(2.4)
    yy = sy
    stage(s, yx, yy, bw, bh, "Interview\nHeld", color=TEAL)
    arrow_right(s, dx + Inches(2.0), yy + bh / 2,
                yx - (dx + Inches(2.0)))
    add_text(s, dx + Inches(2.05), yy - Inches(0.3),
             Inches(1), Inches(0.3), "Yes",
             size=10, bold=True, color=GREEN)
    fx = yx
    fy = yy + bh + Inches(0.4)
    pill(s, fx, fy, bw, bh, "Feedback\nCaptured", color=GREEN)
    arrow_down(s, fx + bw / 2, yy + bh, fy - (yy + bh), color=GREEN)

    # No → Slot expires
    nx = dx + Inches(0.5)
    ny = Inches(4.4)
    pill(s, nx, ny, bw, bh, "Slot Auto-Expires", color=RED)
    line_connector(s, dx + Inches(1.0), dy + Inches(1.3),
                   nx + bw / 2, ny,
                   color=RED, weight=Pt(2))
    add_text(s, dx + Inches(0.0), dy + Inches(1.35),
             Inches(1.5), Inches(0.3), "No",
             size=10, bold=True, color=RED)

    # Loop back: expired slot returns to pool (dashed)
    line_connector(s, nx, ny + bh / 2,
                   sx + bw / 2, ny + bh / 2,
                   color=GREY2, weight=Pt(1.5), dashed=True)
    line_connector(s, sx + bw / 2, ny + bh / 2,
                   sx + bw / 2, sy + bh,
                   color=GREY2, weight=Pt(1.5), dashed=True)
    add_text(s, sx + bw / 2 + Inches(0.1), ny - Inches(0.05),
             Inches(4), Inches(0.3),
             "Capacity returns to slot pool",
             size=10, color=GREY)

    # Side note: 3-rejection rule
    nb_y = Inches(5.7)
    add_rect(s, Inches(0.7), nb_y, Inches(12.1), Inches(0.5), LIGHT)
    add_rect(s, Inches(0.7), nb_y, Inches(0.1), Inches(0.5), RED)
    add_text(s, Inches(0.95), nb_y + Inches(0.1), Inches(12),
             Inches(0.4),
             "Hourly job: candidates rejected from 3 slots are "
             "auto-dropped from active pipeline.",
             size=11, color=TEXT)

    caption(s, "Self-serve booking eliminates email back-and-forth. "
               "Auto-expiry means unbooked capacity is recycled — not lost.")
    add_footer(s, 6)


# =========================================================================
# 7. Onboarding (Day 0 → Day 90)
# =========================================================================
def slide_onboarding():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Diagram 6", "Onboarding — Day 0 → Day 90")

    # Timeline approach
    line_y = Inches(3.2)
    add_rect(s, Inches(0.7), line_y - Inches(0.025),
             Inches(12.1), Inches(0.05), GREY2)

    milestones = [
        ("Offer\nAccepted",   "Day 0",   ACCENT),
        ("BGV\nInitiated",    "Day 1",   TEAL),
        ("Joining\nDate",     "Day 7",   NAVY),
        ("Asset\nAllocation", "Day 7",   NAVY),
        ("Training",          "Day 14",  TEAL),
        ("30-Day\nProfile",   "Day 30",  GREEN),
        ("60-Day\nProfile",   "Day 60",  GREEN),
        ("90-Day\nProfile",   "Day 90",  GREEN),
    ]
    n = len(milestones)
    span = Inches(12.1) - Inches(1.4)
    step_x = span / (n - 1)
    cx0 = Inches(0.7) + Inches(0.7)

    for i, (label, day, color) in enumerate(milestones):
        cx = cx0 + step_x * i
        # Tick
        add_rect(s, cx - Inches(0.02), line_y - Inches(0.15),
                 Inches(0.04), Inches(0.3), color)
        # Day label above
        add_text(s, cx - Inches(0.7), line_y - Inches(0.7),
                 Inches(1.4), Inches(0.3),
                 day, size=11, bold=True, color=color, align=PP_ALIGN.CENTER)
        # Milestone box below
        box_y = line_y + Inches(0.3)
        bw, bh = Inches(1.3), Inches(0.85)
        bx = cx - bw / 2
        stage(s, bx, box_y, bw, bh, label, color=color)

    # Below timeline: cross-cutting tracking
    track_y = Inches(5.0)
    add_rect(s, Inches(0.7), track_y, Inches(12.1), Inches(1.35), LIGHT)
    add_text(s, Inches(0.95), track_y + Inches(0.1), Inches(12),
             Inches(0.4),
             "Continuously tracked on the candidate record",
             size=13, bold=True, color=NAVY)

    items = [
        ("BGV status",        TEAL),
        ("Asset register",    NAVY),
        ("Training records",  TEAL),
        ("Joining reschedule\n+ reason", ACCENT),
        ("30/60/90 progress", GREEN),
    ]
    iw = Inches(2.3)
    ig = Inches(0.1)
    ix = Inches(0.9)
    iy = track_y + Inches(0.55)
    for i, (label, c) in enumerate(items):
        x = ix + (iw + ig) * i
        shp = add_rect(s, x, iy, iw, Inches(0.7), c,
                       shape=MSO_SHAPE.ROUNDED_RECTANGLE)
        text_in_shape(shp, label, size=11, color=WHITE)

    caption(s, "One record from offer through Day 90. Reschedules and "
               "missed milestones surface immediately — joiners don't slip.")
    add_footer(s, 7)


# =========================================================================
# 8. Roles × Stages matrix
# =========================================================================
def slide_roles_matrix():
    s = prs.slides.add_slide(BLANK)
    add_header(s, "Diagram 7", "Who Touches What — Roles × Stages")

    stages_h = ["Raise\nHRQ", "BET\nApproval", "RM Owner\nAccept",
                "Vendor\nAllocation", "Slot &\nInterview",
                "Feedback\n& Offer", "BGV &\nOnboarding",
                "Day\n30/60/90"]
    roles_v = [
        ("Hiring Mgr",     NAVY),
        ("BET Approver",   NAVY),
        ("RM Owner",       TEAL),
        ("Partner",        ACCENT),
        ("Panel",          TEAL),
        ("Onboarding SPOC", ACCENT),
        ("TA Lead",        GREEN),
    ]
    # Touch matrix — 1 = primary owner, 0.5 = involved, 0 = none
    M = {
        # role index : list of weights per stage
        0: [1, 0.5, 0.5, 0,   0.5, 1,   0,   0.5],   # Hiring Mgr
        1: [0,   1, 0,   0,   0,   0,   0,   0  ],   # BET
        2: [0, 0.5,   1, 1,   0.5, 0.5, 0,   0.5],   # RM Owner
        3: [0,   0, 0,   1,   1,   0,   0,   0  ],   # Partner
        4: [0,   0, 0,   0,   1,   1,   0,   0  ],   # Panel
        5: [0,   0, 0,   0,   0,   0.5, 1,   0.5],   # SPOC
        6: [0.5, 0, 0,   0,   0,   0,   0.5, 1  ],   # TA Lead
    }

    # Layout
    left_pad = Inches(2.2)
    top_pad  = Inches(1.85)
    cell_w = Inches(1.35)
    cell_h = Inches(0.5)

    # Header row
    add_rect(s, left_pad, top_pad,
             cell_w * len(stages_h), cell_h, NAVY)
    for j, sh in enumerate(stages_h):
        x = left_pad + cell_w * j
        add_text(s, x, top_pad + Inches(0.04),
                 cell_w, cell_h - Inches(0.08),
                 sh, size=10, bold=True, color=WHITE,
                 align=PP_ALIGN.CENTER, anchor=MSO_ANCHOR.MIDDLE)

    # Role rows
    for i, (role, role_color) in enumerate(roles_v):
        ry = top_pad + cell_h * (i + 1)
        # role label
        add_rect(s, Inches(0.6), ry, left_pad - Inches(0.6), cell_h,
                 LIGHT)
        add_rect(s, Inches(0.6), ry, Inches(0.08), cell_h, role_color)
        add_text(s, Inches(0.75), ry + Inches(0.04),
                 left_pad - Inches(0.8), cell_h - Inches(0.08),
                 role, size=11, bold=True, color=NAVY,
                 anchor=MSO_ANCHOR.MIDDLE)
        # cells
        weights = M[i]
        for j, w in enumerate(weights):
            cx = left_pad + cell_w * j
            add_rect(s, cx, ry, cell_w, cell_h, WHITE,
                     line=BORDER, line_w=Pt(0.75))
            if w == 1:
                # filled circle (primary)
                cs = Inches(0.32)
                add_rect(s, cx + (cell_w - cs) / 2,
                         ry + (cell_h - cs) / 2,
                         cs, cs, role_color,
                         shape=MSO_SHAPE.OVAL)
            elif w == 0.5:
                # hollow circle (involved)
                cs = Inches(0.28)
                add_rect(s, cx + (cell_w - cs) / 2,
                         ry + (cell_h - cs) / 2,
                         cs, cs, WHITE,
                         shape=MSO_SHAPE.OVAL,
                         line=role_color, line_w=Pt(2))

    # Legend
    leg_y = top_pad + cell_h * (len(roles_v) + 1) + Inches(0.3)
    # primary
    cs = Inches(0.25)
    add_rect(s, Inches(0.7), leg_y + Inches(0.05),
             cs, cs, GREY, shape=MSO_SHAPE.OVAL)
    add_text(s, Inches(1.05), leg_y, Inches(2),
             Inches(0.35), "Primary owner", size=11, color=GREY)
    add_rect(s, Inches(2.8), leg_y + Inches(0.05),
             cs, cs, WHITE, shape=MSO_SHAPE.OVAL,
             line=GREY, line_w=Pt(2))
    add_text(s, Inches(3.15), leg_y, Inches(2),
             Inches(0.35), "Involved / approver", size=11, color=GREY)

    caption(s, "One owner per stage. Other stakeholders are involved but never "
               "ambiguous about who's accountable.")
    add_footer(s, 8)


# =========================================================================
# 9. Closing
# =========================================================================
def slide_close():
    s = prs.slides.add_slide(BLANK)
    add_rect(s, 0, 0, SW, SH, SYNT_BG)
    add_rect(s, 0, 0, Inches(0.45), SH, ACCENT)

    s.shapes.add_picture(LOGO_PATH, Inches(10.4), Inches(0.5),
                         Inches(2.4), Inches(0.96))

    add_text(s, Inches(0.9), Inches(2.4), Inches(11), Inches(1.2),
             "That's the flow.", size=64, bold=True, color=WHITE)
    add_text(s, Inches(0.9), Inches(3.7), Inches(11), Inches(0.6),
             "Same shape as how a GCC already operates — "
             "just enforced and instrumented.",
             size=20, color=ACCENT)
    add_text(s, Inches(0.9), Inches(5.0), Inches(11), Inches(0.4),
             "NEXT", size=12, bold=True, color=ACCENT)
    add_text(s, Inches(0.9), Inches(5.4), Inches(12), Inches(0.5),
             "▸  Walk one of these flows on your real data — 30-min discovery.",
             size=14, color=WHITE)
    add_text(s, Inches(0.9), Inches(5.85), Inches(12), Inches(0.5),
             "▸  Pick two domains for a 6-week pilot — measure TAT lift.",
             size=14, color=WHITE)

    add_rect(s, 0, Inches(6.9), SW, Inches(0.6), SYNT_BG2)
    add_text(s, Inches(0.9), Inches(7.0), Inches(11), Inches(0.4),
             "Throughline  ·  a Syntegreti product",
             size=11, color=GREY2)
    add_text(s, Inches(10.0), Inches(7.0), Inches(2.8), Inches(0.4),
             "v0.2", size=10, color=GREY, align=PP_ALIGN.RIGHT)


# ---- Build ---------------------------------------------------------------
slide_cover()
slide_master_flow()
slide_hrq()
slide_partner()
slide_candidate()
slide_slot()
slide_onboarding()
slide_roles_matrix()
slide_close()

out = "/Users/jjayaraj/workspaces/studios/epicenter/docs/Throughline-Process-Flows-v0.2.pptx"
prs.save(out)
print("Saved:", out)
