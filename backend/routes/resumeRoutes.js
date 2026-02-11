const express = require('express');
const { body, param, query } = require('express-validator');
const router = express.Router();
const { Resume } = require('../models');
const { geminiService, githubService, pdfService } = require('../services');
const { validate } = require('../middleware');
const path = require('path');
const fs = require('fs');

const generateValidation = [
  body('source').isIn(['github', 'manual', 'linkedin']).withMessage('Source must be github, manual, or linkedin'),
  body('githubUrl').optional().isURL().withMessage('Invalid GitHub URL'),
  body('formData').optional().isObject().withMessage('Form data must be an object'),
  body('template').optional().isString().withMessage('Template must be a string'),
  body('customStyles').optional().isObject().withMessage('Custom styles must be an object')
];

// Get available templates
router.get('/templates', (req, res) => {
  const { TEMPLATES } = require('../services/pdfTemplateService');
  const templates = Object.entries(TEMPLATES).map(([id, template]) => ({
    id,
    name: template.name,
    headerStyle: template.layout.headerStyle,
    sectionStyle: template.layout.sectionStyle
  }));
  res.json({ success: true, data: templates });
});

router.post('/generate', validate(generateValidation), async (req, res, next) => {
  try {
    const { source, githubUrl, formData, userInfo, template = 'modern', customStyles = {} } = req.body;
    const sessionId = req.sessionId;
    
    let structuredData;

    if (source === 'github') {
      if (!githubUrl) {
        return res.status(400).json({
          success: false,
          error: 'GitHub URL is required for GitHub source'
        });
      }

      const githubData = await githubService.fetchCompleteProfile(githubUrl);
      structuredData = await geminiService.generateResumeFromGitHub(githubData, userInfo || {});
      
      if (githubData.profile.email) {
        structuredData.personalInfo.email = structuredData.personalInfo.email || githubData.profile.email;
      }
      structuredData.personalInfo.github = githubUrl;
      if (githubData.profile.blog) {
        structuredData.personalInfo.portfolio = structuredData.personalInfo.portfolio || githubData.profile.blog;
      }
    } else if (source === 'manual' || source === 'linkedin') {
      if (!formData) {
        return res.status(400).json({
          success: false,
          error: 'Form data is required for manual/linkedin source'
        });
      }
      structuredData = await geminiService.generateResumeFromManual(formData);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid source type'
      });
    }

    const pdfResult = await pdfService.generateResumePDF(structuredData, template, customStyles);

    await Resume.updateMany(
      { sessionId, isActive: true },
      { isActive: false }
    );

    const resume = await Resume.create({
      sessionId,
      structuredData,
      pdfPath: pdfResult.url,
      template,
      customStyles,
      version: 1,
      isActive: true
    });

    res.status(201).json({
      success: true,
      data: {
        resumeId: resume._id,
        structuredData: resume.structuredData,
        pdfUrl: pdfResult.url,
        template,
        version: resume.version
      }
    });
  } catch (error) {
    console.error('Resume generation error:', error);
    next(error);
  }
});

const editValidation = [
  body('instruction').notEmpty().withMessage('Edit instruction is required').trim(),
  body('template').optional().isString().withMessage('Template must be a string'),
  body('customStyles').optional().isObject().withMessage('Custom styles must be an object')
];

router.post('/:resumeId/edit', validate(editValidation), async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const { instruction, template, customStyles } = req.body;
    const sessionId = req.sessionId;

    const resume = await Resume.findOne({ _id: resumeId, sessionId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Parse styling instructions from the edit instruction
    const styleChanges = parseStyleInstruction(instruction);
    const updatedData = await geminiService.editResume(resume.structuredData, instruction);

    // Use provided template/styles or keep existing, or apply parsed style changes
    const finalTemplate = template || resume.template || 'modern';
    const finalStyles = {
      ...(resume.customStyles || {}),
      ...(customStyles || {}),
      ...styleChanges
    };

    const pdfResult = await pdfService.generateResumePDF(updatedData, finalTemplate, finalStyles);

    resume.structuredData = updatedData;
    resume.pdfPath = pdfResult.url;
    resume.template = finalTemplate;
    resume.customStyles = finalStyles;
    resume.version += 1;
    await resume.save();

    res.json({
      success: true,
      data: {
        resumeId: resume._id,
        structuredData: resume.structuredData,
        pdfUrl: pdfResult.url,
        template: finalTemplate,
        customStyles: finalStyles,
        version: resume.version
      }
    });
  } catch (error) {
    console.error('Resume edit error:', error);
    next(error);
  }
});

// Direct update (manual editing without AI)
const updateValidation = [
  body('structuredData').notEmpty().withMessage('Structured data is required').isObject()
];

router.put('/:resumeId/update', validate(updateValidation), async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const { structuredData } = req.body;
    const sessionId = req.sessionId;

    const resume = await Resume.findOne({ _id: resumeId, sessionId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    // Generate new PDF with updated data
    const pdfResult = await pdfService.generateResumePDF(
      structuredData, 
      resume.template || 'modern', 
      resume.customStyles || {}
    );

    resume.structuredData = structuredData;
    resume.pdfPath = pdfResult.url;
    resume.version += 1;
    await resume.save();

    res.json({
      success: true,
      data: {
        resumeId: resume._id,
        structuredData: resume.structuredData,
        pdfUrl: pdfResult.url,
        template: resume.template,
        customStyles: resume.customStyles,
        version: resume.version
      }
    });
  } catch (error) {
    console.error('Resume update error:', error);
    next(error);
  }
});

// Helper function to parse styling instructions from chat
function parseStyleInstruction(instruction) {
  const styles = {};
  const lower = instruction.toLowerCase();
  
  // Color detection
  const colorMap = {
    'blue': '#0D84E3',
    'red': '#DC2626',
    'green': '#16A34A',
    'purple': '#9333EA',
    'orange': '#EA580C',
    'teal': '#0D9488',
    'pink': '#DB2777',
    'indigo': '#4F46E5',
    'navy': '#1E3A5F',
    'black': '#000000'
  };
  
  for (const [colorName, hex] of Object.entries(colorMap)) {
    if (lower.includes(colorName)) {
      if (lower.includes('accent') || lower.includes('highlight')) {
        styles.accentColor = hex;
      } else {
        styles.primaryColor = hex;
      }
    }
  }
  
  // Hex color detection
  const hexMatch = instruction.match(/#([0-9A-Fa-f]{6})/);
  if (hexMatch) {
    styles.primaryColor = hexMatch[0];
  }
  
  // Line spacing
  if (lower.includes('more spacing') || lower.includes('looser') || lower.includes('spaced out')) {
    styles.lineSpacing = 18;
  } else if (lower.includes('less spacing') || lower.includes('tighter') || lower.includes('compact')) {
    styles.lineSpacing = 12;
  }
  
  return styles;
}

router.get('/current', async (req, res, next) => {
  try {
    const sessionId = req.sessionId;

    const resume = await Resume.findOne({ sessionId, isActive: true }).sort({ createdAt: -1 });
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'No active resume found'
      });
    }

    res.json({
      success: true,
      data: {
        resumeId: resume._id,
        structuredData: resume.structuredData,
        pdfUrl: resume.pdfPath,
        version: resume.version,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt
      }
    });
  } catch (error) {
    console.error('Get current resume error:', error);
    next(error);
  }
});

router.get('/history', async (req, res, next) => {
  try {
    const sessionId = req.sessionId;

    const resumes = await Resume.find({ sessionId })
      .sort({ createdAt: -1 })
      .select('_id structuredData.personalInfo.name pdfPath version isActive createdAt updatedAt');

    res.json({
      success: true,
      data: resumes.map(r => ({
        resumeId: r._id,
        name: r.structuredData?.personalInfo?.name || 'Unnamed Resume',
        pdfUrl: r.pdfPath,
        version: r.version,
        isActive: r.isActive,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      }))
    });
  } catch (error) {
    console.error('Get resume history error:', error);
    next(error);
  }
});

router.get('/:resumeId', async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const sessionId = req.sessionId;

    const resume = await Resume.findOne({ _id: resumeId, sessionId });
    
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    res.json({
      success: true,
      data: {
        resumeId: resume._id,
        structuredData: resume.structuredData,
        pdfUrl: resume.pdfPath,
        version: resume.version,
        isActive: resume.isActive,
        createdAt: resume.createdAt,
        updatedAt: resume.updatedAt
      }
    });
  } catch (error) {
    console.error('Get resume error:', error);
    next(error);
  }
});

router.put('/:resumeId/activate', async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const sessionId = req.sessionId;

    const resume = await Resume.findOne({ _id: resumeId, sessionId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    await Resume.updateMany(
      { sessionId, isActive: true },
      { isActive: false }
    );

    resume.isActive = true;
    await resume.save();

    res.json({
      success: true,
      message: 'Resume activated successfully',
      data: {
        resumeId: resume._id
      }
    });
  } catch (error) {
    console.error('Activate resume error:', error);
    next(error);
  }
});

router.delete('/:resumeId', async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const sessionId = req.sessionId;

    const resume = await Resume.findOne({ _id: resumeId, sessionId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    if (resume.pdfPath) {
      const pdfPath = path.join(__dirname, '..', resume.pdfPath);
      if (fs.existsSync(pdfPath)) {
        fs.unlinkSync(pdfPath);
      }
    }

    await Resume.deleteOne({ _id: resumeId });

    res.json({
      success: true,
      message: 'Resume deleted successfully'
    });
  } catch (error) {
    console.error('Delete resume error:', error);
    next(error);
  }
});

router.post('/:resumeId/regenerate-pdf', async (req, res, next) => {
  try {
    const { resumeId } = req.params;
    const sessionId = req.sessionId;

    const resume = await Resume.findOne({ _id: resumeId, sessionId });
    if (!resume) {
      return res.status(404).json({
        success: false,
        error: 'Resume not found'
      });
    }

    if (resume.pdfPath) {
      const oldPdfPath = path.join(__dirname, '..', resume.pdfPath);
      if (fs.existsSync(oldPdfPath)) {
        fs.unlinkSync(oldPdfPath);
      }
    }

    const pdfResult = await pdfService.generateResumePDF(resume.structuredData);
    resume.pdfPath = pdfResult.url;
    await resume.save();

    res.json({
      success: true,
      data: {
        resumeId: resume._id,
        pdfUrl: pdfResult.url
      }
    });
  } catch (error) {
    console.error('Regenerate PDF error:', error);
    next(error);
  }
});

module.exports = router;
