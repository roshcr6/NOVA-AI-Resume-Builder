const axios = require('axios');

class OllamaService {
  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.model = process.env.OLLAMA_MODEL || 'llama3.2';
  }

  parseAndValidateJSON(responseText) {
    try {
      let text = responseText;
      
      // Remove markdown code blocks if present
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      
      // Find JSON object in response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        text = jsonMatch[0];
      }
      
      const parsed = JSON.parse(text);
      return { success: true, data: parsed };
    } catch (error) {
      console.error('JSON parsing error:', error.message);
      return { success: false, error: error.message, rawText: responseText };
    }
  }

  async generateWithRetry(prompt, maxRetries = 1) {
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(`${this.baseUrl}/api/generate`, {
          model: this.model,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.7,
            num_predict: 8192
          }
        }, {
          timeout: 120000 // 2 minute timeout for generation
        });

        const parseResult = this.parseAndValidateJSON(response.data.response);
        
        if (parseResult.success) {
          return parseResult.data;
        }
        
        lastError = new Error(`Invalid JSON response: ${parseResult.error}`);
        console.warn(`Attempt ${attempt + 1} failed, retrying...`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        lastError = error;
        console.error(`Ollama API error on attempt ${attempt + 1}:`, error.message);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    throw lastError;
  }

  async generateResumeFromGitHub(githubData, userInfo = {}) {
    const prompt = `You are a professional resume writer. Generate a structured resume JSON based on the following GitHub profile data and user information.

GitHub Data:
${JSON.stringify(githubData, null, 2)}

Additional User Info:
${JSON.stringify(userInfo, null, 2)}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string"
  },
  "summary": "A compelling 2-3 sentence professional summary based on the GitHub profile",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "current": false,
      "description": "string",
      "highlights": ["highlight1", "highlight2"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["tech1", "tech2"],
      "url": "string",
      "github": "string"
    }
  ],
  "education": [
    {
      "degree": "string",
      "field": "string",
      "institution": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string"
    }
  ],
  "certifications": []
}

Important:
- Extract skills from repository languages
- Create project entries from top repositories
- Write compelling descriptions
- If information is not available, use empty string or empty array
- Return ONLY the JSON, no other text`;

    try {
      const data = await this.generateWithRetry(prompt);
      return this.validateResumeStructure(data);
    } catch (error) {
      console.error('Generate resume from GitHub error:', error);
      throw error;
    }
  }

  async generateResumeFromManual(formData) {
    const prompt = `You are a professional resume writer. Enhance and structure the following user-provided information into a professional resume.

User Data:
${JSON.stringify(formData, null, 2)}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string"
  },
  "summary": "A compelling 2-3 sentence professional summary based on the provided information",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "current": false,
      "description": "string",
      "highlights": ["highlight1", "highlight2"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["tech1", "tech2"],
      "url": "string",
      "github": "string"
    }
  ],
  "education": [
    {
      "degree": "string",
      "field": "string",
      "institution": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string",
      "url": "string"
    }
  ]
}

Important:
- Enhance descriptions to be more professional
- Organize skills by relevance
- Write compelling bullet points for experience
- Return ONLY the JSON, no other text`;

    try {
      const data = await this.generateWithRetry(prompt);
      return this.validateResumeStructure(data);
    } catch (error) {
      console.error('Generate resume from manual error:', error);
      throw error;
    }
  }

  async editResume(currentResume, editInstruction) {
    const prompt = `You are a professional resume editor and ATS optimization expert. Modify the resume based on the user's instruction.

Current Resume:
${JSON.stringify(currentResume, null, 2)}

User Instruction: "${editInstruction}"

INSTRUCTIONS FOR EDITING:
1. If the instruction mentions adding skills/technologies: Add them to the "skills" array
2. If it mentions changing text (summary, descriptions, bullet points): Rewrite those sections professionally
3. If it mentions improving/enhancing/optimizing: Make content more impactful with action verbs and quantifiable metrics
4. If it mentions removing something: Remove it completely
5. If it mentions making it ATS-friendly: Use industry keywords, simple formatting, avoid special characters
6. If it mentions specific changes to experience/projects/education: Update those exact sections
7. If it mentions tone changes (more technical, more creative, simpler): Adjust writing style accordingly
8. IMPORTANT: Keep ALL other information that isn't mentioned in the instruction EXACTLY the same

Return ONLY the complete updated resume as valid JSON in this exact format (no markdown, no explanation):
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string"
  },
  "summary": "string",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "current": false,
      "description": "string",
      "highlights": ["highlight1"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["tech1"],
      "url": "string",
      "github": "string"
    }
  ],
  "education": [
    {
      "degree": "string",
      "field": "string",
      "institution": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string",
      "url": "string"
    }
  ]
}

Important:
- Apply ONLY the requested changes
- Keep all other information intact
- Maintain professional tone
- Return ONLY the JSON, no other text`;

    try {
      const data = await this.generateWithRetry(prompt);
      return this.validateResumeStructure(data);
    } catch (error) {
      console.error('Edit resume error:', error);
      throw error;
    }
  }

  async analyzeResume(resumeText, companyName, jobRole, jobDescription = '') {
    const prompt = `You are an expert ATS (Applicant Tracking System) analyzer and career coach. Analyze the following resume for the specified job role.

Resume Text:
${resumeText}

Target Company: ${companyName}
Target Job Role: ${jobRole}
${jobDescription ? `Job Description:\n${jobDescription}` : ''}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "score": 75,
  "missingSkills": ["skill1", "skill2", "skill3"],
  "weakPoints": ["weakness1", "weakness2"],
  "atsIssues": ["issue1", "issue2"],
  "improvementSuggestions": ["suggestion1", "suggestion2", "suggestion3"]
}

Important:
- Score must be a number between 0 and 100
- Be specific and actionable in suggestions
- Consider ATS compatibility
- Evaluate keyword matching
- Assess experience relevance
- Return ONLY the JSON, no other text`;

    try {
      const data = await this.generateWithRetry(prompt);
      return this.validateAnalysisStructure(data);
    } catch (error) {
      console.error('Analyze resume error:', error);
      throw error;
    }
  }

  async fixResume(currentResume, jobRole, jobDescription = '', analysisResults = null) {
    const prompt = `You are a professional resume optimizer. Improve the following resume to better match the target job role.

Current Resume:
${JSON.stringify(currentResume, null, 2)}

Target Job Role: ${jobRole}
${jobDescription ? `Job Description:\n${jobDescription}` : ''}
${analysisResults ? `Previous Analysis:\n${JSON.stringify(analysisResults, null, 2)}` : ''}

Return ONLY the complete optimized resume as valid JSON in this exact format (no markdown, no explanation):
{
  "personalInfo": {
    "name": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "linkedin": "string",
    "github": "string",
    "portfolio": "string"
  },
  "summary": "An optimized professional summary targeting the job role",
  "skills": ["prioritized", "relevant", "skills"],
  "experience": [
    {
      "title": "string",
      "company": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "current": false,
      "description": "string",
      "highlights": ["achievement1", "achievement2"]
    }
  ],
  "projects": [
    {
      "name": "string",
      "description": "string",
      "technologies": ["tech1"],
      "url": "string",
      "github": "string"
    }
  ],
  "education": [
    {
      "degree": "string",
      "field": "string",
      "institution": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string"
    }
  ],
  "certifications": []
}

Important:
- Optimize for ATS compatibility
- Add relevant keywords from job description
- Prioritize relevant skills
- Enhance bullet points with quantifiable achievements
- Improve professional summary
- Return ONLY the JSON, no other text`;

    try {
      const data = await this.generateWithRetry(prompt);
      return this.validateResumeStructure(data);
    } catch (error) {
      console.error('Fix resume error:', error);
      throw error;
    }
  }

  async generateJobApplicationEmail(resume, jobDetails) {
    const prompt = `You are a professional email writer. Generate a compelling job application email.

Applicant Resume:
${JSON.stringify(resume, null, 2)}

Job Details:
Title: ${jobDetails.title}
Company: ${jobDetails.company}
Location: ${jobDetails.location}
${jobDetails.description ? `Description: ${jobDetails.description}` : ''}

Return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "subject": "Application for [Job Title] Position at [Company]",
  "body": "Dear Hiring Manager,\\n\\n[Professional email body with 2-3 paragraphs]\\n\\nBest regards,\\n[Name]"
}

Important:
- Be professional and concise
- Highlight relevant qualifications
- Show enthusiasm for the role
- Include a clear call to action
- Return ONLY the JSON, no other text`;

    try {
      const data = await this.generateWithRetry(prompt);
      
      if (!data.subject || !data.body) {
        throw new Error('Invalid email structure');
      }
      
      return data;
    } catch (error) {
      console.error('Generate job application email error:', error);
      throw error;
    }
  }

  validateResumeStructure(data) {
    const defaultStructure = {
      personalInfo: {
        name: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        portfolio: ''
      },
      summary: '',
      skills: [],
      experience: [],
      projects: [],
      education: [],
      certifications: []
    };

    const validated = {
      personalInfo: {
        ...defaultStructure.personalInfo,
        ...(data.personalInfo || {})
      },
      summary: data.summary || '',
      skills: Array.isArray(data.skills) ? data.skills : [],
      experience: Array.isArray(data.experience) ? data.experience.map(exp => ({
        title: exp.title || '',
        company: exp.company || '',
        location: exp.location || '',
        startDate: exp.startDate || '',
        endDate: exp.endDate || '',
        current: Boolean(exp.current),
        description: exp.description || '',
        highlights: Array.isArray(exp.highlights) ? exp.highlights : []
      })) : [],
      projects: Array.isArray(data.projects) ? data.projects.map(proj => ({
        name: proj.name || '',
        description: proj.description || '',
        technologies: Array.isArray(proj.technologies) ? proj.technologies : [],
        url: proj.url || '',
        github: proj.github || ''
      })) : [],
      education: Array.isArray(data.education) ? data.education.map(edu => ({
        degree: edu.degree || '',
        field: edu.field || '',
        institution: edu.institution || '',
        location: edu.location || '',
        startDate: edu.startDate || '',
        endDate: edu.endDate || '',
        gpa: edu.gpa || ''
      })) : [],
      certifications: Array.isArray(data.certifications) ? data.certifications.map(cert => ({
        name: cert.name || '',
        issuer: cert.issuer || '',
        date: cert.date || '',
        url: cert.url || ''
      })) : []
    };

    return validated;
  }

  validateAnalysisStructure(data) {
    let score = parseInt(data.score, 10);
    if (isNaN(score) || score < 0) score = 0;
    if (score > 100) score = 100;

    return {
      score,
      missingSkills: Array.isArray(data.missingSkills) ? data.missingSkills : [],
      weakPoints: Array.isArray(data.weakPoints) ? data.weakPoints : [],
      atsIssues: Array.isArray(data.atsIssues) ? data.atsIssues : [],
      improvementSuggestions: Array.isArray(data.improvementSuggestions) ? data.improvementSuggestions : []
    };
  }

  async extractResumeData(resumeText) {
    const prompt = `You are an expert resume parser. Extract structured data from the following resume text.

Resume Text:
${resumeText}

Extract all information and return ONLY valid JSON in this exact format (no markdown, no explanation):
{
  "personalInfo": {
    "name": "extracted name or empty string",
    "email": "extracted email or empty string",
    "phone": "extracted phone or empty string",
    "location": "extracted location or empty string",
    "linkedin": "extracted linkedin URL or empty string",
    "github": "extracted github URL or empty string",
    "portfolio": "extracted portfolio URL or empty string"
  },
  "summary": "extracted professional summary or generate one based on the resume content",
  "skills": ["skill1", "skill2", "skill3"],
  "experience": [
    {
      "title": "job title",
      "company": "company name",
      "location": "job location",
      "startDate": "start date",
      "endDate": "end date or Present",
      "current": false,
      "description": "job description",
      "highlights": ["achievement 1", "achievement 2"]
    }
  ],
  "projects": [
    {
      "name": "project name",
      "description": "project description",
      "technologies": ["tech1", "tech2"],
      "url": "project URL if any",
      "github": "github URL if any"
    }
  ],
  "education": [
    {
      "degree": "degree name",
      "field": "field of study",
      "institution": "school name",
      "location": "school location",
      "startDate": "start date",
      "endDate": "end date",
      "gpa": "GPA if mentioned"
    }
  ],
  "certifications": [
    {
      "name": "certification name",
      "issuer": "issuing organization",
      "date": "date obtained",
      "url": "certification URL if any"
    }
  ]
}

Important:
- Extract ALL information found in the resume
- If a section is not found, use empty arrays or empty strings
- For dates, keep the original format from the resume
- Parse bullet points as highlights in experience section
- Be thorough - don't miss any skills, projects, or experiences mentioned`;

    try {
      const data = await this.generateWithRetry(prompt, 2);
      return this.validateResumeStructure(data);
    } catch (error) {
      console.error('Error extracting resume data:', error);
      throw error;
    }
  }
}

module.exports = new OllamaService();
