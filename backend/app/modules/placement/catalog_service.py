from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.placement_catalog import PlacementCompany, PlacementTrack, PlacementTrackRound

SEED = [("SkillBattle General Software Engineering", "Product technology", "Software Engineer", [
    ("Quantitative aptitude", "MCQ", "Aptitude"), ("Technical fundamentals", "MCQ", "Core CS"), ("Coding practice", "CODING", "Data structures")]),
    ("SkillBattle General Data & AI", "AI/ML and data science", "Data Analyst", [
    ("Data reasoning", "MCQ", "Analytics"), ("SQL practice", "SQL", "SQL"), ("Technical interview", "INTERVIEW", "Data fundamentals")]),
    ("SkillBattle General Consulting", "IT services and consulting", "Graduate Engineer", [
    ("Aptitude", "MCQ", "Quantitative aptitude"), ("Logical reasoning", "MCQ", "Reasoning"), ("Coding practice", "CODING", "Programming")])]

async def ensure_catalogue(db: AsyncSession):
    for name, category, role, rounds in SEED:
        company = (await db.execute(select(PlacementCompany).where(PlacementCompany.name == name))).scalar_one_or_none()
        if not company:
            company = PlacementCompany(name=name, category=category, is_published=True)
            db.add(company); await db.flush()
        track = (await db.execute(select(PlacementTrack).where(PlacementTrack.company_id == company.id, PlacementTrack.role == role))).scalar_one_or_none()
        if not track:
            track = PlacementTrack(company_id=company.id, role=role, title=f"{role} preparation track", description="General SkillBattle preparation template. It is not a verified company hiring process.", template_kind="GENERAL", is_published=True)
            db.add(track); await db.flush()
            for position, (title, assessment_type, topic) in enumerate(rounds, 1): db.add(PlacementTrackRound(track_id=track.id, position=position, title=title, assessment_type=assessment_type, topic=topic, description=f"Practice {topic} with the supported SkillBattle activity."))
    await db.commit()

async def list_catalogue(db: AsyncSession, q: str = "", category: str | None = None, role: str | None = None):
    await ensure_catalogue(db)
    stmt = select(PlacementCompany, PlacementTrack).join(PlacementTrack, PlacementTrack.company_id == PlacementCompany.id).where(PlacementCompany.is_published.is_(True), PlacementTrack.is_published.is_(True))
    if q: stmt = stmt.where(PlacementCompany.name.ilike(f"%{q}%"))
    if category: stmt = stmt.where(PlacementCompany.category == category)
    if role: stmt = stmt.where(PlacementTrack.role == role)
    rows = (await db.execute(stmt)).all(); return [{"company_id": c.id, "company_name": c.name, "category": c.category, "track_id": t.id, "role": t.role, "title": t.title, "description": t.description, "template_kind": t.template_kind} for c,t in rows]

async def get_track(db: AsyncSession, track_id: str):
    track = (await db.execute(select(PlacementTrack).where(PlacementTrack.id == track_id, PlacementTrack.is_published.is_(True)))).scalar_one_or_none()
    if not track: return None
    company = await db.get(PlacementCompany, track.company_id)
    rounds = (await db.execute(select(PlacementTrackRound).where(PlacementTrackRound.track_id == track.id).order_by(PlacementTrackRound.position))).scalars().all()
    return {"id": track.id, "title": track.title, "role": track.role, "description": track.description, "template_kind": track.template_kind, "company": {"id": company.id, "name": company.name, "category": company.category}, "rounds": [{"id":r.id,"position":r.position,"title":r.title,"assessment_type":r.assessment_type,"topic":r.topic,"description":r.description,"assessment_id":r.assessment_id} for r in rounds]}
