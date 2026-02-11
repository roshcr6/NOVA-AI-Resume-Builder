# NOVA Resume Platform - System Architecture

## Overview

NOVA is a complete AI-powered resume building, analyzing, and job application platform. It uses Google Gemini AI for intelligent resume generation, analysis, and optimization.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND (React + Vite)                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │  Home   │  │Generate │  │ Analyze │  │  Jobs   │  │ Profile │           │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘           │
│       │            │            │            │            │                 │
│       └────────────┴────────────┴────────────┴────────────┘                 │
│                                  │                                           │
│                            Context API                                       │
│                    (Session, Toast, Resume State)                           │
│                                  │                                           │
│                            API Service                                       │
│                         (Axios + Interceptors)                              │
└──────────────────────────────────┼──────────────────────────────────────────┘
                                   │
                                   │ HTTPS/REST
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           BACKEND (Node.js + Express)                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           MIDDLEWARE                                  │   │
│  │  ┌────────┐  ┌──────────┐  ┌───────────┐  ┌────────────┐           │   │
│  │  │ Helmet │  │   CORS   │  │Rate Limit │  │  Session   │           │   │
│  │  └────────┘  └──────────┘  └───────────┘  └────────────┘           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                             ROUTES                                    │   │
│  │  ┌─────────────┐  ┌────────────────┐  ┌─────────────┐               │   │
│  │  │   Resume    │  │    Analysis    │  │    Jobs     │               │   │
│  │  │  /generate  │  │   /analyze     │  │  /search    │               │   │
│  │  │  /edit      │  │   /fix         │  │  /apply     │               │   │
│  │  │  /current   │  │   /history     │  │  /email     │               │   │
│  │  └──────┬──────┘  └───────┬────────┘  └──────┬──────┘               │   │
│  └─────────┼─────────────────┼──────────────────┼───────────────────────┘   │
│            │                 │                  │                            │
│  ┌─────────▼─────────────────▼──────────────────▼───────────────────────┐   │
│  │                           SERVICES                                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │   │
│  │  │   Gemini     │  │    GitHub    │  │     PDF      │               │   │
│  │  │   Service    │  │   Service    │  │   Service    │               │   │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘               │   │
│  │         │                 │                  │                       │   │
│  │  ┌──────────────┐  ┌──────────────┐                                  │   │
│  │  │     Job      │  │    Email     │                                  │   │
│  │  │   Service    │  │   Service    │                                  │   │
│  │  └──────┬───────┘  └──────────────┘                                  │   │
│  └─────────┼────────────────────────────────────────────────────────────┘   │
│            │                                                                 │
└────────────┼─────────────────────────────────────────────────────────────────┘
             │
      ┌──────┼───────────────────────────────────────┐
      │      │                                       │
      ▼      ▼                                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│    Google        │  │     MongoDB      │  │    External      │
│  Gemini AI       │  │    Database      │  │    APIs          │
│                  │  │                  │  │  (GitHub/Adzuna) │
│  - Resume Gen    │  │  - Sessions      │  │                  │
│  - Analysis      │  │  - Resumes       │  │  - Profile Data  │
│  - Optimization  │  │  - Analyses      │  │  - Job Listings  │
└──────────────────┘  └──────────────────┘  └──────────────────┘
```

## Data Flow

### 1. Resume Generation Flow

```
User Input (GitHub URL / Manual Form)
         │
         ▼
┌─────────────────┐
│  Frontend       │ Collect data, validate
└────────┬────────┘
         │ POST /api/resume/generate
         ▼
┌─────────────────┐
│  Backend        │ Validate session
│  Middleware     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐    ┌─────────────────┐
│  GitHub         │───▶│  Fetch repos,   │
│  Service        │    │  languages,     │
└────────┬────────┘    │  profile        │
         │             └─────────────────┘
         ▼
┌─────────────────┐
│  Gemini         │ Generate structured
│  Service        │ resume JSON
└────────┬────────┘
         │ Validate + Retry if invalid
         ▼
┌─────────────────┐
│  PDF            │ Generate styled PDF
│  Service        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  MongoDB        │ Save resume + PDF path
│  Database       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response       │ Return resume data
│  to Frontend    │ + PDF URL
└─────────────────┘
```

### 2. Resume Analysis Flow

```
User Input (Company, Role, PDF Upload)
         │
         ▼
┌─────────────────┐
│  Frontend       │ Collect form data
└────────┬────────┘
         │ POST /api/analysis/analyze (multipart)
         ▼
┌─────────────────┐
│  Multer         │ Handle PDF upload
│  Middleware     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PDF Parse      │ Extract text from PDF
│  Service        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Gemini         │ Analyze resume:
│  Service        │ - Score (0-100)
│                 │ - Missing skills
│                 │ - Weak points
│                 │ - ATS issues
│                 │ - Suggestions
└────────┬────────┘
         │ Validate structure
         ▼
┌─────────────────┐
│  MongoDB        │ Save analysis
│  Database       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Response       │ Return feedback
│  to Frontend    │
└─────────────────┘
```

### 3. Job Application Flow

```
User Search (Role, Location)
         │
         ▼
┌─────────────────┐
│  Frontend       │ Search form
└────────┬────────┘
         │ GET /api/jobs/search
         ▼
┌─────────────────┐
│  Job            │ Search Adzuna API
│  Service        │ (or return mock data)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend       │ Display job cards
│  Job List       │
└────────┬────────┘
         │ POST /api/jobs/apply
         ▼
┌─────────────────┐
│  Gemini         │ Generate email:
│  Service        │ - Subject line
│                 │ - Email body
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Email          │ Create preview
│  Service        │ + mailto link
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Frontend       │ Show email modal
│  Email Modal    │ with preview
└─────────────────┘
```

## Database Schema

### Sessions Collection
```javascript
{
  sessionId: String (UUID),
  createdAt: Date,
  lastActivity: Date
}
```

### Resumes Collection
```javascript
{
  sessionId: String,
  structuredData: {
    personalInfo: {
      name, email, phone, location,
      linkedin, github, portfolio
    },
    summary: String,
    skills: [String],
    experience: [{
      title, company, location,
      startDate, endDate, current,
      description, highlights: [String]
    }],
    projects: [{
      name, description,
      technologies: [String],
      url, github
    }],
    education: [{
      degree, field, institution,
      location, startDate, endDate, gpa
    }],
    certifications: [{
      name, issuer, date, url
    }]
  },
  pdfPath: String,
  version: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Analyses Collection
```javascript
{
  sessionId: String,
  resumeId: ObjectId,
  companyName: String,
  jobRole: String,
  jobDescription: String,
  resumeText: String,
  feedback: {
    score: Number (0-100),
    missingSkills: [String],
    weakPoints: [String],
    atsIssues: [String],
    improvementSuggestions: [String]
  },
  createdAt: Date
}
```

## Security Measures

1. **Helmet**: Sets various HTTP headers for security
2. **CORS**: Configured for frontend origin only
3. **Rate Limiting**: 
   - General: 100 requests per 15 minutes
   - AI endpoints: 10 requests per minute
4. **Input Validation**: express-validator on all inputs
5. **File Validation**: PDF only, 5MB max size
6. **Session-based isolation**: Each session's data is isolated

## Scalability Considerations

1. **Stateless Backend**: Uses session headers instead of server-side sessions
2. **MongoDB Connection Pool**: Configured for concurrent connections
3. **File Storage**: Currently local, can be migrated to S3/Cloud Storage
4. **Rate Limiting**: Prevents abuse and manages Gemini API calls

## Environment Variables

### Backend
- `PORT`: Server port
- `MONGODB_URI`: MongoDB connection string
- `GEMINI_API_KEY`: Google Gemini API key
- `ADZUNA_APP_ID`: Adzuna job search API ID
- `ADZUNA_API_KEY`: Adzuna API key
- `FRONTEND_URL`: Frontend URL for CORS
- `SMTP_*`: Email configuration

### Frontend
- `VITE_API_URL`: Backend API URL

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/health | Health check |
| POST | /api/resume/generate | Generate resume |
| POST | /api/resume/:id/edit | Edit resume with AI |
| GET | /api/resume/current | Get active resume |
| GET | /api/resume/history | Get all resumes |
| PUT | /api/resume/:id/activate | Set active resume |
| DELETE | /api/resume/:id | Delete resume |
| POST | /api/analysis/analyze | Analyze resume |
| POST | /api/analysis/fix | Fix resume based on analysis |
| GET | /api/analysis/history | Get analysis history |
| GET | /api/jobs/search | Search for jobs |
| POST | /api/jobs/apply | Generate application email |
| GET | /api/session/profile | Get user profile |
| DELETE | /api/session/data | Delete all user data |
