from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.placement_catalog import PlacementCompany, PlacementTrack, PlacementTrackRound

LEGACY_GENERATED_COMPANY_NAMES = (
    "SkillBattle General Software Engineering",
    "SkillBattle General Data & AI",
    "SkillBattle General Consulting",
)

async def list_catalogue(db: AsyncSession, q: str = "", category: str | None = None, role: str | None = None):
    stmt = select(PlacementCompany, PlacementTrack).join(PlacementTrack, PlacementTrack.company_id == PlacementCompany.id).where(
        PlacementCompany.is_published.is_(True),
        PlacementTrack.is_published.is_(True),
        PlacementCompany.name.not_in(LEGACY_GENERATED_COMPANY_NAMES),
    )
    if q: stmt = stmt.where(PlacementCompany.name.ilike(f"%{q}%"))
    if category: stmt = stmt.where(PlacementCompany.category == category)
    if role: stmt = stmt.where(PlacementTrack.role == role)
    rows = (await db.execute(stmt)).all(); return [{"company_id": c.id, "company_name": c.name, "category": c.category, "track_id": t.id, "role": t.role, "title": t.title, "description": t.description, "template_kind": t.template_kind} for c,t in rows]

async def get_track(db: AsyncSession, track_id: str):
    track = (await db.execute(select(PlacementTrack).where(PlacementTrack.id == track_id, PlacementTrack.is_published.is_(True)))).scalar_one_or_none()
    if not track: return None
    company = await db.get(PlacementCompany, track.company_id)
    if not company or company.name in LEGACY_GENERATED_COMPANY_NAMES:
        return None
    rounds = (await db.execute(select(PlacementTrackRound).where(PlacementTrackRound.track_id == track.id).order_by(PlacementTrackRound.position))).scalars().all()
    return {"id": track.id, "title": track.title, "role": track.role, "description": track.description, "template_kind": track.template_kind, "company": {"id": company.id, "name": company.name, "category": company.category}, "rounds": [{"id":r.id,"position":r.position,"title":r.title,"assessment_type":r.assessment_type,"topic":r.topic,"description":r.description,"assessment_id":r.assessment_id} for r in rounds]}
