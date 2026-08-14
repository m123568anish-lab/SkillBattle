"""
=========================================================

SkillBattle

Resume Upload Schemas

=========================================================
"""

from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel
from pydantic import ConfigDict
from pydantic import Field


# =========================================================
# Resume Metadata
# =========================================================

class ResumeMetadata(BaseModel):

    filename: str

    content_type: str

    file_size: int

    uploaded_at: datetime

    model_config = ConfigDict(
        from_attributes=True,
    )


# =========================================================
# Upload Response
# =========================================================

class UploadResponse(BaseModel):

    success: bool = True

    message: str

    resume_id: str

    metadata: ResumeMetadata

    model_config = ConfigDict(
        from_attributes=True,
    )


# =========================================================
# Upload Status
# =========================================================

class UploadStatusResponse(BaseModel):

    resume_id: str

    upload_completed: bool

    parsing_completed: bool

    ai_processing_completed: bool

    ats_completed: bool

    placement_completed: bool

    progress: int = Field(
        ge=0,
        le=100,
    )

    current_step: str

    model_config = ConfigDict(
        from_attributes=True,
    )


# =========================================================
# Delete Response
# =========================================================

class DeleteResumeResponse(BaseModel):

    success: bool

    message: str


# =========================================================
# Resume Information
# =========================================================

class ResumeInfo(BaseModel):

    id: str

    title: str

    filename: str

    file_size: int

    uploaded_at: datetime

    ats_score: int | None = None

    placement_score: int | None = None

    parsed: bool

    ai_processed: bool

    model_config = ConfigDict(
        from_attributes=True,
    )