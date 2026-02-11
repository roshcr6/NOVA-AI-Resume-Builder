# NOVA - AI Resume Builder, Analyzer & Job Assistant

A complete, production-ready platform for building professional resumes with AI, analyzing them for ATS compatibility, and streamlining job applications.

![NOVA Banner](https://via.placeholder.com/1200x400/2563eb/ffffff?text=NOVA+-+AI+Resume+Builder)

## Features

### 📝 AI Resume Builder
- Generate professional resumes from GitHub profiles
- Manual entry with AI enhancement
- Real-time PDF preview and download
- AI-powered edit assistant (chat sidebar)
- Version history tracking

### 📊 Resume Analyzer
- ATS compatibility scoring (0-100)
- Missing skills detection
- Weak points identification
- ATS-specific issues flagging
- Actionable improvement suggestions
- One-click resume fixing

### 💼 Job Apply Assistant
- Job search integration
- AI-generated application emails
- Resume attachment support
- Email preview before sending
- Mailto link generation

## Tech Stack

### Backend
- Node.js + Express.js
- MongoDB + Mongoose
- Google Gemini AI (@google/generative-ai)
- PDF Generation (pdf-lib)
- PDF Parsing (pdf-parse)
- Security (helmet, cors, express-rate-limit)
- Validation (express-validator)
- File Upload (multer)

### Frontend
- React 18 with Vite
- TailwindCSS
- React Router v6
- Axios
- Context API for state management

## Project Structure

```
nova/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── multer.js
│   ├── middleware/
│   │   ├── sessionMiddleware.js
│   │   ├── errorHandler.js
│   │   └── validate.js
│   ├── models/
│   │   ├── Session.js
│   │   ├── Resume.js
│   │   └── Analysis.js
│   ├── routes/
│   │   ├── resumeRoutes.js
│   │   ├── analysisRoutes.js
│   │   ├── jobRoutes.js
│   │   └── sessionRoutes.js
│   ├── services/
│   │   ├── geminiService.js
│   │   ├── githubService.js
│   │   ├── pdfService.js
│   │   ├── jobService.js
│   │   └── emailService.js
│   ├── uploads/
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── context/
│   │   └── utils/
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── .env.example
├── docs/
│   └── architecture.md
├── README.md
└── .gitignore
```

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key
- (Optional) Adzuna API credentials for job search

### MongoDB Setup

#### Option 1: Local MongoDB
1. Install MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Start MongoDB service
3. Connection string: `mongodb://localhost:27017/nova-resume`

#### Option 2: MongoDB Atlas (Cloud)
1. Create account at https://www.mongodb.com/atlas
2. Create a free cluster
3. Get connection string
4. Whitelist your IP address

### Gemini API Setup

1. Go to https://makersuite.google.com/app/apikey
2. Create a new API key
3. Copy the key for your .env file

### Installation

#### Backend Setup

```bash
cd backend
npm install

# Create environment file
cp .env.example .env

# Edit .env with your values
# - MONGODB_URI
# - GEMINI_API_KEY
# - Other optional settings

# Start development server
npm run dev
```

#### Frontend Setup

```bash
cd frontend
npm install

# Create environment file (optional for development)
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

#### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/nova-resume
GEMINI_API_KEY=your_gemini_api_key
ADZUNA_APP_ID=your_adzuna_app_id
ADZUNA_API_KEY=your_adzuna_api_key
FRONTEND_URL=http://localhost:5173
NODE_ENV=development

# Optional: Email configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
```

#### Frontend (.env)
```env
VITE_API_URL=/api
```

## API Documentation

### Resume Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/resume/generate` | Generate new resume |
| POST | `/api/resume/:id/edit` | Edit resume with AI |
| GET | `/api/resume/current` | Get active resume |
| GET | `/api/resume/history` | Get all user resumes |
| GET | `/api/resume/:id` | Get specific resume |
| PUT | `/api/resume/:id/activate` | Set as active resume |
| DELETE | `/api/resume/:id` | Delete resume |

### Analysis Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/analysis/analyze` | Analyze resume for job |
| POST | `/api/analysis/fix` | Fix resume based on analysis |
| GET | `/api/analysis/history` | Get analysis history |
| GET | `/api/analysis/:id` | Get specific analysis |

### Job Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/jobs/search` | Search for jobs |
| POST | `/api/jobs/apply` | Generate application email |
| POST | `/api/jobs/send-email` | Send email (if configured) |

### Session Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/session/current` | Get current session info |
| GET | `/api/session/profile` | Get full profile |
| DELETE | `/api/session/data` | Delete all user data |

## Deployment

### Backend Deployment (Render)

1. Create account at https://render.com
2. Create new Web Service
3. Connect your GitHub repository
4. Configure:
   - Build Command: `cd backend && npm install`
   - Start Command: `cd backend && npm start`
5. Add environment variables
6. Deploy

### Frontend Deployment (Vercel)

1. Create account at https://vercel.com
2. Import your GitHub repository
3. Configure:
   - Framework Preset: Vite
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add environment variable:
   - `VITE_API_URL`: Your Render backend URL + `/api`
5. Deploy

### Post-Deployment

1. Update backend `FRONTEND_URL` with your Vercel URL
2. Update frontend `VITE_API_URL` with your Render URL
3. Redeploy both if needed

## Testing Simulations

### 1. Resume Generation (GitHub)
```json
// Request
POST /api/resume/generate
{
  "source": "github",
  "githubUrl": "https://github.com/octocat"
}

// Response
{
  "success": true,
  "data": {
    "resumeId": "507f1f77bcf86cd799439011",
    "structuredData": {
      "personalInfo": { "name": "The Octocat", ... },
      "summary": "Experienced developer...",
      "skills": ["JavaScript", "Python", "Ruby"],
      ...
    },
    "pdfUrl": "/uploads/generated/resume_uuid.pdf",
    "version": 1
  }
}
```

### 2. Resume Edit
```json
// Request
POST /api/resume/507f1f77bcf86cd799439011/edit
{
  "instruction": "Add React to my skills and make summary more impactful"
}

// Response
{
  "success": true,
  "data": {
    "resumeId": "507f1f77bcf86cd799439011",
    "structuredData": { /* updated data */ },
    "pdfUrl": "/uploads/generated/resume_new_uuid.pdf",
    "version": 2
  }
}
```

### 3. Resume Analysis
```json
// Request (multipart/form-data)
POST /api/analysis/analyze
- companyName: "Google"
- jobRole: "Software Engineer"
- jobDescription: "..."
- resume: (PDF file)

// Response
{
  "success": true,
  "data": {
    "analysisId": "507f1f77bcf86cd799439012",
    "feedback": {
      "score": 72,
      "missingSkills": ["Kubernetes", "Go"],
      "weakPoints": ["Limited quantifiable achievements"],
      "atsIssues": ["Some bullet points too long"],
      "improvementSuggestions": ["Add metrics to experience"]
    }
  }
}
```

### 4. Job Search
```json
// Request
GET /api/jobs/search?role=Developer&location=SF&remote=true

// Response
{
  "success": true,
  "data": {
    "jobs": [
      {
        "id": "1",
        "title": "Senior Software Engineer",
        "company": "Tech Corp",
        "location": "Remote",
        "salary": "$120,000 - $180,000",
        "url": "https://..."
      }
    ],
    "totalResults": 5,
    "page": 1
  }
}
```

### 5. Error Handling (Invalid AI Response)
```json
// If Gemini returns invalid JSON, system retries once
// If still invalid after retry:
{
  "success": false,
  "error": "Failed to generate valid response after retry"
}
```

## Security Features

- **Helmet**: HTTP security headers
- **CORS**: Origin-restricted requests
- **Rate Limiting**: 100 req/15min (general), 10 req/min (AI)
- **Input Validation**: All inputs sanitized
- **File Validation**: PDF only, 5MB max
- **Session Isolation**: Users can only access their own data

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

## License

MIT License - feel free to use for personal or commercial projects.

## Support

For issues and questions:
1. Check existing GitHub issues
2. Create new issue with detailed description
3. Include error logs and steps to reproduce

---

Built with ❤️ using React, Node.js, and Google Gemini AI
