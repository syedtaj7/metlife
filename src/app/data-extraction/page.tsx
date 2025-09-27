'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { useAuthState } from 'react-firebase-hooks/auth';

interface ExtractedData {
  success: boolean;
  full_text: string;
  total_pages: number;
  structured_data: {
    user_id: string | null; // User email address
    sex: number | null; // 0 = Female, 1 = Male
    total_cholesterol: number | null; // mg/dL
    ldl: number | null; // mg/dL
    hdl: number | null; // mg/dL
    systolic_bp: number | null; // mmHg
    diastolic_bp: number | null; // mmHg
    smoking: number | null; // 0 = No, 1 = Yes
    diabetes: number | null; // 0 = No, 1 = Yes
    heart_attack: number | null; // 0 = No, 1 = Yes
  };
  pages: Array<{
    page_number: number;
    text: string;
  }>;
}

export default function DataExtraction() {
  const [user, loading] = useAuthState(auth);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Redirect if not authenticated
  if (!loading && !user) {
    router.push('/pages/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        alert('Please select a PDF file only.');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        alert('File size should be less than 10MB.');
        return;
      }
      setUploadedFile(file);
    }
  };

  const handleExtractData = async () => {
    if (!uploadedFile) {
      alert('Please upload a PDF file first.');
      return;
    }

    setExtracting(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const response = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract data');
      }

      const result = await response.json();
      
      // Send extracted RiskModel data to your endpoint
      await sendRiskModelData(result.data.structured_data);
      
      console.log('Extracted data:', result.data);
      alert('Data extraction completed successfully and sent to processing endpoint!');
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('Extraction error:', error);
      setError(errorMessage);
      
      if (errorMessage.includes('service is not running')) {
        alert(
          'PDF extraction service is not running.\n\n' +
          'To start it:\n' +
          '1. Open a new terminal\n' +
          '2. Navigate to: python-backend\n' +
          '3. Run: python pdf_extractor.py\n\n' +
          'Then try extracting again.'
        );
      } else {
        alert(`Extraction failed: ${errorMessage}`);
      }
    } finally {
      setExtracting(false);
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendRiskModelData = async (riskData: ExtractedData['structured_data']) => {
    try {
      const response = await fetch('/api/submit-risk-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user?.email || null, // User email ID
          sex: riskData.sex,
          total_cholesterol: riskData.total_cholesterol,
          ldl: riskData.ldl,
          hdl: riskData.hdl,
          systolic_bp: riskData.systolic_bp,
          diastolic_bp: riskData.diastolic_bp,
          smoking: riskData.smoking,
          diabetes: riskData.diabetes,
          heart_attack: riskData.heart_attack,
          // Additional metadata
          extracted_at: new Date().toISOString(),
          source: 'pdf_extraction'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send data');
      }

      const result = await response.json();
      console.log('Risk data sent successfully:', result);
      
    } catch (error) {
      console.error('Failed to send risk data:', error);
      // Don't throw error here to avoid interrupting the main flow
      alert('Warning: Data extracted but failed to send to processing endpoint. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-8">
          
          {/* Welcome Message */}
          <div className="text-center py-8">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              Welcome {user?.displayName || user?.email?.split('@')[0] || 'User'}! Let&apos;s Get to know about your health Better.
            </h1>
          </div>
          
          {/* PDF Upload Section */}
          <div className="bg-slate-800 rounded-lg p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm font-medium">
                1
              </div>
              <h2 className="text-xl font-medium">Upload Medical Reports</h2>
            </div>

            {/* Upload Area */}
            <div className="space-y-4">
              <div 
                className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-purple-500 hover:bg-slate-700/30 active:bg-slate-700/50 transition-all cursor-pointer group"
                onClick={() => fileInputRef.current?.click()}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    fileInputRef.current?.click();
                  }
                }}
                tabIndex={0}
                role="button"
                aria-label="Click to upload PDF file"
              >
                <div className="mx-auto w-12 h-12 bg-slate-700 group-hover:bg-purple-600/20 rounded-full flex items-center justify-center mb-4 transition-colors">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-slate-400 group-hover:text-purple-400 transition-colors">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <polyline points="7,10 12,15 17,10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <line x1="12" y1="15" x2="12" y2="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-white group-hover:text-purple-300 mb-2 transition-colors">Upload Your Medical Reports</h3>
                <p className="text-slate-400 group-hover:text-slate-300 mb-4 transition-colors">Click to select or drag and drop your PDF file here</p>
                <p className="text-sm text-slate-500 group-hover:text-slate-400 transition-colors">Maximum file size: 10MB | Supported format: PDF</p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {/* Selected File Display */}
              {uploadedFile && (
                <div className="bg-slate-700 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" className="text-white">
                        <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" fill="currentColor"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">{uploadedFile.name}</p>
                      <p className="text-slate-400 text-sm">
                        {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeFile}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                      <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-center">
                <button
                  onClick={handleExtractData}
                  disabled={!uploadedFile || extracting}
                  className={`w-full max-w-md font-medium py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 ${
                    !uploadedFile 
                      ? 'bg-gray-600 cursor-not-allowed text-gray-300' 
                      : extracting 
                        ? 'bg-purple-600/50 cursor-not-allowed text-white' 
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                  }`}
                  title={!uploadedFile ? 'Please select a file first' : extracting ? 'Extracting data...' : 'Extract data from uploaded file'}
                >
                  {extracting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Extracting Data...
                    </>
                  ) : (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M21 12c-1.5 0-3-1.5-3-3s1.5-3 3-3 3 1.5 3 3-1.5 3-3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M3 12c1.5 0 3-1.5 3-3s-1.5-3-3-3-3 1.5-3 3 1.5 3 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 3v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 15v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Analyse Data
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <h3 className="text-red-400 font-medium mb-2">Error</h3>
              <p className="text-red-300">{error}</p>
            </div>
          )}

        </div>
      </div>

      {/* Floating Navigation Button - Bottom Right */}
      <button
        onClick={() => router.push('/gamified-Section')}
        className="fixed bottom-6 right-6 bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 z-50 group"
        title="Go to Gamified Health Page"
        aria-label="Navigate to gamified health page"
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="none" 
          className="transition-transform group-hover:rotate-12"
        >
          <path 
            d="M12 2L13.09 8.26L17 7L15.74 10.74L20 12L15.74 13.26L17 17L13.09 15.74L12 22L10.91 15.74L7 17L8.26 13.26L4 12L8.26 10.74L7 7L10.91 8.26L12 2Z" 
            fill="currentColor"
          />
        </svg>
        <span className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Navigate
        </span>
      </button>
    </div>
  );
}