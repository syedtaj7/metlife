import { NextRequest, NextResponse } from 'next/server';

interface RiskModelData {
  user_id: string | null; // User email address
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

    // TODO: Replace with your actual endpoint URL
    const EXTERNAL_ENDPOINT = process.env.RISK_ASSESSMENT_ENDPOINT || 'YOUR_ENDPOINT_URL_HERE';
    
    if (EXTERNAL_ENDPOINT === 'YOUR_ENDPOINT_URL_HERE') {
      // For now, just log the data and return success
      console.log('=== RISK MODEL DATA ===');
      console.log('User Email:', riskData.user_id);
      console.log('Sex:', riskData.sex === 1 ? 'Male' : riskData.sex === 0 ? 'Female' : 'Not specified');
      console.log('Total Cholesterol:', riskData.total_cholesterol ? `${riskData.total_cholesterol} mg/dL` : 'Not found');
      console.log('LDL:', riskData.ldl ? `${riskData.ldl} mg/dL` : 'Not found');
      console.log('HDL:', riskData.hdl ? `${riskData.hdl} mg/dL` : 'Not found');
      console.log('Systolic BP:', riskData.systolic_bp ? `${riskData.systolic_bp} mmHg` : 'Not found');
      console.log('Diastolic BP:', riskData.diastolic_bp ? `${riskData.diastolic_bp} mmHg` : 'Not found');
      console.log('Smoking:', riskData.smoking === 1 ? 'Yes' : riskData.smoking === 0 ? 'No' : 'Not specified');
      console.log('Diabetes:', riskData.diabetes === 1 ? 'Yes' : riskData.diabetes === 0 ? 'No' : 'Not specified');
      console.log('Heart Attack History:', riskData.heart_attack === 1 ? 'Yes' : riskData.heart_attack === 0 ? 'No' : 'Not specified');
      console.log('Extracted At:', riskData.extracted_at);
      console.log('========================');
      
      return NextResponse.json({
        success: true,
        message: 'Risk data logged successfully (placeholder endpoint)',
        data: riskData
      });
    }

    // Send data to external endpoint
    const response = await fetch(EXTERNAL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add any required authentication headers
        // 'Authorization': `Bearer ${process.env.API_TOKEN}`,
      },
      body: JSON.stringify(riskData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.error || 'Failed to submit risk data' },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    return NextResponse.json({
      success: true,
      message: 'Risk data submitted successfully',
      data: result
    });

  } catch (error) {
    console.error('Risk data submission error:', error);
    
    return NextResponse.json(
      { error: 'Failed to process risk data submission' },
      { status: 500 }
    );
  }
}