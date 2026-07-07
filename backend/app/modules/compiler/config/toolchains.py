"""
=========================================================
SkillBattle Toolchain Configuration
=========================================================

Detects installed compilers and runtimes.

Nothing else in the compiler should call
shutil.which() directly.

=========================================================
"""

from __future__ import annotations

import platform
import shutil
import subprocess
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass(frozen=True)
class Toolchain:
    """
    Represents one compiler/runtime.
    """

    name: str

    executable: str

    version_command: list[str]

    installed: bool

    path: Optional[str]

    version: Optional[str]


def _find(executable: str) -> Optional[str]:
    """
    Returns executable path or None.
    """

    return shutil.which(executable)


def _version(command: list[str]) -> Optional[str]:
    """
    Reads tool version.
    """

    try:

        result = subprocess.run(

            command,

            capture_output=True,

            text=True,

            timeout=5,

        )

        output = result.stdout.strip()

        if not output:

            output = result.stderr.strip()

        return output

    except Exception:

        return None


def _create(
    name: str,
    executable: str,
    version_command: list[str],
) -> Toolchain:

    path = _find(executable)

    if path is None:

        return Toolchain(

            name=name,

            executable=executable,

            version_command=version_command,

            installed=False,

            path=None,

            version=None,

        )

    return Toolchain(

        name=name,

        executable=executable,

        version_command=version_command,

        installed=True,

        path=path,

        version=_version(version_command),

    )


TOOLCHAINS: Dict[str, Toolchain] = {

    "python":

        _create(

            "Python",

            "python",

            ["python", "--version"],

        ),

    "cpp":

        _create(

            "Microsoft C++",

            "cl",

            ["cl"],

        ),

    "c":

        _create(

            "Microsoft C",

            "cl",

            ["cl"],

        ),

    "java":

        _create(

            "Java",

            "java",

            ["java", "-version"],

        ),

    "javac":

        _create(

            "Java Compiler",

            "javac",

            ["javac", "-version"],

        ),

    "javascript":

        _create(

            "Node.js",

            "node",

            ["node", "--version"],

        ),

}


def detect_toolchains() -> Dict[str, Toolchain]:
    """
    Returns all detected toolchains.
    """

    return TOOLCHAINS


def get_toolchain(name: str) -> Toolchain:

    name = name.lower()

    if name not in TOOLCHAINS:

        raise ValueError(

            f"Unknown toolchain: {name}"

        )

    return TOOLCHAINS[name]


def installed_languages():

    return [

        name

        for name, tool in TOOLCHAINS.items()

        if tool.installed

    ]


def print_report():

    print("\n========== SkillBattle Toolchains ==========\n")

    print(f"Operating System : {platform.system()}")

    print(f"Platform         : {platform.platform()}")

    print()

    for name, tool in TOOLCHAINS.items():

        status = "✓ Installed" if tool.installed else "✗ Missing"

        print(f"{name:12} : {status}")

        if tool.installed:

            print(f"  Path    : {tool.path}")

            print(f"  Version : {tool.version}")

            print()