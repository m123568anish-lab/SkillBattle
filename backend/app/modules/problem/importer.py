"""
=========================================================

Problem Importer

=========================================================
"""

from __future__ import annotations

import json


class ProblemImporter:

    def import_json(self, path: str):

        with open(path, "r", encoding="utf-8") as file:

            return json.load(file)


problem_importer = ProblemImporter()