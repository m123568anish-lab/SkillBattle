"""
=========================================================
SkillBattle - College Platform Schemas
=========================================================
"""

from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, EmailStr


# ==========================================================
# 1. College Registration & Response
# ==========================================================

class CollegeRegisterRequest(BaseModel):
    name: str = Field(..., example="IIT Delhi")
    code: str = Field(..., example="IITD")
    domain: Optional[str] = Field(default="", example="iitd.ac.in")
    city: Optional[str] = Field(default="", example="New Delhi")
    state: Optional[str] = Field(default="", example="Delhi")
    admin_name: str = Field(..., example="Dr. Rajesh Kumar")
    admin_email: EmailStr = Field(..., example="placement@iitd.ac.in")
    admin_password: str = Field(..., example="CollegeAdmin#123")


class CollegeStatusRequest(BaseModel):
    status: str = Field(..., pattern="^(verified|rejected)$")


class CollegeResponse(BaseModel):
    id: int
    name: str
    code: str
    domain: str
    city: str
    state: str
    is_verified: bool
    admin_user_id: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================================
# 2. Departments & Batches
# ==========================================================

class DepartmentCreateRequest(BaseModel):
    name: str = Field(..., example="Computer Science & Engineering")
    code: str = Field(..., example="CSE")
    head_name: Optional[str] = Field(default="", example="Prof. Sharma")


class DepartmentResponse(BaseModel):
    id: int
    college_id: int
    name: str
    code: str
    head_name: str
    created_at: datetime

    class Config:
        from_attributes = True


class BatchCreateRequest(BaseModel):
    department_id: Optional[int] = None
    name: str = Field(..., example="Batch 2023-2027")
    passout_year: int = Field(default=2027, example=2027)


class BatchResponse(BaseModel):
    id: int
    college_id: int
    department_id: Optional[int] = None
    name: str
    passout_year: int
    created_at: datetime

    class Config:
        from_attributes = True


# ==========================================================
# 3. Student Link / Roster
# ==========================================================

class AddStudentRequest(BaseModel):
    user_email_or_username: str = Field(..., example="student1@iitd.ac.in")
    department_id: Optional[int] = None
    batch_id: Optional[int] = None
    roll_number: Optional[str] = Field(default="", example="2023CSE1001")


class CollegeStudentResponse(BaseModel):
    id: int
    college_id: int
    user_id: str
    username: str
    full_name: str
    email: str
    roll_number: str
    department_name: Optional[str] = None
    batch_name: Optional[str] = None
    joined_at: datetime


# ==========================================================
# 4. Assessments Management
# ==========================================================

class AssessmentQuestionCreate(BaseModel):
    question_type: str = Field(default="MCQ", example="MCQ")  # MCQ or CODING
    skill_category: str = Field(default="General", min_length=1, max_length=100)
    question_text: str = Field(..., example="What is the time complexity of QuickSort average case?")
    options: List[str] = Field(default_factory=list, example=["O(N log N)", "O(N^2)", "O(N)", "O(1)"])
    correct_option: str = Field(default="", example="O(N log N)")
    coding_starter_code: Optional[str] = Field(default="")
    test_cases: List[Dict[str, Any]] = Field(default_factory=list)
    marks: int = Field(default=10, example=10)


class AssessmentCreateRequest(BaseModel):
    department_id: Optional[int] = None
    batch_id: Optional[int] = None
    title: str = Field(..., example="Placement Speedrun Assessment - Batch 2027")
    description: Optional[str] = Field(default="", example="Comprehensive Technical & Aptitude Test")
    assessment_type: str = Field(default="HYBRID", example="HYBRID")
    duration_minutes: int = Field(default=60, example=60)
    pass_marks: int = Field(default=50, example=50)
    total_marks: int = Field(default=100, example=100)
    questions: List[AssessmentQuestionCreate] = Field(default_factory=list)


class AssessmentScheduleRequest(BaseModel):
    start_time: datetime = Field(..., example="2026-10-01T09:00:00Z")
    end_time: datetime = Field(..., example="2026-10-01T18:00:00Z")
    department_id: Optional[int] = None
    batch_id: Optional[int] = None


class AssessmentResponse(BaseModel):
    id: int
    college_id: int
    department_id: Optional[int] = None
    batch_id: Optional[int] = None
    created_by_user_id: str
    title: str
    description: str
    assessment_type: str
    duration_minutes: int
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    status: str
    pass_marks: int
    total_marks: int
    created_at: datetime
    questions_count: int = 0

    class Config:
        from_attributes = True


class SubmitAssessmentRequest(BaseModel):
    assessment_id: int
    answers: Dict[str, Any] = Field(..., example={"q_1": "O(N log N)", "q_2_code": "def solve(): pass"})


class SubmissionResultResponse(BaseModel):
    submission_id: int
    assessment_id: int
    student_id: str
    mcq_score: float
    coding_score: float
    total_score: float
    percentage: float
    is_passed: bool
    status: str
    submitted_at: datetime


# ==========================================================
# 5. College Dashboard Analytics
# ==========================================================

class SkillDistributionItem(BaseModel):
    skill: str
    average_score: float


class DepartmentAnalyticsItem(BaseModel):
    department_name: str
    total_students: int
    avg_performance: float
    pass_rate: float


class CollegeDashboardResponse(BaseModel):
    college_name: str
    total_students: int
    active_students: int
    assessment_participation_rate: float
    average_performance_score: float
    pass_rate: float
    skill_distribution: List[SkillDistributionItem]
    weak_areas: List[str]
    department_analytics: List[DepartmentAnalyticsItem]
    placement_prep_progress: float
