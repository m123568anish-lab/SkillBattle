from fastapi import (
    APIRouter,
    Depends,
)

from sqlalchemy.orm import Session

from app.database.database import get_db

from app.models.user import User

from app.core.security import get_current_user

from app.modules.compiler.schemas import (
    RunCodeRequest,
    SubmitCodeRequest,
)
from app.modules.compiler.executors.diagnostics import (
    compiler_diagnostics,
)
from app.modules.compiler.service import compiler_service

from app.modules.compiler.executors.manager import (
    execution_manager,
)

router = APIRouter(
    prefix="/compiler",
    tags=["Compiler V2"],
)

# ==========================================================
# Health Check
# ==========================================================

@router.get("/health")
def health():

    return {

        "status": "healthy",

        "engine": "ExecutionManager",

        "version": "2.0",

        "diagnostics":

            compiler_diagnostics.report(),

    }


# ==========================================================
# Supported Languages
# ==========================================================

@router.get("/languages")
def supported_languages():

    diagnostics = compiler_diagnostics.report()

    supported = []

    if diagnostics["python"]["installed"]:
        supported.append("python")

    if diagnostics["gcc"]["installed"]:
        supported.append("c")

    if diagnostics["g++"]["installed"]:
        supported.append("cpp")

    if diagnostics["java"]["installed"]:
        supported.append("java")

    if diagnostics["node"]["installed"]:
        supported.append("javascript")

    return {

        "languages": supported,

        "diagnostics": diagnostics,

    }


# ==========================================================
# Run Code
# ==========================================================

@router.post("/run")
def run_code(
    request: RunCodeRequest,
):

    return compiler_service.run_code(
        request,
    )


# ==========================================================
# Submit Solution
# ==========================================================

@router.post("/submit")
def submit_solution(
    request: SubmitCodeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return compiler_service.submit_solution(
        db,
        current_user,
        request,
    )


# ==========================================================
# Problems
# ==========================================================

@router.get("/problems")
def get_problems(
    db: Session = Depends(get_db),
):

    return compiler_service.get_problems(db)


# ==========================================================
# Problem
# ==========================================================

@router.get("/problem/{problem_id}")
def get_problem(
    problem_id: int,
    db: Session = Depends(get_db),
):

    return compiler_service.get_problem(
        db,
        problem_id,
    )


# ==========================================================
# History
# ==========================================================

@router.get("/history")
def history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return compiler_service.get_submission_history(
        db,
        current_user,
    )


# ==========================================================
# Submission
# ==========================================================

@router.get("/submission/{submission_id}")
def submission(
    submission_id: int,
    db: Session = Depends(get_db),
):

    return compiler_service.get_submission(
        db,
        submission_id,
    )


# ==========================================================
# Statistics
# ==========================================================

@router.get("/statistics")
def statistics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    return compiler_service.get_statistics(
        db,
        current_user,
    )