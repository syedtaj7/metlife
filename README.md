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

### 4. Environment Configuration
Create `.env.local` in the root directory:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Python Backend URL (for deployment)
PYTHON_BACKEND_URL=http://localhost:5000

# Optional: External Risk Assessment Endpoint
RISK_ASSESSMENT_ENDPOINT=https://your-api-domain.com/api/risk-assessment
```

### 5. Start Development Servers

**Frontend (Terminal 1):**
```bash
npm run dev
```

**Python Backend (Terminal 2):**
```bash
cd python-backend
python pdf_extractor.py
```

Visit `http://localhost:3000` to access the application.

## 🚀 Deployment Options

### Option 1: Vercel (Frontend) + Railway/Render (Python Backend)

#### Deploy Python Backend to Railway:

1. **Create Railway Account**: Visit [railway.app](https://railway.app)

2. **Deploy from GitHub**:
   - Connect your GitHub repository
   - Choose "Deploy from repo" 
   - Select the `python-backend` folder as root

3. **Railway Configuration**:
   Create `railway.toml` in `python-backend/`:
   ```toml
   [build]
   builder = "nixpacks"
   
   [deploy]
   startCommand = "python pdf_extractor.py"
   
   [env]
   PORT = "5000"
   ```

4. **Environment Variables in Railway**:
   - Set `PORT=5000` (Railway will provide the actual port)
   - Add any other required environment variables

#### Deploy Frontend to Vercel:

1. **Connect to Vercel**:
   - Visit [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

2. **Environment Variables in Vercel**:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   PYTHON_BACKEND_URL=https://your-railway-app.railway.app
   RISK_ASSESSMENT_ENDPOINT=https://your-api-domain.com/api/risk-assessment
   ```

### Option 2: Docker Deployment

#### Docker Compose Setup:

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  frontend:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PYTHON_BACKEND_URL=http://backend:5000
      - NEXT_PUBLIC_FIREBASE_API_KEY=${NEXT_PUBLIC_FIREBASE_API_KEY}
      - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=${NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}
      - NEXT_PUBLIC_FIREBASE_PROJECT_ID=${NEXT_PUBLIC_FIREBASE_PROJECT_ID}
      - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=${NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}
      - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=${NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}
      - NEXT_PUBLIC_FIREBASE_APP_ID=${NEXT_PUBLIC_FIREBASE_APP_ID}
    depends_on:
      - backend
  
  backend:
    build: ./python-backend
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
```

#### Frontend Dockerfile:
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

#### Backend Dockerfile (`python-backend/Dockerfile`):
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["python", "pdf_extractor.py"]
```

### Option 3: AWS/GCP/Azure

Deploy both services on cloud platforms:
- **Frontend**: Static hosting (S3 + CloudFront, GCS, Azure Static Web Apps)
- **Backend**: Container services (ECS, Cloud Run, Container Instances)

## 🔧 Production Configuration

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
