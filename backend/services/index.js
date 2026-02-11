// Using Ollama instead of Gemini for AI features
const geminiService = require('./ollamaService');
const githubService = require('./githubService');
const pdfService = require('./pdfTemplateService'); // Using template-based PDF generation
const jobService = require('./jobService');
const emailService = require('./emailService');
const jobScraperService = require('./jobScraperService'); // Real job scraping

module.exports = {
  geminiService,
  githubService,
  pdfService,
  jobService,
  emailService,
  jobScraperService
};
