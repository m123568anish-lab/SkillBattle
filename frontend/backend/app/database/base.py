"""
=========================================================

SkillBattle

Database Base

Shared SQLAlchemy declarative base.

=========================================================
"""

from __future__ import annotations

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase

# ---------------------------------------------------------
# Naming Convention
#
# Prevents migration issues and keeps database objects
# consistently named across PostgreSQL and SQLite.
# ---------------------------------------------------------

NAMING_CONVENTION = {

    "ix": "ix_%(column_0_label)s",

    "uq": "uq_%(table_name)s_%(column_0_name)s",

    "ck": "ck_%(table_name)s_%(constraint_name)s",

    "fk": (
        "fk_%(table_name)s_"
        "%(column_0_name)s_"
        "%(referred_table_name)s"
    ),

    "pk": "pk_%(table_name)s",

}

metadata = MetaData(

    naming_convention=NAMING_CONVENTION,

)


class Base(DeclarativeBase):

    """
    Base class for every ORM model.
    """

    metadata = metadata