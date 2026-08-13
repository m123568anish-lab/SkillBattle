"""
=========================================================
SkillBattle Supported Languages
=========================================================
"""

from dataclasses import dataclass
from typing import Dict, Optional


@dataclass(frozen=True)
class Language:
    """
    Metadata describing a supported programming language.
    """

    id: str
    name: str

    extension: str

    compiled: bool

    compiler: Optional[str]
    runner: str

    version_command: str

    default_template: str

    time_limit: int = 5
    memory_limit: int = 256


SUPPORTED_LANGUAGES: Dict[str, Language] = {

    "python": Language(

        id="python",

        name="Python",

        extension=".py",

        compiled=False,

        compiler=None,

        runner="python",

        version_command="python --version",

        default_template="""
print("Hello SkillBattle!")
""",

    ),

    "cpp": Language(

        id="cpp",

        name="C++",

        extension=".cpp",

        compiled=True,

        compiler="cl",

        runner="",

        version_command="cl",

        default_template=r"""
#include <iostream>

using namespace std;

int main()
{
    cout << "Hello SkillBattle!" << endl;
    return 0;
}
""",

    ),

    "c": Language(

        id="c",

        name="C",

        extension=".c",

        compiled=True,

        compiler="cl",

        runner="",

        version_command="cl",

        default_template=r"""
#include <stdio.h>

int main()
{
    printf("Hello SkillBattle!\n");
    return 0;
}
""",

    ),

    "java": Language(

        id="java",

        name="Java",

        extension=".java",

        compiled=True,

        compiler="javac",

        runner="java",

        version_command="java -version",

        default_template="""
public class Main {

    public static void main(String[] args) {

        System.out.println("Hello SkillBattle!");

    }

}
""",

    ),

    "javascript": Language(

        id="javascript",

        name="JavaScript",

        extension=".js",

        compiled=False,

        compiler=None,

        runner="node",

        version_command="node --version",

        default_template="""
console.log("Hello SkillBattle!");
""",

    ),

}


def get_language(language: str) -> Language:
    """
    Returns metadata for a language.
    """

    language = language.lower()

    if language not in SUPPORTED_LANGUAGES:

        raise ValueError(
            f"Unsupported language: {language}"
        )

    return SUPPORTED_LANGUAGES[language]


def is_supported(language: str) -> bool:

    return language.lower() in SUPPORTED_LANGUAGES


def all_languages():

    return list(
        SUPPORTED_LANGUAGES.values()
    )