import requests
import os
from sqlalchemy import select

from app.core.config import get_settings
from app.database.database import SessionLocal
from app.models.college import Batch, College, CollegeStudent, Department
from app.models.company import Company, CompanyMember, JobPosting
from app.models.user import User

settings = get_settings()
if settings.ENVIRONMENT.strip().lower() == "production":
    raise SystemExit("Demo account seeding is disabled in production.")

API_URL = os.getenv("SKILLBATTLE_API_URL", "http://localhost:8000").rstrip("/")

ACCOUNTS = [
    {
        "username": "platformadmin",
        "email": "platformadmin@skillbattle.app",
        "full_name": "Platform Admin",
        "password": "StrongPass123!",
        "account_type": "STUDENT",
        "role": "admin",
        "is_superuser": 1,
        "status": "ACTIVE",
        "account_type_db": "STUDENT",
    },
    {
        "username": "collegeadmin",
        "email": "collegeadmin@skillbattle.app",
        "full_name": "College Admin",
        "password": "StrongPass123!",
        "account_type": "COLLEGE",
        "role": "college_admin",
        "is_superuser": 0,
        "status": "ACTIVE",
        "account_type_db": "COLLEGE",
    },
    {
        "username": "companyadmin",
        "email": "companyadmin@skillbattle.app",
        "full_name": "Company Admin",
        "password": "StrongPass123!",
        "account_type": "COMPANY",
        "role": "company_admin",
        "is_superuser": 0,
        "status": "ACTIVE",
        "account_type_db": "COMPANY",
    },
    {
        "username": "studentdemo",
        "email": "studentdemo@skillbattle.app",
        "full_name": "Student Demo",
        "password": "StrongPass123!",
        "account_type": "STUDENT",
        "role": "student",
        "is_superuser": 0,
        "status": "ACTIVE",
        "account_type_db": "STUDENT",
    },
]


def ensure_account(payload):
    r = requests.post(f"{API_URL}/auth/register", json={
        "username": payload["username"],
        "email": payload["email"],
        "full_name": payload["full_name"],
        "password": payload["password"],
        "account_type": payload["account_type"],
    }, timeout=25)
    print(f"REGISTER {payload['email']} -> {r.status_code}")
    if r.status_code not in (201, 409):
        raise SystemExit(f"Account registration failed for {payload['email']} with HTTP {r.status_code}.")
    return r


for payload in ACCOUNTS:
    ensure_account(payload)

session = SessionLocal()
try:
    users = {}
    for payload in ACCOUNTS:
        user = session.scalar(select(User).where(User.email == payload["email"]))
        if user is None:
            raise RuntimeError(f"Registered demo account {payload['email']} is missing from the configured database.")
        user.role = payload["role"]
        user.account_type = payload["account_type_db"]
        user.status = payload["status"]
        user.is_active = True
        user.is_verified = True
        user.is_superuser = bool(payload["is_superuser"])
        user.requested_role = None
        user.onboarding_completed = True
        users[payload["role"]] = user

    college_admin = users["college_admin"]
    college = session.scalar(select(College).where(College.code == "SKBDEMO"))
    if college is None:
        linked_college = session.scalar(select(College).where(College.admin_user_id == college_admin.id))
        if linked_college:
            raise RuntimeError("College Admin is already linked to a different college; refusing to reassign it.")
        college = College(
            name="SkillBattle Demo College",
            code="SKBDEMO",
            domain="skillbattle.app",
            city="Demo City",
            state="Demo State",
            is_verified=True,
            admin_user_id=college_admin.id,
        )
        session.add(college)
        session.flush()
    else:
        college.name = "SkillBattle Demo College"
        college.is_verified = True
        college.admin_user_id = college_admin.id

    department = session.scalar(
        select(Department).where(Department.college_id == college.id, Department.code == "CSE")
    )
    if department is None:
        department = Department(college_id=college.id, name="Computer Science", code="CSE")
        session.add(department)
        session.flush()

    batch = session.scalar(
        select(Batch).where(Batch.college_id == college.id, Batch.name == "Demo Cohort 2027")
    )
    if batch is None:
        batch = Batch(college_id=college.id, department_id=department.id, name="Demo Cohort 2027", passout_year=2027)
        session.add(batch)
        session.flush()

    student = users["student"]
    student_membership = session.scalar(select(CollegeStudent).where(CollegeStudent.user_id == student.id))
    if student_membership and student_membership.college_id != college.id:
        raise RuntimeError("Student Demo is already enrolled at a different college; refusing to reassign it.")
    if student_membership is None:
        session.add(
            CollegeStudent(
                college_id=college.id,
                user_id=student.id,
                department_id=department.id,
                batch_id=batch.id,
                roll_number="DEMO-001",
            )
        )
    else:
        student_membership.department_id = department.id
        student_membership.batch_id = batch.id
        student_membership.roll_number = "DEMO-001"

    company_admin = users["company_admin"]
    company = session.scalar(select(Company).where(Company.slug == "skillbattle-demo"))
    if company is None:
        company = Company(
            name="SkillBattle Demo Company",
            slug="skillbattle-demo",
            industry="Software",
            website="https://skillbattle.app",
            headquarters="Remote",
            description="Development-only organization for validating the hiring workflow.",
            status="verified",
            created_by_user_id=company_admin.id,
        )
        session.add(company)
        session.flush()
    else:
        company.name = "SkillBattle Demo Company"
        company.industry = "Software"
        company.status = "verified"
        company.created_by_user_id = company_admin.id

    company_membership = session.scalar(
        select(CompanyMember).where(CompanyMember.user_id == company_admin.id)
    )
    if company_membership and company_membership.company_id != company.id:
        raise RuntimeError("Company Admin is already linked to a different company; refusing to reassign it.")
    if company_membership is None:
        session.add(CompanyMember(company_id=company.id, user_id=company_admin.id, role="company_admin", status="active"))
    else:
        company_membership.role = "company_admin"
        company_membership.status = "active"

    demo_job = session.scalar(
        select(JobPosting).where(JobPosting.company_id == company.id, JobPosting.title == "Demo Software Engineer")
    )
    if demo_job is None:
        session.add(
            JobPosting(
                company_id=company.id,
                created_by_user_id=company_admin.id,
                title="Demo Software Engineer",
                location="Remote",
                employment_type="full_time",
                remote_allowed=True,
                description="Development-only opening for verifying the hiring workflow.",
                required_skills="Python, SQL",
                status="open",
            )
        )

    session.commit()
except Exception:
    session.rollback()
    raise
finally:
    session.close()

for payload in ACCOUNTS:
    r = requests.post(f"{API_URL}/auth/login", json={
        "email": payload["email"],
        "password": payload["password"],
        "role": payload["role"].upper(),
    }, timeout=25)
    print(f"LOGIN {payload['email']} -> {r.status_code}")
    if r.status_code != 200:
        raise SystemExit(f"Demo login verification failed for {payload['email']} with HTTP {r.status_code}.")

print("\nDemo accounts ready:")
for payload in ACCOUNTS:
    print(f"{payload['role']}: {payload['email']} / {payload['password']}")

