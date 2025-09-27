import { NextRequest, NextResponse } from 'next/server';

interface RiskModelData {
  user_id: string | null; // User email address
  age?: number | null; // Age is required by ML model but not extracted from PDF
  sex: number | null;
  total_cholesterol: number | null;
  ldl: number | null;
  hdl: number | null;
  systolic_bp: number | null;
  diastolic_bp: number | null;
  smoking: number | null;
  diabetes: number | null;
  heart_attack: number | null;
  extracted_at: string;
  source: string;
}

export async function POST(request: NextRequest) {
  try {
    const riskData: RiskModelData = await request.json();
    
    // Validate required fields
    if (!riskData.user_id) {
      return NextResponse.json(
        { error: 'User email is required' },
        { status: 400 }
      );
    }

    // ML Model endpoint URL
    const ML_MODEL_ENDPOINT = process.env.ML_MODEL_ENDPOINT || 'http://localhost:5001/api/predict';
    
    console.log('\n' + '='.repeat(50));
    console.log('PROCESSING EXTRACTED HEALTH DATA');
    console.log('='.repeat(50));
    console.log(`User Email: ${riskData.user_id}`);
    console.log(`Gender: ${riskData.sex === 1 ? 'Male' : riskData.sex === 0 ? 'Female' : 'Not specified'}`);
    console.log(`Total Cholesterol: ${riskData.total_cholesterol ? `${riskData.total_cholesterol} mg/dL` : 'Not found'}`);
    console.log(`LDL Cholesterol: ${riskData.ldl ? `${riskData.ldl} mg/dL` : 'Not found'}`);
    console.log(`HDL Cholesterol: ${riskData.hdl ? `${riskData.hdl} mg/dL` : 'Not found'}`);
    console.log(`Systolic BP: ${riskData.systolic_bp ? `${riskData.systolic_bp} mmHg` : 'Not found'}`);
    console.log(`Diastolic BP: ${riskData.diastolic_bp ? `${riskData.diastolic_bp} mmHg` : 'Not found'}`);
    console.log(`Smoking Status: ${riskData.smoking === 1 ? 'Yes' : riskData.smoking === 0 ? 'No' : 'Not specified'}`);
    console.log(`Diabetes: ${riskData.diabetes === 1 ? 'Yes' : riskData.diabetes === 0 ? 'No' : 'Not specified'}`);
    console.log(`Heart Attack History: ${riskData.heart_attack === 1 ? 'Yes' : riskData.heart_attack === 0 ? 'No' : 'Not specified'}`);
    console.log(`Extracted At: ${riskData.extracted_at}`);
    console.log(`Source: ${riskData.source}`);

    // Try to get ML predictions
    let mlPredictions = null;
    let mlError = null;

    try {
      // Prepare data for ML model
      const mlData = {
        user_id: riskData.user_id,
        age: riskData.age || 45, // Use extracted age or default to 45
        sex: riskData.sex,
        total_cholesterol: riskData.total_cholesterol,
        ldl: riskData.ldl,
        hdl: riskData.hdl,
        systolic_bp: riskData.systolic_bp,
        diastolic_bp: riskData.diastolic_bp,
        smoking: riskData.smoking,
        diabetes: riskData.diabetes,
        heart_attack: riskData.heart_attack
      };

      console.log(`Age: ${riskData.age ? `${riskData.age} years` : 'Not found (using default: 45)'}`);
      console.log('\n📊 Calling ML Model for Risk Assessment...');
      
      const mlResponse = await fetch(ML_MODEL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mlData),
        // Add timeout to prevent hanging
        signal: AbortSignal.timeout(10000) // 10 seconds timeout
      });

      if (mlResponse.ok) {
        mlPredictions = await mlResponse.json();
        console.log('✅ ML Model Response Received');
        console.log('📋 Risk Predictions:', JSON.stringify(mlPredictions, null, 2));
      } else {
        const errorData = await mlResponse.json().catch(() => ({ error: 'Unknown ML model error' }));
        mlError = `ML Model Error (${mlResponse.status}): ${errorData.error || 'Unknown error'}`;
        console.log('❌ ML Model Error:', mlError);
      }
    } catch (error) {
      mlError = `ML Model Connection Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
      console.log('❌ ML Model Connection Failed:', mlError);
    }

    console.log('='.repeat(50));
    
    return NextResponse.json({
      success: true,
      message: 'Health data processed successfully',
      data: {
        extracted_data: riskData,
        ml_predictions: mlPredictions,
        ml_error: mlError
      }
    });

  } catch (error) {
    console.error('Risk data processing error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process health data' },
      { status: 500 }
    );
  }
}