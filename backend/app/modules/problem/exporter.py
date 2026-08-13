"""
=========================================================

Problem Exporter

=========================================================
"""

from __future__ import annotations

import json


class ProblemExporter:

    def export_json(
        self,
        problem: dict,
        path: str,
    ):

        with open(path, "w", encoding="utf-8") as file:

            json.dump(
                problem,
                file,
                indent=4,
            )


problem_exporter = ProblemExporter()