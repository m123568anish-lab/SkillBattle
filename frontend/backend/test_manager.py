from app.modules.compiler.executors.manager import (
    execution_manager,
)

result = execution_manager.execute(

    language="python",

    source_code="""
print("SkillBattle")
""",

)

print(result)