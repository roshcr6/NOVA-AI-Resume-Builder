const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  resumeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resume',
    required: false
  },
  uploadedPdfPath: {
    type: String,
    default: ''
  },
  companyName: {
    type: String,
    required: true
  },
  jobRole: {
    type: String,
    required: true
  },
  jobDescription: {
    type: String,
    default: ''
  },
  resumeText: {
    type: String,
    default: ''
  },
  feedback: {
    score: {
      type: Number,
      min: 0,
      max: 100,
      required: true
    },
    missingSkills: [{
      type: String
    }],
    weakPoints: [{
      type: String
    }],
    atsIssues: [{
      type: String
    }],
    improvementSuggestions: [{
      type: String
    }]
  }
}, {
  timestamps: true
});

analysisSchema.index({ sessionId: 1, createdAt: -1 });

module.exports = mongoose.model('Analysis', analysisSchema);
