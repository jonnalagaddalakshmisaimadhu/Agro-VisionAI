@echo off
title Agro-VisionAI Starter

echo Starting Agro-VisionAI Project...
echo =================================

echo [1/2] Starting Backend Server...
start "Agro-VisionAI Backend" cmd /k "cd Backend && venv\Scripts\python main.py"

echo [2/2] Starting Frontend Server...
start "Agro-VisionAI Frontend" cmd /k "cd Frontend && npm run dev"

echo.
echo Project started! Two new terminal windows have been opened.
echo Backend running on http://127.0.0.1:8000
echo Frontend running on http://localhost:8080
pause
