#!/usr/bin/env python3

import re
from typing import Dict, Any

def test_hdl_extraction():
    """Test HDL extraction with the sample text format"""
    
    # Sample text from your original message
    sample_text = """Medical Risk Assessment Report
Patient ID 101
Sex Male
Parameter Value
Total Cholesterol (mg/dL) 210.5
LDL (mg/dL) 140.3
HDL (mg/dL) 50.2
Systolic BP (mmHg) 125
Diastolic BP (mmHg) 82
Smoking Yes
Diabetes No
History of Heart Attack No
This report provides the patient's cardiovascular risk profile based on cholesterol levels, blood
pressure, and lifestyle factors such as smoking and diabetes."""
    
    text_lower = sample_text.lower()
    print(f"Sample text:\n{sample_text}\n")
    print(f"Lowercase text:\n{text_lower}\n")
    
    # Test HDL patterns
    hdl_patterns = [
        r"hdl[:\s]*\([^)]*\)[:\s]*(\d+\.?\d*)",  # HDL (mg/dL) 50.2
        r"hdl[:\s]*(\d+\.?\d*)\s*mg/dl",         # HDL: 50.2 mg/dL
        r"hdl cholesterol[:\s]*(\d+\.?\d*)",     # HDL Cholesterol: 50.2
        r"high density lipoprotein[:\s]*(\d+\.?\d*)", # High density lipoprotein: 50.2
        r"hdl-c[:\s]*(\d+\.?\d*)",               # HDL-C: 50.2
        r"hdl[:\s]+(\d+\.?\d*)",                 # HDL 50.2
        r"hdl\s*=\s*(\d+\.?\d*)"                 # HDL = 50.2
    ]
    
    print("Testing HDL patterns:")
    for i, pattern in enumerate(hdl_patterns):
        match = re.search(pattern, text_lower)
        print(f"Pattern {i+1}: {pattern}")
        if match:
            try:
                hdl_value = float(match.group(1))
                print(f"  ✅ MATCH FOUND: {hdl_value}")
                print(f"  Full match: '{match.group(0)}'")
                break
            except ValueError:
                print(f"  ❌ Match found but failed to convert to float")
                continue
        else:
            print(f"  ❌ No match")
    
    # Test other values too
    print("\nTesting other patterns:")
    
    # Test Total Cholesterol
    cholesterol_patterns = [
        r"total cholesterol[:\s]*\([^)]*\)[:\s]*(\d+\.?\d*)",  # Total Cholesterol (mg/dL) 210.5
    ]
    
    for pattern in cholesterol_patterns:
        match = re.search(pattern, text_lower)
        if match:
            print(f"Total Cholesterol: {match.group(1)} (pattern: {pattern})")
    
    # Test LDL
    ldl_patterns = [
        r"ldl[:\s]*\([^)]*\)[:\s]*(\d+\.?\d*)",  # LDL (mg/dL) 140.3
    ]
    
    for pattern in ldl_patterns:
        match = re.search(pattern, text_lower)
        if match:
            print(f"LDL: {match.group(1)} (pattern: {pattern})")

if __name__ == "__main__":
    test_hdl_extraction()