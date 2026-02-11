const express = require('express');
const { body, query } = require('express-validator');
const router = express.Router();
const { Resume } = require('../models');
const { jobService, geminiService, emailService, jobScraperService } = require('../services');
const { validate } = require('../middleware');
const path = require('path');
const fs = require('fs');

const searchValidation = [
  query('role').optional().trim(),
  query('location').optional().trim(),
  query('remote').optional().isBoolean().toBoolean(),
  query('page').optional().isInt({ min: 1 }).toInt()
];

router.get('/search', validate(searchValidation), async (req, res, next) => {
  try {
    const { role, location, remote, page = 1 } = req.query;

    // Use real job scraper
    const result = await jobScraperService.searchJobs({
      role: role || 'developer',
      location,
      remote: remote === 'true' || remote === true,
      page
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Job search error:', error);
    next(error);
  }
});

const applyValidation = [
  body('jobId').notEmpty().withMessage('Job ID is required'),
  body('title').notEmpty().withMessage('Job title is required'),
  body('company').notEmpty().withMessage('Company name is required'),
  body('location').optional().trim(),
  body('description').optional().trim(),
  body('recipientEmail').optional().isEmail().withMessage('Invalid email format')
];

router.post('/apply', validate(applyValidation), async (req, res, next) => {
  try {
    const { jobId, title, company, location, description, recipientEmail } = req.body;
    const sessionId = req.sessionId;

    const resume = await Resume.findOne({ sessionId, isActive: true });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'No active resume found. Please generate a resume first.'
      });
    }

    const emailContent = await geminiService.generateJobApplicationEmail(
      resume.structuredData,
      { title, company, location, description }
    );

    const formattedSubject = emailContent.subject;
    const formattedBody = emailService.formatEmailBody(emailContent.body);

    let pdfFullPath = null;
    if (resume.pdfPath) {
      pdfFullPath = path.join(__dirname, '..', resume.pdfPath);
      if (!fs.existsSync(pdfFullPath)) {
        pdfFullPath = null;
      }
    }

    const emailPreview = await emailService.createEmailPreview({
      to: recipientEmail || '',
      subject: formattedSubject,
      body: formattedBody,
      resumePath: pdfFullPath,
      resumeFileName: `${resume.structuredData?.personalInfo?.name || 'Resume'}_Resume.pdf`
    });

    res.json({
      success: true,
      data: {
        jobId,
        jobTitle: title,
        company,
        emailPreview,
        resumeId: resume._id,
        resumePdfUrl: resume.pdfPath
      }
    });
  } catch (error) {
    console.error('Job apply error:', error);
    next(error);
  }
});

const sendEmailValidation = [
  body('to').isEmail().withMessage('Valid recipient email is required'),
  body('subject').notEmpty().withMessage('Subject is required'),
  body('body').notEmpty().withMessage('Email body is required'),
  body('resumeId').optional()
];

router.post('/send-email', validate(sendEmailValidation), async (req, res, next) => {
  try {
    const { to, subject, body: emailBody, resumeId } = req.body;
    const sessionId = req.sessionId;

    let resumePath = null;
    let resumeFileName = 'Resume.pdf';
    
    if (resumeId) {
      const resume = await Resume.findOne({ _id: resumeId, sessionId });
      if (resume && resume.pdfPath) {
        const fullPath = path.join(__dirname, '..', resume.pdfPath);
        if (fs.existsSync(fullPath)) {
          resumePath = fullPath;
          resumeFileName = `${resume.structuredData?.personalInfo?.name || 'Resume'}_Resume.pdf`;
        }
      }
    }

    try {
      const result = await emailService.sendEmail({
        to,
        subject,
        body: emailBody,
        resumePath,
        resumeFileName
      });

      res.json({
        success: true,
        data: {
          message: 'Email sent successfully',
          ...result
        }
      });
    } catch (sendError) {
      const mailtoLink = emailService.generateMailtoLink(
        to,
        subject,
        emailBody,
        resumePath ? `[Please attach your resume manually]` : ''
      );

      res.json({
        success: false,
        error: sendError.message,
        data: {
          mailtoLink,
          message: 'Email service unavailable. Use the mailto link to open your email client.'
        }
      });
    }
  } catch (error) {
    console.error('Send email error:', error);
    next(error);
  }
});

router.get('/email-preview/:resumeId', async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const { title, company, location } = req.query;
    const sessionId = req.sessionId;

    const resume = await Resume.findOne({ _id: resumeId, sessionId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    const emailContent = await geminiService.generateJobApplicationEmail(
      resume.structuredData,
      { 
        title: title || 'Position', 
        company: company || 'Company', 
        location: location || '' 
      }
    );

    const formattedBody = emailService.formatEmailBody(emailContent.body);

    res.json({
      success: true,
      data: {
        subject: emailContent.subject,
        body: formattedBody,
        mailtoLink: emailService.generateMailtoLink('', emailContent.subject, formattedBody)
      }
    });
  } catch (error) {
    console.error('Email preview error:', error);
    next(error);
  }
});

module.exports = router;
