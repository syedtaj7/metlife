import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    // Forward the file to the Python backend
    const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000';
    
    // Create FormData for the Python backend
    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const response = await fetch(`${pythonBackendUrl}/extract`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.error || 'PDF extraction failed' },
        { status: response.status }
      );
    }

    const extractedData = await response.json();
    
    return NextResponse.json({
      success: true,
      data: extractedData,
      message: 'PDF data extracted successfully'
    });

  } catch (error) {
    console.error('PDF extraction error:', error);
    
    // Check if Python backend is running
    try {
      const pythonBackendUrl = process.env.PYTHON_BACKEND_URL || 'http://localhost:5000';
      await fetch(`${pythonBackendUrl}/health`, { method: 'GET' });
    } catch {
      return NextResponse.json(
        { 
          error: 'PDF extraction service is not running. Please start the Python backend first.',
          instructions: 'Run: cd python-backend && python pdf_extractor.py'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process PDF file' },
      { status: 500 }
    );
  }
}