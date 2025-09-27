@echo off
echo Setting up Python PDF Extraction Service...

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing dependencies...
pip install -r requirements.txt

echo Starting PDF Extraction Service on port 5000...
python pdf_extractor.py