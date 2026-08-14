@echo off
setlocal
call .venv\Scripts\activate.bat
if exist .env (
    echo Loading .env
) else (
    echo No .env found. Using defaults.
)
uvicorn app.main:app --host 0.0.0.0 --port 8000
