@echo off
echo Starting FarmIQ Backend Server...
cd server
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate
echo Installing/updating dependencies...
pip install -r requirements.txt --quiet
echo Starting FastAPI server on http://localhost:8000
echo API Documentation: http://localhost:8000/docs
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause

