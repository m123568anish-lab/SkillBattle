"""
=========================================================

SkillBattle

Language Registry

=========================================================
"""

from .python import PYTHON
from .cpp import CPP
from .java import JAVA
from .javascript import JAVASCRIPT

LANGUAGES = {
    PYTHON["id"]: PYTHON,
    CPP["id"]: CPP,
    JAVA["id"]: JAVA,
    JAVASCRIPT["id"]: JAVASCRIPT,
}