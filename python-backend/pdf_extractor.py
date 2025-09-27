import pdfplumber
from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
import json
import re
from typing import Dict, List, Any

app = Flask(__name__)
CORS(app)

def extract_structured_data(text: str) -> Dict[str, Any]:
    """
    Extract only the specific medical data needed for RiskModel.
    Returns structured data matching the RiskModel class fields.
    """
    extracted_data = {
        "user_id": None,  # Will be set by frontend/database
        "age": None,  # Age in years
        "sex": None,  # 0 = Female, 1 = Male
        "total_cholesterol": None,  # mg/dL
        "ldl": None,  # mg/dL  
        "hdl": None,  # mg/dL
        "systolic_bp": None,  # mmHg
        "diastolic_bp": None,  # mmHg
        "smoking": None,  # 0 = No, 1 = Yes
        "diabetes": None,  # 0 = No, 1 = Yes
        "heart_attack": None,  # 0 = No, 1 = Yes
        "raw_text": text
    }
    
    # Convert text to lowercase for case-insensitive matching
    text_lower = text.lower()
    
    # Clean up text - remove extra whitespace and normalize line breaks
    text_lower = re.sub(r'\s+', ' ', text_lower.strip())

    # Extract Age
    age_patterns = [
        r"age[:\s]*(\d{1,3})\s*years?",         # Age: 45 years
        r"age[:\s]*(\d{1,3})",                  # Age: 45
        r"(\d{1,3})\s*years?\s*old",            # 45 years old
        r"patient.*?(\d{1,3})\s*years?",        # Patient is 45 years
        r"age[:\s]*\([^)]*\)[:\s]*(\d{1,3})",   # Age (years): 45
    ]
    
    for pattern in age_patterns:
        match = re.search(pattern, text_lower)
        if match:
            try:
                age_value = int(match.group(1))
                if 18 <= age_value <= 120:  # Reasonable age range
                    extracted_data["age"] = age_value
                    break
            except ValueError:
                continue
    
    # Extract Sex/Gender (0 = Female, 1 = Male)
    gender_patterns = [
        r"(?:gender|sex):\s*(male|female|m|f)\b",
        r"\b(male|female)\b",
        r"patient.*?(male|female)",
        r"sex:\s*(m|f)\b"
    ]
    
    for pattern in gender_patterns:
        match = re.search(pattern, text_lower, re.IGNORECASE)
        if match:
            gender = match.group(1).lower()
            if gender in ['male', 'm']:
                extracted_data["sex"] = 1
            elif gender in ['female', 'f']:
                extracted_data["sex"] = 0
            break
    
    # Extract Total Cholesterol
    cholesterol_patterns = [
        r"total cholesterol[:\s]*\([^)]*\)[:\s]*(\d+\.?\d*)",  # Total Cholesterol (mg/dL) 210.5
        r"total cholesterol[:\s]*(\d+\.?\d*)\s*mg/dl",        # Total Cholesterol: 210.5 mg/dL
        r"cholesterol[:\s]*\([^)]*\)[:\s]*(\d+\.?\d*)",      # Cholesterol (mg/dL) 210.5
        r"cholesterol[:\s]*(\d+\.?\d*)\s*mg/dl",             # Cholesterol: 210.5 mg/dL
        r"total chol[:\s]*(\d+\.?\d*)",                       # Total Chol: 210.5
        r"cholesterol[:\s]*(\d+\.?\d*)",                      # Cholesterol: 210.5
        r"tc[:\s]*(\d+\.?\d*)\s*mg/dl",                       # TC: 210.5 mg/dL
        r"total cholesterol[:\s]+(\d+\.?\d*)",                # Total Cholesterol 210.5
        r"cholesterol\s*=\s*(\d+\.?\d*)"                       # Cholesterol = 210.5
    ]
    
    for pattern in cholesterol_patterns:
        match = re.search(pattern, text_lower)
        if match:
            try:
                extracted_data["total_cholesterol"] = float(match.group(1))
                break
            except ValueError:
                continue
    
    # Extract LDL Cholesterol
    ldl_patterns = [
        r"ldl[:\s]*\([^)]*\)[:\s]*(\d+\.?\d*)",  # LDL (mg/dL) 140.3
        r"ldl[:\s]*(\d+\.?\d*)\s*mg/dl",         # LDL: 140.3 mg/dL
        r"ldl cholesterol[:\s]*(\d+\.?\d*)",     # LDL Cholesterol: 140.3
        r"low density lipoprotein[:\s]*(\d+\.?\d*)", # Low density lipoprotein: 140.3
        r"ldl-c[:\s]*(\d+\.?\d*)",               # LDL-C: 140.3
        r"ldl[:\s]+(\d+\.?\d*)",                 # LDL 140.3
        r"ldl\s*=\s*(\d+\.?\d*)"                 # LDL = 140.3
    ]
    
    for pattern in ldl_patterns:
        match = re.search(pattern, text_lower)
        if match:
            try:
                extracted_data["ldl"] = float(match.group(1))
                break
            except ValueError:
                continue
    
    # Extract HDL Cholesterol
    hdl_patterns = [
        r"hdl[:\s]*\([^)]*\)[:\s]*(\d+\.?\d*)",  # HDL (mg/dL) 50.2
        r"hdl[:\s]*(\d+\.?\d*)\s*mg/dl",         # HDL: 50.2 mg/dL
        r"hdl cholesterol[:\s]*(\d+\.?\d*)",     # HDL Cholesterol: 50.2
        r"high density lipoprotein[:\s]*(\d+\.?\d*)", # High density lipoprotein: 50.2
        r"hdl-c[:\s]*(\d+\.?\d*)",               # HDL-C: 50.2
        r"hdl[:\s]+(\d+\.?\d*)",                 # HDL 50.2
        r"hdl\s*=\s*(\d+\.?\d*)",                # HDL = 50.2
        r"hdl.*?(\d+\.?\d*)",                    # Flexible fallback for HDL followed by any text and number
    ]
    
    for pattern in hdl_patterns:
        match = re.search(pattern, text_lower)
        if match:
            try:
                extracted_data["hdl"] = float(match.group(1))
                break
            except ValueError:
                continue
    
    # Extract Blood Pressure (Systolic/Diastolic)
    bp_patterns = [
        r"blood pressure[:\s]*(\d+)/(\d+)",
        r"bp[:\s]*(\d+)/(\d+)",
        r"(\d+)/(\d+)\s*mmhg",
        r"systolic[:\s]*(\d+).*?diastolic[:\s]*(\d+)",
        r"sys[:\s]*(\d+).*?dia[:\s]*(\d+)"
    ]
    
    for pattern in bp_patterns:
        match = re.search(pattern, text_lower)
        if match:
            try:
                extracted_data["systolic_bp"] = float(match.group(1))
                extracted_data["diastolic_bp"] = float(match.group(2))
                break
            except ValueError:
                continue
    
    # If BP not found together, try separately
    if extracted_data["systolic_bp"] is None:
        systolic_patterns = [
            r"systolic[:\s]*bp[:\s]*\([^)]*\)[:\s]*(\d+\.?\d*)",  # Systolic BP (mmHg) 125
            r"systolic[:\s]*(\d+\.?\d*)",                         # Systolic: 125
            r"sys bp[:\s]*(\d+\.?\d*)",                           # Sys BP: 125
            r"sbp[:\s]*(\d+\.?\d*)",                              # SBP: 125
            r"systolic[:\s]+(\d+\.?\d*)",                         # Systolic 125
            r"systolic\s*=\s*(\d+\.?\d*)"                         # Systolic = 125
        ]
        for pattern in systolic_patterns:
            match = re.search(pattern, text_lower)
            if match:
                try:
                    extracted_data["systolic_bp"] = float(match.group(1))
                    break
                except ValueError:
                    continue
    
    if extracted_data["diastolic_bp"] is None:
        diastolic_patterns = [
            r"diastolic[:\s]*bp[:\s]*\([^)]*\)[:\s]*(\d+\.?\d*)", # Diastolic BP (mmHg) 82
            r"diastolic[:\s]*(\d+\.?\d*)",                        # Diastolic: 82
            r"dia bp[:\s]*(\d+\.?\d*)",                           # Dia BP: 82
            r"dbp[:\s]*(\d+\.?\d*)",                              # DBP: 82
            r"diastolic[:\s]+(\d+\.?\d*)",                        # Diastolic 82
            r"diastolic\s*=\s*(\d+\.?\d*)"                        # Diastolic = 82
        ]
        for pattern in diastolic_patterns:
            match = re.search(pattern, text_lower)
            if match:
                try:
                    extracted_data["diastolic_bp"] = float(match.group(1))
                    break
                except ValueError:
                    continue
    
    # Extract Smoking Status (0 = No, 1 = Yes)
    smoking_patterns = [
        r"smoking[:\s]*(yes|no|current|former|never)",
        r"smoker[:\s]*(yes|no|current|former|never)",
        r"tobacco[:\s]*(yes|no|use|current|former|never)",
        r"cigarette[:\s]*(yes|no|current|former|never)"
    ]
    
    for pattern in smoking_patterns:
        match = re.search(pattern, text_lower)
        if match:
            smoking_status = match.group(1).lower()
            if smoking_status in ['yes', 'current']:
                extracted_data["smoking"] = 1
            elif smoking_status in ['no', 'never']:
                extracted_data["smoking"] = 0
            elif smoking_status == 'former':
                extracted_data["smoking"] = 1  # Former smokers still carry risk
            break
    
    # Extract Diabetes Status (0 = No, 1 = Yes)
    diabetes_patterns = [
        r"diabetes[:\s]*(yes|no|type\s*[12]|present|absent)",
        r"diabetic[:\s]*(yes|no|type\s*[12])",
        r"dm[:\s]*(yes|no|type\s*[12]|present|absent)",
        r"blood sugar[:\s]*elevated",
        r"glucose[:\s]*elevated"
    ]
    
    for pattern in diabetes_patterns:
        match = re.search(pattern, text_lower)
        if match:
            diabetes_status = match.group(1).lower()
            if diabetes_status in ['yes', 'type 1', 'type 2', 'type1', 'type2', 'present']:
                extracted_data["diabetes"] = 1
            elif diabetes_status in ['no', 'absent']:
                extracted_data["diabetes"] = 0
            break
    
    # Check for diabetes indicators
    if extracted_data["diabetes"] is None:
        if any(term in text_lower for term in ['diabetic', 'insulin', 'metformin', 'hyperglycemia']):
            extracted_data["diabetes"] = 1
    
    # Extract Heart Attack History (0 = No, 1 = Yes)
    heart_attack_patterns = [
        r"heart attack[:\s]*(yes|no|history|previous|prior)",
        r"myocardial infarction[:\s]*(yes|no|history|previous|prior)",
        r"mi[:\s]*(yes|no|history|previous|prior)",
        r"cardiac event[:\s]*(yes|no|history|previous|prior)",
        r"coronary[:\s]*(yes|no|history|previous|prior)"
    ]
    
    for pattern in heart_attack_patterns:
        match = re.search(pattern, text_lower)
        if match:
            ha_status = match.group(1).lower()
            if ha_status in ['yes', 'history', 'previous', 'prior']:
                extracted_data["heart_attack"] = 1
            elif ha_status == 'no':
                extracted_data["heart_attack"] = 0
            break
    
    # Check for heart attack indicators
    if extracted_data["heart_attack"] is None:
        heart_attack_indicators = [
            'myocardial infarction', 'heart attack', 'cardiac arrest',
            'coronary artery disease', 'cad', 'stent', 'bypass',
            'angioplasty', 'cardiac catheterization'
        ]
        if any(indicator in text_lower for indicator in heart_attack_indicators):
            extracted_data["heart_attack"] = 1
        else:
            extracted_data["heart_attack"] = 0
    
    return extracted_data

def extract_text_from_pdf(pdf_path: str) -> Dict[str, Any]:
    """
    Extract text from PDF using pdfplumber with proper ordering.
    """
    try:
        full_text = ""
        pages_data = []
        
        with pdfplumber.open(pdf_path) as pdf:
            for page_num, page in enumerate(pdf.pages):
                # Extract text with proper ordering
                page_text = page.extract_text()
                
                if page_text:
                    pages_data.append({
                        "page_number": page_num + 1,
                        "text": page_text.strip()
                    })
                    
                    full_text += page_text + "\n"
                else:
                    # If no text found, try extracting with different method
                    tables = page.extract_tables()
                    table_text = ""
                    for table in tables:
                        for row in table:
                            if row:
                                table_text += " | ".join([cell if cell else "" for cell in row]) + "\n"
                    
                    if table_text:
                        pages_data.append({
                            "page_number": page_num + 1,
                            "text": table_text.strip()
                        })
                        full_text += table_text + "\n"
            
            total_pages = len(pdf.pages)
        
        # Extract structured data from the full text
        structured_data = extract_structured_data(full_text.strip())
        
        return {
            "success": True,
            "full_text": full_text.strip(),
            "pages": pages_data,
            "structured_data": structured_data,
            "total_pages": total_pages
        }
    
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({"status": "healthy", "service": "PDF Extraction Service"})

@app.route('/extract', methods=['POST'])
def extract_pdf_data():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({"error": "Only PDF files are supported"}), 400
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            file.save(temp_file.name)
            temp_path = temp_file.name
        
        try:
            # Extract text and data from PDF
            result = extract_text_from_pdf(temp_path)
            
            # Clean up temporary file
            os.unlink(temp_path)
            
            if result["success"]:
                # Print formatted extraction summary
                structured_data = result["structured_data"]
                print("\n" + "="*50)
                print("PDF DATA EXTRACTION SUMMARY")
                print("="*50)
                print(f"Age: {format_field_value('age', structured_data.get('age'))}")
                print(f"Gender: {format_field_value('sex', structured_data.get('sex'))}")
                print(f"Total Cholesterol: {format_field_value('total_cholesterol', structured_data.get('total_cholesterol'))}")
                print(f"LDL Cholesterol: {format_field_value('ldl', structured_data.get('ldl'))}")
                print(f"HDL Cholesterol: {format_field_value('hdl', structured_data.get('hdl'))}")
                print(f"Systolic BP: {format_field_value('systolic_bp', structured_data.get('systolic_bp'))}")
                print(f"Diastolic BP: {format_field_value('diastolic_bp', structured_data.get('diastolic_bp'))}")
                print(f"Smoking: {format_field_value('smoking', structured_data.get('smoking'))}")
                print(f"Diabetes: {format_field_value('diabetes', structured_data.get('diabetes'))}")
                print(f"Heart Attack History: {format_field_value('heart_attack', structured_data.get('heart_attack'))}")
                print("="*50)
                
                return jsonify(result), 200
            else:
                return jsonify({"error": result["error"]}), 500
        
        except Exception as e:
            # Clean up temporary file in case of error
            if os.path.exists(temp_path):
                os.unlink(temp_path)
            raise e
    
    except Exception as e:
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

def format_field_value(field_name: str, value: Any) -> str:
    """Format field values for readable console output"""
    if value is None:
        return "Not found"
    
    if field_name == 'age':
        return f"{value} years"
    elif field_name == 'sex':
        return "Male" if value == 1 else "Female" if value == 0 else "Unknown"
    elif field_name in ['smoking', 'diabetes', 'heart_attack']:
        return "Yes" if value == 1 else "No" if value == 0 else "Unknown"
    elif field_name in ['total_cholesterol', 'ldl', 'hdl']:
        return f"{value} mg/dL"
    elif field_name in ['systolic_bp', 'diastolic_bp']:
        return f"{value} mmHg"
    else:
        return str(value)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)