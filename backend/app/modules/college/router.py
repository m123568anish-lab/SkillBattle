"""
=========================================================
SkillBattle - College / Placement Cell Platform Router
=========================================================
"""

from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.core.dependencies import get_current_admin, get_current_user
from app.models.user import User
from app.modules.college.schemas import (
    CollegeRegisterRequest,
    CollegeStatusRequest,
    CollegeResponse,
    DepartmentCreateRequest,
    DepartmentResponse,
    BatchCreateRequest,
    BatchResponse,
    AddStudentRequest,
    CollegeStudentResponse,
    AssessmentCreateRequest,
    AssessmentScheduleRequest,
    AssessmentResponse,
    SubmitAssessmentRequest,
    SubmissionResultResponse,
    CollegeDashboardResponse,
    CollegeCommandCenterResponse,
)
from app.modules.college.service import college_service

router = APIRouter(
    prefix="/college",
    tags=["College & Placement Cell Platform"],
)


# ==========================================================
# 1. Registration & Verification
# ==========================================================

@router.post("/register", response_model=CollegeResponse)
async def register_college(
    payload: CollegeRegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """Register a new institution/college and create its College Admin account."""
    return await college_service.register_college(db, payload)


@router.get("/admin/colleges/pending", response_model=List[CollegeResponse])
async def list_pending_colleges(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return await college_service.list_pending_colleges(db)


@router.patch("/admin/colleges/{college_id}/status", response_model=CollegeResponse)
async def update_college_status(
    college_id: int,
    payload: CollegeStatusRequest,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_admin),
):
    return await college_service.update_college_status(db, college_id, payload.status)


@router.get("/my-college", response_model=Optional[CollegeResponse])
async def get_my_college(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get college information associated with the current user."""
    return await college_service.get_user_college(db, current_user)


# ==========================================================
# 2. Departments & Batches (Staff / Admin RBAC)
# ==========================================================

@router.post("/department", response_model=DepartmentResponse)
async def create_department(
    payload: DepartmentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new department in the college."""
    role = getattr(current_user, "role", "user").lower()
    if role not in ["college_admin", "placement_officer", "admin"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="College staff permissions required.")

    college = await college_service.get_user_college(db, current_user)
    if not college:
        raise HTTPException(status_code=404, detail="College not found for your account.")

    return await college_service.create_department(db, college.id, payload)


@router.get("/department", response_model=List[DepartmentResponse])
async def list_departments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all departments in the current user's college."""
    college = await college_service.get_user_college(db, current_user)
    if not college:
        return []
    return await college_service.list_departments(db, college.id)


@router.post("/batch", response_model=BatchResponse)
async def create_batch(
    payload: BatchCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new student batch in the college."""
    role = getattr(current_user, "role", "user").lower()
    if role not in ["college_admin", "placement_officer", "admin"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="College staff permissions required.")

    college = await college_service.get_user_college(db, current_user)
    if not college:
        raise HTTPException(status_code=404, detail="College not found for your account.")

    return await college_service.create_batch(db, college.id, payload)


@router.get("/batch", response_model=List[BatchResponse])
async def list_batches(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all batches in the current user's college."""
    college = await college_service.get_user_college(db, current_user)
    if not college:
        return []
    return await college_service.list_batches(db, college.id)


# ==========================================================
# 3. Student Enrollment & Roster (Staff RBAC)
# ==========================================================

@router.post("/student/add", response_model=CollegeStudentResponse)
async def add_student(
    payload: AddStudentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Link a student account to the college, department, and batch."""
    role = getattr(current_user, "role", "user").lower()
    if role not in ["college_admin", "placement_officer", "faculty", "admin"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="College staff permissions required.")

    college = await college_service.get_user_college(db, current_user)
    if not college:
        raise HTTPException(status_code=404, detail="College not found for your account.")

    student_obj = await college_service.add_student(db, college.id, payload)
    
    # Return formatted response
    depts = {d.id: d.name for d in await college_service.list_departments(db, college.id)}
    batches = {b.id: b.name for b in await college_service.list_batches(db, college.id)}

    return CollegeStudentResponse(
        id=student_obj.id,
        college_id=student_obj.college_id,
        user_id=student_obj.user_id,
        username=student_obj.user.username if student_obj.user else "",
        full_name=student_obj.user.full_name if student_obj.user else "",
        email=student_obj.user.email if student_obj.user else "",
        roll_number=student_obj.roll_number,
        department_name=depts.get(student_obj.department_id, "N/A"),
        batch_name=batches.get(student_obj.batch_id, "N/A"),
        joined_at=student_obj.joined_at,
    )


@router.get("/students", response_model=List[CollegeStudentResponse])
async def list_students(
    department_id: Optional[int] = None,
    batch_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List enrolled students in the college. Restricted to college staff."""
    role = getattr(current_user, "role", "user").lower()
    if role not in ["college_admin", "placement_officer", "faculty", "admin"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="College staff permissions required. Students cannot access college rosters.")

    college = await college_service.get_user_college(db, current_user)
    if not college:
        return []

    return await college_service.list_students(db, college.id, department_id, batch_id)


# ==========================================================
# 4. Assessment Management (Placement Officer & Staff)
# ==========================================================

@router.post("/assessment", response_model=AssessmentResponse)
async def create_assessment(
    payload: AssessmentCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new placement assessment with MCQs and Coding questions."""
    role = getattr(current_user, "role", "user").lower()
    if role not in ["college_admin", "placement_officer", "faculty", "admin"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Placement Officer or Staff permissions required.")

    college = await college_service.get_user_college(db, current_user)
    if not college:
        raise HTTPException(status_code=404, detail="College not found for your account.")

    assessment = await college_service.create_assessment(db, current_user, college.id, payload)
    
    return AssessmentResponse(
        id=assessment.id,
        college_id=assessment.college_id,
        department_id=assessment.department_id,
        batch_id=assessment.batch_id,
        created_by_user_id=assessment.created_by_user_id,
        title=assessment.title,
        description=assessment.description,
        assessment_type=assessment.assessment_type,
        duration_minutes=assessment.duration_minutes,
        start_time=assessment.start_time,
        end_time=assessment.end_time,
        status=assessment.status,
        pass_marks=assessment.pass_marks,
        total_marks=assessment.total_marks,
        created_at=assessment.created_at,
        questions_count=len(assessment.questions),
    )


@router.post("/assessment/{assessment_id}/schedule", response_model=AssessmentResponse)
async def schedule_assessment(
    assessment_id: int,
    payload: AssessmentScheduleRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Schedule and assign an assessment to a target department/batch."""
    role = getattr(current_user, "role", "user").lower()
    if role not in ["college_admin", "placement_officer", "admin"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="Placement Officer privileges required.")

    college = await college_service.get_user_college(db, current_user)
    if not college:
        raise HTTPException(status_code=404, detail="College not found.")

    assessment = await college_service.schedule_assessment(db, college.id, assessment_id, payload)
    
    return AssessmentResponse(
        id=assessment.id,
        college_id=assessment.college_id,
        department_id=assessment.department_id,
        batch_id=assessment.batch_id,
        created_by_user_id=assessment.created_by_user_id,
        title=assessment.title,
        description=assessment.description,
        assessment_type=assessment.assessment_type,
        duration_minutes=assessment.duration_minutes,
        start_time=assessment.start_time,
        end_time=assessment.end_time,
        status=assessment.status,
        pass_marks=assessment.pass_marks,
        total_marks=assessment.total_marks,
        created_at=assessment.created_at,
        questions_count=len(assessment.questions),
    )


@router.get("/assessment/list", response_model=List[AssessmentResponse])
async def list_assessments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all assessments created for the user's college."""
    college = await college_service.get_user_college(db, current_user)
    if not college:
        return []

    assessments = await college_service.list_college_assessments(db, college.id)
    return [
        AssessmentResponse(
            id=a.id,
            college_id=a.college_id,
            department_id=a.department_id,
            batch_id=a.batch_id,
            created_by_user_id=a.created_by_user_id,
            title=a.title,
            description=a.description,
            assessment_type=a.assessment_type,
            duration_minutes=a.duration_minutes,
            start_time=a.start_time,
            end_time=a.end_time,
            status=a.status,
            pass_marks=a.pass_marks,
            total_marks=a.total_marks,
            created_at=a.created_at,
            questions_count=len(a.questions),
        ) for a in assessments
    ]


@router.get("/assessment/{assessment_id}/results")
async def get_assessment_results(
    assessment_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """View student results & rank list for a specific assessment. Restricted to college staff."""
    role = getattr(current_user, "role", "user").lower()
    if role not in ["college_admin", "placement_officer", "faculty", "admin"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="College staff permissions required.")

    college = await college_service.get_user_college(db, current_user)
    if not college:
        raise HTTPException(status_code=404, detail="College not found.")

    return await college_service.get_assessment_results(db, college.id, assessment_id)


# ==========================================================
# 5. Student Portal Endpoints (Student RBAC)
# ==========================================================

@router.get("/student/my-assessments")
async def get_my_assigned_assessments(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get college assessments assigned to the current student."""
    assessments = await college_service.get_student_assigned_assessments(db, current_user)
    return [
        {
            "id": assessment.id,
            "college_id": assessment.college_id,
            "department_id": assessment.department_id,
            "batch_id": assessment.batch_id,
            "title": assessment.title,
            "description": assessment.description,
            "assessment_type": assessment.assessment_type,
            "duration_minutes": assessment.duration_minutes,
            "start_time": assessment.start_time,
            "end_time": assessment.end_time,
            "status": assessment.status,
            "pass_marks": assessment.pass_marks,
            "total_marks": assessment.total_marks,
            "created_at": assessment.created_at,
            "questions_count": len(assessment.questions),
            "questions": [
                {
                    "id": question.id,
                    "question_type": question.question_type,
                    "skill_category": question.skill_category,
                    "question_text": question.question_text,
                    "options": question.options_json or [],
                    "coding_starter_code": question.coding_starter_code or "",
                    "marks": question.marks,
                }
                for question in assessment.questions
            ],
        }
        for assessment in assessments
    ]


@router.post("/student/assessment/submit", response_model=SubmissionResultResponse)
async def submit_assessment(
    payload: SubmitAssessmentRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Student submits answers for an assigned assessment."""
    sub = await college_service.submit_assessment(db, current_user, payload)
    return SubmissionResultResponse(
        submission_id=sub.id,
        assessment_id=sub.assessment_id,
        student_id=sub.student_id,
        mcq_score=sub.mcq_score,
        coding_score=sub.coding_score,
        total_score=sub.total_score,
        percentage=sub.percentage,
        is_passed=sub.is_passed,
        status=sub.status,
        submitted_at=sub.submitted_at,
    )


# ==========================================================
# 6. College Dashboard Analytics (Staff RBAC)
# ==========================================================

@router.get("/dashboard", response_model=CollegeDashboardResponse)
async def get_college_dashboard(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch complete College Placement Cell Dashboard & Analytics. Restricted to college staff."""
    role = getattr(current_user, "role", "user").lower()
    if role not in ["college_admin", "placement_officer", "faculty", "admin"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="College staff permissions required. Students cannot access college dashboard analytics.")

    return await college_service.get_college_dashboard(db, current_user)


@router.get("/command-center", response_model=CollegeCommandCenterResponse)
async def get_college_command_center(
    department_id: Optional[int] = None,
    batch_id: Optional[int] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the organization-level command center using persisted cohort evidence."""
    role = getattr(current_user, "role", "user").lower()
    if role not in ["college_admin", "placement_officer", "faculty", "admin"] and not current_user.is_superuser:
        raise HTTPException(status_code=403, detail="College staff permissions required.")

    return await college_service.get_college_command_center(db, current_user, department_id=department_id, batch_id=batch_id)
