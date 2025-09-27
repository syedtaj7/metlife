# MetLife Health Risk Assessment - ML Integration Setup

## Quick Start Guide

### 1. Start the Backend Services

Run the batch file to start both servers:
```
start_servers.bat
```

This will start:
- **PDF Extraction Server** on http://localhost:5000
- **ML Model Server** on http://localhost:5001

### 2. Start the Next.js Frontend

In a new terminal:
```
npm run dev
```

The frontend will be available at http://localhost:3000

### 3. How It Works

1. **Upload PDF**: User uploads medical report PDF
2. **Data Extraction**: Python service extracts structured medical data
3. **ML Analysis**: Data is sent to ML model for risk assessment
4. **Results Display**: User sees both extracted data and AI predictions

### 4. ML Model Features

The ML model analyzes:
- **Heart Attack Risk**: Based on cholesterol, BP, smoking, diabetes
- **Rule-based Assessments**: Additional risk factors analysis

### 5. Manual Testing

You can also test the ML model directly:

**Test ML API:**
```bash
curl -X POST http://localhost:5001/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test@example.com",
    "age": 45,
    "sex": 1,
    "total_cholesterol": 210.5,
    "ldl": 140.3,
    "hdl": 50.2,
    "systolic_bp": 125,
    "diastolic_bp": 82,
    "smoking": 1,
    "diabetes": 0,
    "heart_attack": 0
  }'
```

### 6. Data Flow

```
PDF Upload → PDF Extractor (Port 5000) → Next.js API → ML Model (Port 5001) → Results Display
```

### 7. Troubleshooting

- **ML Model Not Found**: Make sure `health_risk_model.joblib` and `heart_attack_model.joblib` are in the metlife-ai folder
- **Port Conflicts**: If ports are in use, update the port numbers in the respective files
- **Python Dependencies**: Install requirements using `pip install -r requirements.txt` in both folders

### 8. Environment Variables (Optional)

Add to your `.env.local`:
```
ML_MODEL_ENDPOINT=http://localhost:5001/api/predict
PYTHON_BACKEND_URL=http://localhost:5000
```