"""
=========================================================
SkillBattle - College Platform Service
=========================================================
"""

import logging
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_
from sqlalchemy.orm import selectinload

from app.core.security import hash_password
from app.models.user import User
from app.models.profile import Profile
from app.models.college import (
    College,
    Department,
    Batch,
    CollegeStudent,
    CollegeAssessment,
    CollegeAssessmentQuestion,
    CollegeAssessmentSubmission,
)
from app.modules.college.schemas import (
    CollegeRegisterRequest,
    DepartmentCreateRequest,
    BatchCreateRequest,
    AddStudentRequest,
    AssessmentCreateRequest,
    AssessmentScheduleRequest,
    SubmitAssessmentRequest,
)

logger = logging.getLogger(__name__)


class CollegeService:

    # =====================================================
    # 1. College Registration & Management
    # =====================================================

    async def register_college(
        self,
        db: AsyncSession,
        payload: CollegeRegisterRequest,
    ) -> College:
        # Check existing code
        stmt_code = select(College).where(College.code == payload.code.upper())
        res_code = await db.execute(stmt_code)
        if res_code.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"College code '{payload.code}' is already registered."
            )

        # Find or create admin user account without granting privileged access before verification.
        stmt_user = select(User).where(User.email == payload.admin_email)
        res_user = await db.execute(stmt_user)
        admin_user = res_user.scalar_one_or_none()

        if admin_user:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This email is already associated with an account. Use a different administrator email.",
            )
        else:
            admin_user = User(
                username=f"admin_{payload.code.lower()}",
                full_name=payload.admin_name,
                email=payload.admin_email,
                password_hash=hash_password(payload.admin_password),
                role="student",
                account_type="COLLEGE",
                requested_role="COLLEGE_ADMIN",
                status="PENDING_VERIFICATION",
                is_active=True,
                is_verified=False,
                onboarding_completed=False,
            )
            db.add(admin_user)
            await db.flush()

        # Create College record as pending and unverified until admin approval.
        college = College(
            name=payload.name,
            code=payload.code.upper(),
            domain=payload.domain,
            city=payload.city,
            state=payload.state,
            is_verified=False,
            admin_user_id=admin_user.id,
        )
        db.add(college)
        await db.commit()
        await db.refresh(college)
        return college

    async def list_pending_colleges(self, db: AsyncSession) -> List[College]:
        stmt = (
            select(College)
            .join(User, User.id == College.admin_user_id)
            .where(User.status == "PENDING_VERIFICATION")
            .order_by(College.created_at.asc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())

    async def update_college_status(
        self,
        db: AsyncSession,
        college_id: int,
        college_status: str,
    ) -> College:
        college = await db.get(College, college_id)
        if not college:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="College not found.")

        admin_user = await db.get(User, college.admin_user_id) if college.admin_user_id else None
        if college_status == "verified" and admin_user is None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="College has no administrator to activate.")

        if college_status == "verified":
            college.is_verified = True
            admin_user.account_type = "COLLEGE"
            admin_user.role = "college_admin"
            admin_user.requested_role = None
            admin_user.status = "ACTIVE"
            admin_user.is_active = True
        else:
            college.is_verified = False
            if admin_user:
                admin_user.account_type = "COLLEGE"
                admin_user.role = "student"
                admin_user.status = "REJECTED"

        await db.commit()
        await db.refresh(college)
        return college

    async def get_user_college(
        self,
        db: AsyncSession,
        user: User,
    ) -> Optional[College]:
        role = getattr(user, "role", "user").lower()

        if role in ["college_admin", "placement_officer", "faculty"]:
            # Query college by admin_user_id or created entities
            stmt = select(College).where(College.admin_user_id == user.id)
            res = await db.execute(stmt)
            coll = res.scalar_one_or_none()
            if coll:
                return coll

            # Fallback: check if linked in CollegeStudent or staff assignment
            stmt_staff = select(CollegeStudent).where(CollegeStudent.user_id == user.id)
            res_staff = await db.execute(stmt_staff)
            cs = res_staff.scalar_one_or_none()
            if cs:
                stmt_c = select(College).where(College.id == cs.college_id)
                res_c = await db.execute(stmt_c)
                return res_c.scalar_one_or_none()
            
            # Default to first available college if user is platform admin
            if user.is_superuser:
                stmt_all = select(College).limit(1)
                res_all = await db.execute(stmt_all)
                return res_all.scalar_one_or_none()

        elif role in ["user", "student"]:
            stmt_s = select(CollegeStudent).where(CollegeStudent.user_id == user.id)
            res_s = await db.execute(stmt_s)
            cs = res_s.scalar_one_or_none()
            if cs:
                stmt_c = select(College).where(College.id == cs.college_id)
                res_c = await db.execute(stmt_c)
                return res_c.scalar_one_or_none()

        return None

    # =====================================================
    # 2. Departments & Batches
    # =====================================================

    async def create_department(
        self,
        db: AsyncSession,
        college_id: int,
        payload: DepartmentCreateRequest,
    ) -> Department:
        dept = Department(
            college_id=college_id,
            name=payload.name,
            code=payload.code.upper(),
            head_name=payload.head_name or "",
        )
        db.add(dept)
        await db.commit()
        await db.refresh(dept)
        return dept

    async def list_departments(
        self,
        db: AsyncSession,
        college_id: int,
    ) -> List[Department]:
        stmt = select(Department).where(Department.college_id == college_id)
        res = await db.execute(stmt)
        return res.scalars().all()

    async def create_batch(
        self,
        db: AsyncSession,
        college_id: int,
        payload: BatchCreateRequest,
    ) -> Batch:
        batch = Batch(
            college_id=college_id,
            department_id=payload.department_id,
            name=payload.name,
            passout_year=payload.passout_year,
        )
        db.add(batch)
        await db.commit()
        await db.refresh(batch)
        return batch

    async def list_batches(
        self,
        db: AsyncSession,
        college_id: int,
    ) -> List[Batch]:
        stmt = select(Batch).where(Batch.college_id == college_id)
        res = await db.execute(stmt)
        return res.scalars().all()

    # =====================================================
    # 3. Student Link & Roster
    # =====================================================

    async def add_student(
        self,
        db: AsyncSession,
        college_id: int,
        payload: AddStudentRequest,
    ) -> CollegeStudent:
        # Find user by email or username
        stmt_u = select(User).where(
            or_(User.email == payload.user_email_or_username, User.username == payload.user_email_or_username)
        )
        res_u = await db.execute(stmt_u)
        target_user = res_u.scalar_one_or_none()
        if not target_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"User '{payload.user_email_or_username}' not found. Please ensure student account is registered."
            )

        # Check existing link
        stmt_link = select(CollegeStudent).where(CollegeStudent.user_id == target_user.id)
        res_link = await db.execute(stmt_link)
        existing_link = res_link.scalar_one_or_none()

        if existing_link:
            existing_link.college_id = college_id
            existing_link.department_id = payload.department_id
            existing_link.batch_id = payload.batch_id
            existing_link.roll_number = payload.roll_number or existing_link.roll_number
            existing_link.user = target_user
            await db.commit()
            return existing_link

        cs = CollegeStudent(
            college_id=college_id,
            user_id=target_user.id,
            department_id=payload.department_id,
            batch_id=payload.batch_id,
            roll_number=payload.roll_number or "",
            user=target_user,
        )
        db.add(cs)
        await db.commit()
        await db.refresh(cs)
        cs.user = target_user
        return cs

    async def list_students(
        self,
        db: AsyncSession,
        college_id: int,
        department_id: Optional[int] = None,
        batch_id: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        query = select(CollegeStudent).where(CollegeStudent.college_id == college_id).options(selectinload(CollegeStudent.user))
        if department_id:
            query = query.where(CollegeStudent.department_id == department_id)
        if batch_id:
            query = query.where(CollegeStudent.batch_id == batch_id)

        res = await db.execute(query)
        students = res.scalars().all()

        dept_map = {d.id: d.name for d in await self.list_departments(db, college_id)}
        batch_map = {b.id: b.name for b in await self.list_batches(db, college_id)}

        result = []
        for s in students:
            result.append({
                "id": s.id,
                "college_id": s.college_id,
                "user_id": s.user_id,
                "username": s.user.username if s.user else "",
                "full_name": s.user.full_name if s.user else "",
                "email": s.user.email if s.user else "",
                "roll_number": s.roll_number,
                "department_name": dept_map.get(s.department_id, "N/A"),
                "batch_name": batch_map.get(s.batch_id, "N/A"),
                "joined_at": s.joined_at,
            })
        return result

    # =====================================================
    # 4. Assessment Management (Placement Officer & Faculty)
    # =====================================================

    async def create_assessment(
        self,
        db: AsyncSession,
        creator_user: User,
        college_id: int,
        payload: AssessmentCreateRequest,
    ) -> CollegeAssessment:
        assessment = CollegeAssessment(
            college_id=college_id,
            department_id=payload.department_id,
            batch_id=payload.batch_id,
            created_by_user_id=creator_user.id,
            title=payload.title,
            description=payload.description or "",
            assessment_type=payload.assessment_type,
            duration_minutes=payload.duration_minutes,
            pass_marks=payload.pass_marks,
            total_marks=payload.total_marks,
            status="SCHEDULED",
        )
        db.add(assessment)
        await db.flush()

        for q_item in payload.questions:
            q_obj = CollegeAssessmentQuestion(
                assessment_id=assessment.id,
                question_type=q_item.question_type,
                skill_category=q_item.skill_category.strip(),
                question_text=q_item.question_text,
                options_json=q_item.options,
                correct_option=q_item.correct_option,
                coding_starter_code=q_item.coding_starter_code or "",
                test_cases_json=q_item.test_cases,
                marks=q_item.marks,
            )
            db.add(q_obj)

        await db.commit()
        await db.refresh(assessment)
        return assessment

    async def schedule_assessment(
        self,
        db: AsyncSession,
        college_id: int,
        assessment_id: int,
        payload: AssessmentScheduleRequest,
    ) -> CollegeAssessment:
        stmt = select(CollegeAssessment).where(
            CollegeAssessment.id == assessment_id, CollegeAssessment.college_id == college_id
        )
        res = await db.execute(stmt)
        assessment = res.scalar_one_or_none()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")

        assessment.start_time = payload.start_time
        assessment.end_time = payload.end_time
        if payload.department_id:
            assessment.department_id = payload.department_id
        if payload.batch_id:
            assessment.batch_id = payload.batch_id
        assessment.status = "ACTIVE"
        await db.commit()
        await db.refresh(assessment)
        return assessment

    async def list_college_assessments(
        self,
        db: AsyncSession,
        college_id: int,
    ) -> List[CollegeAssessment]:
        stmt = (
            select(CollegeAssessment)
            .where(CollegeAssessment.college_id == college_id)
            .options(selectinload(CollegeAssessment.questions))
            .order_by(CollegeAssessment.created_at.desc())
        )
        res = await db.execute(stmt)
        return res.scalars().all()

    async def get_student_assigned_assessments(
        self,
        db: AsyncSession,
        student_user: User,
    ) -> List[CollegeAssessment]:
        stmt_link = select(CollegeStudent).where(CollegeStudent.user_id == student_user.id)
        res_link = await db.execute(stmt_link)
        cs = res_link.scalar_one_or_none()

        if not cs:
            return []

        filters = [CollegeAssessment.college_id == cs.college_id]
        if cs.department_id is None:
            filters.append(CollegeAssessment.department_id.is_(None))
        else:
            filters.append(
                or_(
                    CollegeAssessment.department_id.is_(None),
                    CollegeAssessment.department_id == cs.department_id,
                )
            )
        if cs.batch_id is None:
            filters.append(CollegeAssessment.batch_id.is_(None))
        else:
            filters.append(
                or_(
                    CollegeAssessment.batch_id.is_(None),
                    CollegeAssessment.batch_id == cs.batch_id,
                )
            )

        stmt = (
            select(CollegeAssessment)
            .where(*filters)
            .options(selectinload(CollegeAssessment.questions))
            .order_by(CollegeAssessment.created_at.desc())
        )
        res = await db.execute(stmt)
        return res.scalars().all()

    async def submit_assessment(
        self,
        db: AsyncSession,
        student_user: User,
        payload: SubmitAssessmentRequest,
    ) -> CollegeAssessmentSubmission:
        stmt = (
            select(CollegeAssessment)
            .where(CollegeAssessment.id == payload.assessment_id)
            .options(selectinload(CollegeAssessment.questions))
        )
        res = await db.execute(stmt)
        assessment = res.scalar_one_or_none()
        if not assessment:
            raise HTTPException(status_code=404, detail="Assessment not found")

        student_link_stmt = select(CollegeStudent).where(
            CollegeStudent.user_id == student_user.id,
            CollegeStudent.college_id == assessment.college_id,
        )
        student_link = (await db.execute(student_link_stmt)).scalar_one_or_none()
        if not student_link:
            raise HTTPException(status_code=403, detail="This assessment is only available to enrolled college students.")
        if assessment.department_id is not None and assessment.department_id != student_link.department_id:
            raise HTTPException(status_code=403, detail="This assessment is not assigned to your department.")
        if assessment.batch_id is not None and assessment.batch_id != student_link.batch_id:
            raise HTTPException(status_code=403, detail="This assessment is not assigned to your batch.")

        # Evaluate MCQ and Coding answers
        mcq_score = 0.0
        coding_score = 0.0

        for q in assessment.questions:
            ans_val = payload.answers.get(str(q.id)) or payload.answers.get(f"q_{q.id}")
            if q.question_type == "MCQ" and ans_val:
                if str(ans_val).strip().lower() == str(q.correct_option).strip().lower():
                    mcq_score += float(q.marks)
            elif q.question_type == "CODING" and ans_val:
                # Basic code length & structure check scoring
                if len(str(ans_val).strip()) > 20:
                    coding_score += float(q.marks)

        total_score = mcq_score + coding_score
        max_marks = max(1.0, float(assessment.total_marks))
        percentage = round((total_score / max_marks) * 100.0, 1)
        is_passed = total_score >= assessment.pass_marks

        # Check existing submission
        stmt_sub = select(CollegeAssessmentSubmission).where(
            CollegeAssessmentSubmission.assessment_id == assessment.id,
            CollegeAssessmentSubmission.student_id == student_user.id
        )
        res_sub = await db.execute(stmt_sub)
        existing_sub = res_sub.scalar_one_or_none()

        if existing_sub:
            existing_sub.mcq_score = mcq_score
            existing_sub.coding_score = coding_score
            existing_sub.total_score = total_score
            existing_sub.percentage = percentage
            existing_sub.is_passed = is_passed
            existing_sub.answers_json = payload.answers
            existing_sub.submitted_at = datetime.utcnow()
            await db.commit()
            return existing_sub

        submission = CollegeAssessmentSubmission(
            assessment_id=assessment.id,
            student_id=student_user.id,
            mcq_score=mcq_score,
            coding_score=coding_score,
            total_score=total_score,
            percentage=percentage,
            status="EVALUATED",
            is_passed=is_passed,
            answers_json=payload.answers,
        )
        db.add(submission)
        await db.commit()
        await db.refresh(submission)
        return submission

    async def get_assessment_results(
        self,
        db: AsyncSession,
        college_id: int,
        assessment_id: int,
    ) -> List[Dict[str, Any]]:
        stmt = (
            select(CollegeAssessmentSubmission)
            .join(CollegeAssessment, CollegeAssessmentSubmission.assessment_id == CollegeAssessment.id)
            .where(CollegeAssessmentSubmission.assessment_id == assessment_id, CollegeAssessment.college_id == college_id)
            .options(selectinload(CollegeAssessmentSubmission.student))
            .order_by(CollegeAssessmentSubmission.total_score.desc())
        )
        res = await db.execute(stmt)
        submissions = res.scalars().all()

        results = []
        for rank, sub in enumerate(submissions, 1):
            results.append({
                "rank": rank,
                "submission_id": sub.id,
                "student_id": sub.student_id,
                "student_name": sub.student.full_name if sub.student else "Student",
                "student_email": sub.student.email if sub.student else "",
                "mcq_score": sub.mcq_score,
                "coding_score": sub.coding_score,
                "total_score": sub.total_score,
                "percentage": sub.percentage,
                "is_passed": sub.is_passed,
                "submitted_at": sub.submitted_at,
            })
        return results

    # =====================================================
    # 5. College Dashboard Analytics Engine
    # =====================================================

    async def get_college_dashboard(
        self,
        db: AsyncSession,
        user: User,
    ) -> Dict[str, Any]:
        college = await self.get_user_college(db, user)
        if not college:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="College record not found for your account. Please register your college first."
            )

        # Total Students
        stmt_st = select(func.count(CollegeStudent.id)).where(CollegeStudent.college_id == college.id)
        total_students = (await db.execute(stmt_st)).scalar() or 0

        stmt_active = (
            select(func.count(CollegeStudent.id))
            .join(User, User.id == CollegeStudent.user_id)
            .where(CollegeStudent.college_id == college.id, User.is_active.is_(True))
        )
        active_students = (await db.execute(stmt_active)).scalar() or 0

        # Departments
        depts = await self.list_departments(db, college.id)
        
        # Submissions for college
        stmt_subs = (
            select(CollegeAssessmentSubmission)
            .join(CollegeAssessment, CollegeAssessmentSubmission.assessment_id == CollegeAssessment.id)
            .where(CollegeAssessment.college_id == college.id)
        )
        res_subs = await db.execute(stmt_subs)
        submissions = res_subs.scalars().all()

        total_subs = len(submissions)
        passed_subs = sum(1 for s in submissions if s.is_passed)
        avg_score = round(sum(s.percentage for s in submissions) / total_subs, 1) if total_subs else 0.0
        pass_rate = round((passed_subs / total_subs) * 100.0, 1) if total_subs else 0.0
        participating_students = len({submission.student_id for submission in submissions})
        participation_rate = round((participating_students / total_students) * 100.0, 1) if total_students else 0.0

        # Department Analytics
        dept_analytics = []
        for d in depts:
            stmt_dept_students = select(func.count(CollegeStudent.id)).where(
                CollegeStudent.college_id == college.id,
                CollegeStudent.department_id == d.id,
            )
            dept_students = (await db.execute(stmt_dept_students)).scalar() or 0
            stmt_dept_submissions = (
                select(CollegeAssessmentSubmission)
                .join(CollegeStudent, CollegeStudent.user_id == CollegeAssessmentSubmission.student_id)
                .where(
                    CollegeAssessmentSubmission.assessment_id.in_(
                        select(CollegeAssessment.id).where(CollegeAssessment.college_id == college.id)
                    ),
                    CollegeStudent.college_id == college.id,
                    CollegeStudent.department_id == d.id,
                )
            )
            dept_submissions = (await db.execute(stmt_dept_submissions)).scalars().all()
            dept_total = len(dept_submissions)
            dept_passed = sum(1 for submission in dept_submissions if submission.is_passed)
            dept_analytics.append({
                "department_name": d.name,
                "total_students": dept_students,
                "avg_performance": round(sum(s.percentage for s in dept_submissions) / dept_total, 1) if dept_total else 0.0,
                "pass_rate": round((dept_passed / dept_total) * 100.0, 1) if dept_total else 0.0,
            })

        return {
            "college_name": college.name,
            "total_students": total_students,
            "active_students": active_students,
            "assessment_participation_rate": participation_rate,
            "average_performance_score": avg_score,
            "pass_rate": pass_rate,
            "skill_distribution": [],
            "weak_areas": [],
            "department_analytics": dept_analytics,
            "placement_prep_progress": 0.0,
        }


college_service = CollegeService()
