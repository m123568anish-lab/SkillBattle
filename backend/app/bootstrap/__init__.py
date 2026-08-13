"""
=========================================================

SkillBattle

Bootstrap Package

=========================================================
"""

from .register_routers import register_all_routers
from .register_middlewares import register_all_middlewares
from .startup import startup
from .shutdown import shutdown

__all__ = [
    "register_all_routers",
    "register_all_middlewares",
    "startup",
    "shutdown",
]