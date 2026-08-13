"""
=========================================================

C++ Configuration

=========================================================
"""

CPP = {

    "id": "cpp",

    "name": "C++",

    "version": "GCC 13",

    "extension": ".cpp",

    "image": "gcc:13",

    "compile": [

        "g++",

        "-O2",

        "-std=c++20",

        "/workspace/Main.cpp",

        "-o",

        "/workspace/Main",

    ],

    "run": [

        "/workspace/Main",

    ],

    "timeout": 2,

    "memory": 256,

}