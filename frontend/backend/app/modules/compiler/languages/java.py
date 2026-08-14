"""
=========================================================

Java Configuration

=========================================================
"""

JAVA = {

    "id": "java",

    "name": "Java",

    "version": "21",

    "extension": ".java",

    "image": "eclipse-temurin:21",

    "compile": [

        "javac",

        "/workspace/Main.java",

    ],

    "run": [

        "java",

        "-cp",

        "/workspace",

        "Main",

    ],

    "timeout": 3,

    "memory": 512,

}