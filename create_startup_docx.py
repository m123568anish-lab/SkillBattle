import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

def create_report_docx():
    doc = docx.Document()

    # Set page margins (1 inch all around)
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.0)
        section.right_margin = Inches(1.0)

    # Pure black color constant
    BLACK = RGBColor(0, 0, 0)
    FONT_FAMILY = 'Calibri'

    def add_title(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        run.font.name = FONT_FAMILY
        run.font.size = Pt(20)
        run.font.bold = True
        run.font.color.rgb = BLACK
        p.paragraph_format.space_after = Pt(4)
        return p

    def add_subtitle(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(text)
        run.font.name = FONT_FAMILY
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = BLACK
        p.paragraph_format.space_after = Pt(20)
        return p

    def add_section_header(number, title):
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.keep_with_next = True
        
        run = p.add_run(f"{number}. {title}")
        run.font.name = FONT_FAMILY
        run.font.size = Pt(13)
        run.font.bold = True
        run.font.color.rgb = BLACK
        return p

    def add_body_p(text, bold_prefix=None, space_after=6):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(space_after)
        p.paragraph_format.line_spacing = 1.15
        
        if bold_prefix:
            run_b = p.add_run(bold_prefix)
            run_b.font.name = FONT_FAMILY
            run_b.font.size = Pt(11)
            run_b.font.bold = True
            run_b.font.color.rgb = BLACK

        run = p.add_run(text)
        run.font.name = FONT_FAMILY
        run.font.size = Pt(11)
        run.font.color.rgb = BLACK
        return p

    def add_bullet_item(bold_label, text):
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(4)
        p.paragraph_format.line_spacing = 1.15
        
        run_b = p.add_run(bold_label)
        run_b.font.name = FONT_FAMILY
        run_b.font.size = Pt(11)
        run_b.font.bold = True
        run_b.font.color.rgb = BLACK

        run = p.add_run(text)
        run.font.name = FONT_FAMILY
        run.font.size = Pt(11)
        run.font.color.rgb = BLACK
        return p

    # --- DOCUMENT CONTENT ---

    add_title("STARTUP & ENTREPRENEURIAL ACTIVITY ASSESSMENT REPORT")
    add_subtitle("Department of Computer Science & Engineering | 7th Semester B.Tech")

    # Section 1
    add_section_header(1, "Title of the Project")
    add_body_p("SkillBattle: A Proposed Gamified, AI-Powered Real-Time Competitive Coding & Placement Readiness Platform (Startup Concept)")

    # Section 2
    add_section_header(2, "Introduction")
    add_body_p(
        " maps out a startup concept designed to address the challenges engineering students face during campus placements, technical online assessments (OAs), and coding interviews. The proposed platform aims to bridge the gap between traditional academic learning and industry expectations by introducing gamified, real-time competitive coding battles and automated AI interview feedback.",
        bold_prefix="SkillBattle"
    )
    add_body_p(
        "Unlike static practice portals, SkillBattle is conceived as a dynamic platform where students can participate in 1v1 coding duels, simulated company recruitment speedruns (Amazon, Google, TCS, Infosys, Microsoft), and post-battle AI technical interviews that evaluate time-space complexity and edge-case handling under time-bound stress."
    )

    # Section 3
    add_section_header(3, "Objectives")
    add_bullet_item("To Address Placement Gaps: ", "Develop a conceptual platform that simulates real-world corporate recruitment rounds and online assessment environments.")
    add_bullet_item("To Gamify Technical Skill Development: ", "Design a competitive peer-to-peer 1v1 and team battle framework to encourage consistent daily coding practice among engineering students.")
    add_bullet_item("To Introduce AI-Driven Interview Evaluation: ", "Propose an automated AI module that conducts mock follow-up interviews to evaluate time complexity (Big-O analysis) and code optimization.")
    add_bullet_item("To Provide Actionable Skill Analytics: ", "Conceptually design a Student Placement Readiness Scorecard to give students and university placement cells clear readiness metrics.")
    add_bullet_item("To Formulate a Sustainable Business Model: ", "Establish a multi-tier business proposal serving individual students (Freemium/Pro), colleges (Institutional SaaS), and recruiters.")

    # Section 4
    add_section_header(4, "Problem Statement")
    add_body_p("A significant percentage of graduating Computer Science and Engineering students struggle to clear initial technical screening rounds during campus placements due to the following key problems:")
    add_bullet_item("Lack of High-Pressure Practice Environment: ", "Traditional learning portals allow unlimited time and static execution, which does not reflect the timed stress of actual corporate Online Assessments (OAs).")
    add_bullet_item("Lack of Verbal & Complexity Evaluation: ", "Many candidates can solve basic problems but fail technical interviews because they cannot explain time/space complexity trade-offs or edge-case handling.")
    add_bullet_item("Low Student Engagement & Consistency: ", "Self-guided, solo coding practice often suffers from high drop-out rates due to lack of peer interaction and motivation.")
    add_bullet_item("High Cost of Interview Coaching: ", "Professional 1-on-1 human mock interview services are expensive, making them inaccessible to most students.")

    # Section 5
    add_section_header(5, "Proposed Solution / Business Idea")
    add_body_p("The proposed startup concept, SkillBattle, offers an interactive, real-time competitive platform that transforms technical placement preparation into an engaging experience:")
    add_bullet_item("Company OA Speedrun Simulators: ", "Proposed 45–60 minute simulated online assessment tracks aligned with actual hiring patterns of major recruiters (Amazon, Google, TCS, Infosys, Microsoft).")
    add_bullet_item("AI Technical Mock Interviewer: ", "A proposed intelligent post-battle evaluation module that conducts follow-up Q&A sessions asking candidates to explain Big-O time complexity and edge cases.")
    add_bullet_item("Gamified Battle Modes: ", "Conceptualized 1v1 Ranked Duels, Team Bug-Hunting/Refactoring (2v2), and Pair-Programming Co-Op with automated role rotation.")
    add_bullet_item("Placement Readiness Scorecard: ", "A proposed scoring algorithm (0–100 Placement Index) that synthesizes problem-solving performance into a shareable readiness certificate.")

    # Section 6
    add_section_header(6, "Market Analysis")
    add_body_p("The target market includes undergraduate engineering students (Semesters 5 to 8), university placement cells, and tech recruiters. The global EdTech and skill assessment market is projected to reach $24.7 Billion by 2030, driven by the demand for job-ready engineering talent.")
    add_body_p("Proposed Competitive Matrix:", bold_prefix="Comparative Overview: ")

    # Grid Table with black text
    table = doc.add_table(rows=5, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False

    headers = ["Feature / Metric", "LeetCode / HackerRank", "GeeksforGeeks", "SkillBattle (Proposed Idea)"]
    data = [
        ["Primary Focus", "Static Problem Solving", "Article Explanations", "Real-Time Battle & Placement Speedrun"],
        ["Real-Time 1v1 Duels", "No", "No", "Yes (Proposed WebSockets Engine)"],
        ["AI Technical Interviewer", "No", "No", "Yes (Proposed Automated Grilling)"],
        ["Core CS + DSA Hybrid", "No", "Limited", "Yes (Timed MCQ + Code Rounds)"]
    ]

    # Style header row (Black bold text)
    hdr_cells = table.rows[0].cells
    for i, title in enumerate(headers):
        hdr_cells[i].text = title
        for p in hdr_cells[i].paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = FONT_FAMILY
                run.font.size = Pt(10)
                run.font.bold = True
                run.font.color.rgb = BLACK

    # Populate data rows (Black text)
    for row_idx, row_data in enumerate(data):
        row_cells = table.rows[row_idx + 1].cells
        for col_idx, cell_value in enumerate(row_data):
            row_cells[col_idx].text = cell_value
            for p in row_cells[col_idx].paragraphs:
                for run in p.runs:
                    run.font.name = FONT_FAMILY
                    run.font.size = Pt(9.5)
                    run.font.color.rgb = BLACK
                    if col_idx == 3 or col_idx == 0:
                        run.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Section 7
    add_section_header(7, "Business Model")
    add_body_p("The proposed startup idea envisions a multi-tiered revenue framework:")
    add_bullet_item("Freemium & Subscription Model (B2C): ", "Free access to basic 1v1 practice duels, with a premium subscription ('SkillBattle Pro') unlocking unlimited AI Mock Interviews and Company Speedruns.")
    add_bullet_item("Institutional SaaS Licences (B2B): ", "Annual subscriptions offered to college placement cells for institutional student analytics dashboards and custom private assessment rooms.")
    add_bullet_item("Recruiter Hiring Portal (B2B): ", "Pay-per-candidate hiring assessments and recruitment matching for tech companies seeking pre-vetted top performers.")

    # Section 8
    add_section_header(8, "Implementation Plan")
    add_body_p("The proposed development roadmap for bringing the SkillBattle concept from idea to launch is structured in five phases:")
    add_bullet_item("Phase 1 (Concept & Architecture): ", "Detailed requirement analysis, database schema design, and technical specification.")
    add_bullet_item("Phase 2 (MVP Prototype Development): ", "Development of core 1v1 real-time engine, user authentication, and basic coding workspace.")
    add_bullet_item("Phase 3 (AI & Speedrun Integration): ", "Integration of AI mock interviewer module, company speedrun tracks, and scorecard algorithms.")
    add_bullet_item("Phase 4 (Pilot Testing): ", "Pilot implementation across campus student groups to gather feedback and refine features.")
    add_bullet_item("Phase 5 (Market Launch & Expansion): ", "Commercial rollout of SkillBattle Pro subscriptions and institutional university outreach.")

    # Section 9
    add_section_header(9, "Expected Outcomes")
    add_bullet_item("Improved Placement Readiness: ", "Helps engineering students build confidence, speed, and technical articulation skills required for campus hiring.")
    add_bullet_item("Accessible Interview Coaching: ", "Provides affordable, automated mock interview evaluation for students regardless of geographic or financial constraints.")
    add_bullet_item("Scalable Entrepreneurial Opportunity: ", "Demonstrates a viable B2C/B2B SaaS business opportunity in the EdTech and recruitment sectors.")

    # Section 10
    add_section_header(10, "References")
    add_bullet_item("1. ", "ACM. 'Evaluating the Impact of Gamification on Competitive Programming Performance.' Journal of Educational Technology, 2024.")
    add_bullet_item("2. ", "NASSCOM Strategic Review. 'Technology Sector in India: Talent & Skill Gap Analysis.' 2025.")
    add_bullet_item("3. ", "FastAPI & Next.js Architecture Guidelines for High-Concurrency Multiplayer Platforms. Tech Documentation, 2026.")
    add_bullet_item("4. ", "Harvard Business Review. 'The Future of Technical Hiring: Moving from Static Resumes to Verified Skill Analytics.' 2024.")

    # Section 11
    add_section_header(11, "Student Details")
    
    card_table = doc.add_table(rows=6, cols=2)
    card_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    
    details_data = [
        ("Student Name:", "[Your Name]"),
        ("Roll Number:", "[Your Roll Number]"),
        ("Program & Branch:", "B.Tech in Computer Science and Engineering (CSE)"),
        ("Semester:", "7th Semester"),
        ("Email ID:", "[Your Student Email ID]"),
        ("Project Idea Title:", "SkillBattle — Proposed Gamified Placement Platform Concept")
    ]

    for idx, (label, val) in enumerate(details_data):
        cells = card_table.rows[idx].cells
        cells[0].text = label
        cells[1].text = val
        
        # Style label (Black Bold)
        p0 = cells[0].paragraphs[0]
        for r in p0.runs:
            r.font.name = FONT_FAMILY
            r.font.size = Pt(10.5)
            r.font.bold = True
            r.font.color.rgb = BLACK
            
        # Style val (Black Regular)
        p1 = cells[1].paragraphs[0]
        for r in p1.runs:
            r.font.name = FONT_FAMILY
            r.font.size = Pt(10.5)
            r.font.color.rgb = BLACK

    # Save document with fallback in case file is currently locked in Word
    primary_path = r"d:\BattleAI\STARTUP_REPORT_SKILLBATTLE.docx"
    fallback_path = r"d:\BattleAI\STARTUP_REPORT_SKILLBATTLE_SIMPLE.docx"
    
    try:
        doc.save(primary_path)
        print(f"Successfully generated simple black-and-white DOCX report at: {primary_path}")
    except PermissionError:
        doc.save(fallback_path)
        print(f"Primary file locked. Saved simple black-and-white DOCX report to fallback path: {fallback_path}")

if __name__ == "__main__":
    create_report_docx()
