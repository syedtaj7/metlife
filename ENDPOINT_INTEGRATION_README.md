# RiskModel Data Extraction & Endpoint Integration

This system extracts cardiovascular risk assessment data from PDF medical reports and sends it to a configurable endpoint for processing.

## 🎯 Extracted Data Fields (RiskModel)

```typescript
interface RiskModelData {
  user_id: string | null;           // User email address
  sex: number | null;               // 0 = Female, 1 = Male
  total_cholesterol: number | null; // mg/dL
  ldl: number | null;               // mg/dL (Low-density lipoprotein)
  hdl: number | null;               // mg/dL (High-density lipoprotein)  
  systolic_bp: number | null;       // mmHg (Systolic blood pressure)
  diastolic_bp: number | null;      // mmHg (Diastolic blood pressure)
  smoking: number | null;           // 0 = No, 1 = Yes
  diabetes: number | null;          // 0 = No, 1 = Yes
  heart_attack: number | null;      // 0 = No, 1 = Yes (Previous MI history)
  extracted_at: string;             // ISO timestamp
  source: string;                   // "pdf_extraction"
}
```

## 🔌 Endpoint Integration

### Current Setup
- **API Route**: `/api/submit-risk-data`
- **Method**: POST
- **Content-Type**: application/json

### Configuration Options

#### Option 1: Environment Variable
Set your endpoint URL in `.env.local`:
```
RISK_ASSESSMENT_ENDPOINT=https://your-api-domain.com/api/risk-assessment
```

#### Option 2: Direct Configuration
Update the endpoint in `/src/app/api/submit-risk-data/route.ts`:
```typescript
const EXTERNAL_ENDPOINT = 'https://your-api-domain.com/api/risk-assessment';
```

### Sample Request Body
```json
{
  "user_id": "user@example.com",
  "sex": 1,
  "total_cholesterol": 220.5,
  "ldl": 140.2,
  "hdl": 45.8,
  "systolic_bp": 135.0,
  "diastolic_bp": 85.0,
  "smoking": 0,
  "diabetes": 1,
  "heart_attack": 0,
  "extracted_at": "2025-09-27T10:30:00.000Z",
  "source": "pdf_extraction"
}
```

## 🚀 How It Works

1. **PDF Upload**: User uploads medical report PDF
2. **Text Extraction**: pdfplumber extracts text from PDF
3. **Data Parsing**: Regex patterns identify RiskModel fields
4. **Data Submission**: Extracted data sent to your endpoint
5. **Success Notification**: User sees confirmation message

## 🔧 Flow Sequence

```
PDF Upload → Extract Text → Parse RiskModel Data → Send to Endpoint → User Notification
```

## 📝 Pattern Recognition

The system uses sophisticated regex patterns to identify:

### Demographics
- **Sex/Gender**: "male", "female", "M", "F" patterns
- **Patient Email**: Uses Firebase authenticated user's email address

### Lab Values  
- **Total Cholesterol**: "total cholesterol: 220 mg/dL"
- **LDL**: "ldl: 140", "ldl cholesterol: 140 mg/dl"
- **HDL**: "hdl: 45", "hdl cholesterol: 45 mg/dl"

### Vital Signs
- **Blood Pressure**: "BP: 135/85", "blood pressure: 135/85 mmHg"
- **Systolic**: "systolic: 135", "sys bp: 135"
- **Diastolic**: "diastolic: 85", "dia bp: 85"

### Risk Factors
- **Smoking**: "smoking: yes/no", "smoker: current/former/never"
- **Diabetes**: "diabetes: yes", "diabetic", "type 1/type 2"
- **Heart Attack**: "heart attack: yes", "myocardial infarction", "MI"

## 🛠️ Integration Steps

1. **Set Your Endpoint URL**
   ```bash
   # Add to .env.local
   RISK_ASSESSMENT_ENDPOINT=https://your-domain.com/api/endpoint
   ```

2. **Configure Authentication** (if needed)
   ```typescript
   // In /src/app/api/submit-risk-data/route.ts
   headers: {
     'Content-Type': 'application/json',
     'Authorization': `Bearer ${process.env.API_TOKEN}`,
   }
   ```

3. **Test the Integration**
   - Upload a PDF with medical data
   - Check console logs for extracted data
   - Verify data reaches your endpoint

## 🧪 Testing & Debugging

### Console Output
The system logs all extracted data:
```
=== RISK MODEL DATA ===
User Email: user@example.com
Sex: Male
Total Cholesterol: 220.5 mg/dL
LDL: 140.2 mg/dL
HDL: 45.8 mg/dL
...
========================
```

### Error Handling
- **PDF Processing Errors**: Backend service issues
- **Extraction Failures**: Missing or unrecognizable data
- **Endpoint Errors**: Network or API failures
- **Validation Errors**: Missing required fields

## 🔄 Current Placeholder Behavior

Until you configure your endpoint:
- Data extraction works normally
- Risk data is logged to console
- Success message shows: "Risk data logged successfully (placeholder endpoint)"
- No external API calls are made

## 📋 Next Steps

1. **Replace placeholder endpoint** with your actual URL
2. **Add authentication** if required
3. **Test with real medical PDFs**
4. **Monitor extraction accuracy**
5. **Implement error logging/monitoring**

The system is ready for production use once your endpoint is configured!