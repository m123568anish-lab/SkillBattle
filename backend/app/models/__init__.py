from app.database.base import Base

from .achievement import Achievement
from .api_request_log import ApiRequestLog
from .campaign import UserCampaignProgress
from .campaign_attempt import CampaignAttempt
from .compiler import CodeSubmission
from .challenge import Challenge
from .daily_practice import DailyPracticeSession
from .conversation import Conversation
from .developer_api_key import DeveloperApiKey
from .developer_api_usage import DeveloperApiUsage
from .interview import InterviewAnswer, InterviewQuestion, InterviewSession
from .message import Message
from .problem import Problem
from .problem_starter_code import ProblemStarterCode
from .problem_tag import ProblemTag
from .problem_testcase import ProblemTestCase
from .profile import Profile
from .refresh_token import RefreshToken
from .password_reset_token import PasswordResetToken
from .resume import Resume
from .roadmap import Roadmap, RoadmapTask, RoadmapWeek
from .streak import Streak
from .user import User
from .question import Question, UserSubmission
from .question_exposure import QuestionExposure
from .user_stats import UserSettings, UserStats
from .matchmaking import MatchmakingMatch, PlacementPrepSession
from .placement_catalog import PlacementCompany, PlacementTrack, PlacementTrackRound
from .user_skill_stat import UserSkillStat
from .skill_intelligence import SkillEvidence, CompanySkillRequirement
from .quest_map import QuestMapLevel, QuestProgress
from .xp import XP, XPLedger
from .college import (
    College,
    Department,
    Batch,
    CollegeStudent,
    CollegeAssessment,
    CollegeAssessmentQuestion,
    CollegeAssessmentSubmission,
)
from .company import ApplicationStatusHistory, Company, CompanyMember, CandidateApplication, CandidatePrivacySettings, CompanyInterview, JobPosting, SavedOpportunity
from .battle import BattleConfig, BattleRoom, BattleParticipant, BattleSubmission, BattleResult
from .assessment_engine import UnifiedAssessment, AssessmentAttempt, AssessmentQuestionSubmission, StudentSkillProfile
from .notification import Notification
from app.modules.audit.model import AuditLog

__all__ = [
    "Base",
    "Achievement",
    "Challenge",
    "DailyPracticeSession",
    "CodeSubmission",
    "Conversation",
    "InterviewAnswer",
    "InterviewQuestion",
    "InterviewSession",
    "Message",
    "Problem",
    "ProblemStarterCode",
    "ProblemTag",
    "ProblemTestCase",
    "Profile",
    "RefreshToken",
    "PasswordResetToken",
    "Resume",
    "Roadmap",
    "RoadmapTask",
    "RoadmapWeek",
    "Streak",
    "User",
    "UserCampaignProgress",
    "CampaignAttempt",
    "Question",
    "QuestionExposure",
    "UserSubmission",
    "UserStats",
    "UserSettings",
    "MatchmakingMatch",
    "PlacementPrepSession",
    "PlacementCompany", "PlacementTrack", "PlacementTrackRound",
    "UserSkillStat",
    "SkillEvidence",
    "CompanySkillRequirement",
    "QuestMapLevel",
    "QuestProgress",
    "XP",
    "XPLedger",
    "College",
    "Department",
    "Batch",
    "CollegeStudent",
    "CollegeAssessment",
    "CollegeAssessmentQuestion",
    "CollegeAssessmentSubmission",
    "Company",
    "CompanyMember",
    "CandidatePrivacySettings",
    "JobPosting",
    "CandidateApplication",
    "SavedOpportunity",
    "ApplicationStatusHistory",
    "CompanyInterview",
    "Notification",
    "AuditLog",
    "BattleConfig",
    "BattleRoom",
    "BattleParticipant",
    "BattleSubmission",
    "BattleResult",
]
