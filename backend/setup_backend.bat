@echo off
rem Create virtual environment if not exists
if not exist ".venv" (
    python -m venv .venv
)
rem Activate virtual environment
call .venv\Scripts\activate.bat
rem Upgrade pip
python -m pip install --upgrade pip
rem Install requirements
pip install -r requirements.txt
rem Launch the backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
