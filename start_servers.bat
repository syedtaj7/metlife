@echo off
echo Starting MetLife Health Risk Assessment System...
echo.

echo Starting PDF Extraction Server (Port 5000)...
start "PDF Extractor" cmd /k "cd python-backend && python pdf_extractor.py"

timeout /t 3 /nobreak >nul

echo Starting ML Model Server (Port 5001)...
start "ML Model" cmd /k "cd metlife-ai && python -m flask run --host=0.0.0.0 --port=5001"

echo.
echo Both servers are starting...
echo PDF Extraction Server: http://localhost:5000
echo ML Model Server: http://localhost:5001
echo.
echo Press any key to close this window...
pause >nul