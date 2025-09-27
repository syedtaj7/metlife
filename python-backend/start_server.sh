#!/bin/bash
echo "Setting up Python PDF Extraction Service..."

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

echo "Starting PDF Extraction Service on port 5000..."
python pdf_extractor.py