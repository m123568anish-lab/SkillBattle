"""
=========================================================

Compiler Parser

=========================================================
"""

from __future__ import annotations


def parse_error(stderr: str) -> dict:

    stderr = stderr.strip()

    if not stderr:

        return {

            "type": None,

            "message": "",

        }

    lower = stderr.lower()

    if "syntaxerror" in lower:

        return {

            "type": "Syntax Error",

            "message": stderr,

        }

    if "segmentation" in lower:

        return {

            "type": "Segmentation Fault",

            "message": stderr,

        }

    if "exception" in lower:

        return {

            "type": "Runtime Exception",

            "message": stderr,

        }

    return {

        "type": "Compiler Error",

        "message": stderr,

    }