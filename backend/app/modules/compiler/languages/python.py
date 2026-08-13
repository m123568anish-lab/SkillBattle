"""
=========================================================

Python Configuration

=========================================================
"""

PYTHON = {

    "id": "python",

    "name": "Python",

    "version": "3.12",

    "extension": ".py",

    "image": "python:3.12-slim",

    "compile": None,

    "run": [
        "python",
        "/workspace/Main.py",
    ],

    "timeout": 2,

    "memory": 256,

}