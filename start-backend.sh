#!/bin/bash

echo "Starting FarmIQ Backend Server..."
cd server

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
echo "Installing/updating dependencies..."
pip install -r requirements.txt --quiet
echo "Starting FastAPI server on http://localhost:8000"
echo "API Documentation: http://localhost:8000/docs"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

