"""
=========================================================

SkillBattle

Structured Logger

=========================================================
"""

from __future__ import annotations

import logging
import sys


def configure_logger():

    logger = logging.getLogger("skillbattle")

    logger.setLevel(logging.INFO)

    formatter = logging.Formatter(

        "%(asctime)s | %(levelname)s | %(name)s | %(message)s"

    )

    console = logging.StreamHandler(sys.stdout)

    console.setFormatter(formatter)

    logger.handlers.clear()

    logger.addHandler(console)

    return logger


logger = configure_logger()