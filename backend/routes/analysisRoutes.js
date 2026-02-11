const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { Analysis, Resume } = require('../models');
const { geminiService, pdfService } = require('../services');
const { validate } = require('../middleware');
const { upload } = require('../config/multer');
const path = require('path');
const fs = require('fs');

const analyzeValidation = [
  body('companyName').notEmpty().withMessage('Company name is required').trim(),
  body('jobRole').notEmpty().withMessage('Job role is required').trim(),
  body('jobDescription').optional().trim()
];

router.post('/analyze', upload.single('resume'), validate(analyzeValidation), async (req, res, next) => {
  try {
    const { companyName, jobRole, jobDescription } = req.body;
    const sessionId = req.sessionId;
    
    let resumeText = '';
    let resumeId = null;
    let uploadedPdfPath = null;
    
    if (req.file) {
      const parsedPdf = await pdfService.parseResumePDF(req.file.path);
      resumeText = parsedPdf.text;
      
      // Keep the uploaded PDF for comparison - move to uploads folder with unique name
      const uniqueName = `uploaded_${Date.now()}_${path.basename(req.file.path)}`;
      const newPath = path.join(__dirname, '..', 'uploads', uniqueName);
      try {
        fs.copyFileSync(req.file.path, newPath);
        uploadedPdfPath = `/uploads/${uniqueName}`;
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.warn('Failed to preserve uploaded file:', err.message);
        fs.unlink(req.file.path, () => {});
      }
    } else if (req.body.resumeId) {
      const resume = await Resume.findOne({ _id: req.body.resumeId, sessionId });
      if (resume && resume.pdfPath) {
        const pdfPath = path.join(__dirname, '..', resume.pdfPath);
        if (fs.existsSync(pdfPath)) {
          const parsedPdf = await pdfService.parseResumePDF(pdfPath);
          resumeText = parsedPdf.text;
          resumeId = resume._id;
        }
      }
    } else {
      const activeResume = await Resume.findOne({ sessionId, isActive: true });
      if (activeResume && activeResume.pdfPath) {
        const pdfPath = path.join(__dirname, '..', activeResume.pdfPath);
        if (fs.existsSync(pdfPath)) {
          const parsedPdf = await pdfService.parseResumePDF(pdfPath);
          resumeText = parsedPdf.text;
          resumeId = activeResume._id;
        }
      }
    }

    if (!resumeText) {
      return res.status(400).json({
        success: false,
        error: 'No resume provided. Please upload a PDF or ensure you have an active resume.'
      });
    }

    const analysisResult = await geminiService.analyzeResume(
      resumeText,
      companyName,
      jobRole,
      jobDescription
    );

    const analysis = await Analysis.create({
      sessionId,
      resumeId,
      companyName,
      jobRole,
      jobDescription,
      resumeText,
      uploadedPdfPath, // Store the path to the uploaded PDF
      feedback: analysisResult
    });

    res.status(201).json({
      success: true,
      data: {
        analysisId: analysis._id,
        companyName: analysis.companyName,
        jobRole: analysis.jobRole,
        feedback: analysis.feedback,
        uploadedPdf: uploadedPdfPath ? true : false,
        createdAt: analysis.createdAt
      }
    });
  } catch (error) {
    console.error('Resume analysis error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }
    next(error);
  }
});

const fixValidation = [
  body('jobRole').notEmpty().withMessage('Job role is required').trim(),
  body('jobDescription').optional().trim()
];

router.post('/fix', validate(fixValidation), async (req, res, next) => {
  try {
    const { resumeId, analysisId, jobRole, jobDescription, template } = req.body;
    const sessionId = req.sessionId;

    // Get the analysis to check if it was from an uploaded PDF
    let analysis = null;
    let analysisResults = null;
    if (analysisId) {
      analysis = await Analysis.findOne({ _id: analysisId, sessionId });
      if (analysis) {
        analysisResults = analysis.feedback;
      }
    }

    let resume;
    let originalPdfUrl = null;
    let isFromUpload = false;

    // Check if this analysis was from an uploaded PDF
    if (analysis && analysis.uploadedPdfPath && !analysis.resumeId) {
      isFromUpload = true;
      originalPdfUrl = analysis.uploadedPdfPath;
      
      // Extract structured data from the resume text using AI
      const extractedData = await geminiService.extractResumeData(analysis.resumeText);
      
      // Create a new resume from the extracted data
      resume = await Resume.create({
        sessionId,
        structuredData: extractedData,
        source: 'upload',
        isActive: true,
        template: template || 'modern',
        version: 1
      });
      
      // Deactivate other resumes
      await Resume.updateMany(
        { sessionId, _id: { $ne: resume._id } },
        { isActive: false }
      );
    } else {
      // Use existing resume from database
      if (resumeId) {
        resume = await Resume.findOne({ _id: resumeId, sessionId });
      } else if (analysis && analysis.resumeId) {
        resume = await Resume.findOne({ _id: analysis.resumeId, sessionId });
      } else {
        resume = await Resume.findOne({ sessionId, isActive: true });
      }

      if (!resume) {
        return res.status(404).json({
          success: false,
          error: 'No resume found to fix'
        });
      }

      // Save original PDF URL before generating new one
      originalPdfUrl = resume.pdfPath;
      
      // Copy original PDF to a backup location for comparison
      if (resume.pdfPath) {
        const oldPdfPath = path.join(__dirname, '..', resume.pdfPath);
        if (fs.existsSync(oldPdfPath)) {
          const ext = path.extname(oldPdfPath);
          const baseName = path.basename(oldPdfPath, ext);
          const dirName = path.dirname(oldPdfPath);
          const originalBackupPath = path.join(dirName, `${baseName}_original${ext}`);
          
          try {
            fs.copyFileSync(oldPdfPath, originalBackupPath);
            originalPdfUrl = resume.pdfPath.replace(baseName + ext, `${baseName}_original${ext}`);
          } catch (err) {
            console.warn('Could not preserve original PDF:', err.message);
          }
          
          fs.unlinkSync(oldPdfPath);
        }
      }
    }

    // Apply fixes to the resume data
    const fixedData = await geminiService.fixResume(
      resume.structuredData,
      jobRole,
      jobDescription,
      analysisResults
    );

    // Use the resume's saved template and styles
    const pdfResult = await pdfService.generateResumePDF(
      fixedData, 
      resume.template || template || 'modern', 
      resume.customStyles || {}
    );

    resume.structuredData = fixedData;
    resume.pdfPath = pdfResult.url;
    resume.version += 1;
    await resume.save();

    res.json({
      success: true,
      data: {
        resumeId: resume._id,
        structuredData: resume.structuredData,
        pdfUrl: pdfResult.url,
        originalPdfUrl: originalPdfUrl,
        isFromUpload: isFromUpload,
        version: resume.version
      }
    });
  } catch (error) {
    console.error('Resume fix error:', error);
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const sessionId = req.sessionId;

    const analyses = await Analysis.find({ sessionId })
      .select('companyName jobRole feedback.score createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: analyses.map(a => ({
        analysisId: a._id,
        companyName: a.companyName,
        jobRole: a.jobRole,
        score: a.feedback?.score || 0,
        createdAt: a.createdAt
      }))
    });
  } catch (error) {
    console.error('Get analysis history error:', error);
    next(error);
  }
});

router.get('/:analysisId', async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    const sessionId = req.sessionId;

    const analysis = await Analysis.findOne({ _id: analysisId, sessionId });
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    res.json({
      success: true,
      data: {
        analysisId: analysis._id,
        companyName: analysis.companyName,
        jobRole: analysis.jobRole,
        jobDescription: analysis.jobDescription,
        feedback: analysis.feedback,
        createdAt: analysis.createdAt
      }
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    next(error);
  }
});

router.delete('/:analysisId', async (req, res, next) => {
  try {
    const { analysisId } = req.params;
    const sessionId = req.sessionId;

    const analysis = await Analysis.findOne({ _id: analysisId, sessionId });
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Analysis not found'
      });
    }

    await Analysis.deleteOne({ _id: analysisId });

    res.json({
      success: true,
      message: 'Analysis deleted successfully'
    });
  } catch (error) {
    console.error('Delete analysis error:', error);
    next(error);
  }
});

module.exports = router;
