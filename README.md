# MetLife Medical Data Extraction System

A comprehensive medical data extraction system built with Next.js, Firebase, and Python for processing medical reports and extracting cardiovascular risk assessment data.

## 🚀 Features

### Authentication
- 🔐 Firebase Authentication (Email/Password + Google OAuth)
- 🛡️ Protected routes with automatic redirects
- 👤 User session management

### PDF Data Extraction
- 📄 PDF upload and text extraction using pdfplumber
- 🎯 Medical data pattern recognition
- 📊 RiskModel-focused data parsing
- 🔄 Automatic endpoint integration for data submission

### User Interface
- 📱 Responsive design with Tailwind CSS
- 🌙 Dark theme with purple/slate color scheme
- ⚡ Real-time feedback and loading states
- 📋 Clean, minimal interface

## 🏗️ Tech Stack

**Frontend:**
- Next.js 15.5.4 with App Router
- React 19.1.0
- TypeScript
- Tailwind CSS
- Firebase SDK
- react-firebase-hooks

**Backend:**
- Python Flask server
- pdfplumber for PDF processing
- Flask-CORS for API communication

## 📋 RiskModel Data Structure

The system extracts the following cardiovascular risk factors:

```typescript
interface RiskModelData {
  user_id: string | null;           // Firebase user ID
  sex: number | null;               // 0 = Female, 1 = Male
  total_cholesterol: number | null; // mg/dL
  ldl: number | null;               // mg/dL (Low-density lipoprotein)
  hdl: number | null;               // mg/dL (High-density lipoprotein)
  systolic_bp: number | null;       // mmHg (Systolic blood pressure)
  diastolic_bp: number | null;      // mmHg (Diastolic blood pressure)
  smoking: number | null;           // 0 = No, 1 = Yes
  diabetes: number | null;          // 0 = No, 1 = Yes
  heart_attack: number | null;      // 0 = No, 1 = Yes (Previous MI)
  extracted_at: string;             // ISO timestamp
  source: string;                   // "pdf_extraction"
}
```

## 🛠️ Local Development Setup

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- Firebase project setup

### 1. Clone Repository
```bash
git clone https://github.com/syedtaj7/metlife.git
cd metlife
```

### 2. Install Frontend Dependencies
```bash
npm install
```

### 3. Setup Python Backend
```bash
cd python-backend
pip install -r requirements.txt
```

