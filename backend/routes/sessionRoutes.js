const express = require('express');
const router = express.Router();
const { Session, Resume, Analysis } = require('../models');

router.get('/current', async (req, res, next) => {
  try {
    const session = req.session;
    
    const [resumeCount, analysisCount, activeResume] = await Promise.all([
      Resume.countDocuments({ sessionId: req.sessionId }),
      Analysis.countDocuments({ sessionId: req.sessionId }),
      Resume.findOne({ sessionId: req.sessionId, isActive: true })
        .select('_id structuredData.personalInfo.name pdfPath version')
    ]);

    res.json({
      success: true,
      data: {
        sessionId: session.sessionId,
        createdAt: session.createdAt,
        lastActivity: session.lastActivity,
        stats: {
          totalResumes: resumeCount,
          totalAnalyses: analysisCount
        },
        activeResume: activeResume ? {
          resumeId: activeResume._id,
          name: activeResume.structuredData?.personalInfo?.name || 'Unnamed Resume',
          pdfUrl: activeResume.pdfPath,
          version: activeResume.version
        } : null
      }
    });
  } catch (error) {
    console.error('Get session error:', error);
    next(error);
  }
});

router.get('/profile', async (req, res, next) => {
  try {
    const sessionId = req.sessionId;

    const [session, resumes, analyses] = await Promise.all([
      Session.findOne({ sessionId }),
      Resume.find({ sessionId })
        .select('_id structuredData.personalInfo.name pdfPath version isActive createdAt updatedAt')
        .sort({ createdAt: -1 }),
      Analysis.find({ sessionId })
        .select('companyName jobRole feedback.score createdAt')
        .sort({ createdAt: -1 })
    ]);

    const activeResume = resumes.find(r => r.isActive);

    res.json({
      success: true,
      data: {
        session: {
          sessionId: session.sessionId,
          createdAt: session.createdAt,
          lastActivity: session.lastActivity
        },
        activeResume: activeResume ? {
          resumeId: activeResume._id,
          name: activeResume.structuredData?.personalInfo?.name || 'Unnamed Resume',
          pdfUrl: activeResume.pdfPath,
          version: activeResume.version
        } : null,
        resumes: resumes.map(r => ({
          resumeId: r._id,
          name: r.structuredData?.personalInfo?.name || 'Unnamed Resume',
          pdfUrl: r.pdfPath,
          version: r.version,
          isActive: r.isActive,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt
        })),
        analyses: analyses.map(a => ({
          analysisId: a._id,
          companyName: a.companyName,
          jobRole: a.jobRole,
          score: a.feedback?.score || 0,
          createdAt: a.createdAt
        })),
        stats: {
          totalResumes: resumes.length,
          totalAnalyses: analyses.length,
          averageScore: analyses.length > 0 
            ? Math.round(analyses.reduce((sum, a) => sum + (a.feedback?.score || 0), 0) / analyses.length)
            : 0
        }
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    next(error);
  }
});

router.delete('/data', async (req, res, next) => {
  try {
    const sessionId = req.sessionId;

    const resumes = await Resume.find({ sessionId }).select('pdfPath');
    
    const fs = require('fs');
    const path = require('path');
    
    for (const resume of resumes) {
      if (resume.pdfPath) {
        const pdfPath = path.join(__dirname, '..', resume.pdfPath);
        if (fs.existsSync(pdfPath)) {
          fs.unlinkSync(pdfPath);
        }
      }
    }

    await Promise.all([
      Resume.deleteMany({ sessionId }),
      Analysis.deleteMany({ sessionId })
    ]);

    res.json({
      success: true,
      message: 'All session data deleted successfully'
    });
  } catch (error) {
    console.error('Delete session data error:', error);
    next(error);
  }
});

module.exports = router;
