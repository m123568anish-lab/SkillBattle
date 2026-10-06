"""
=========================================================

SkillBattle

Bootstrap Package

=========================================================
"""

try:
    from .register_routers import register_all_routers
except Exception:  # pragma: no cover - optional runtime integration modules may be absent
    register_all_routers = None

try:
    from .register_middlewares import register_all_middlewares
except Exception:  # pragma: no cover - optional runtime integration modules may be absent
    register_all_middlewares = None

try:
    from .startup import startup
except Exception:  # pragma: no cover - optional runtime integration modules may be absent
    startup = None

try:
    from .shutdown import shutdown
except Exception:  # pragma: no cover - optional runtime integration modules may be absent
    shutdown = None

__all__ = [
    "register_all_routers",
    "register_all_middlewares",
    "startup",
    "shutdown",
]