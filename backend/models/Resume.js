const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  structuredData: {
    personalInfo: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      linkedin: { type: String, default: '' },
      github: { type: String, default: '' },
      portfolio: { type: String, default: '' }
    },
    summary: { type: String, default: '' },
    skills: [{ type: String }],
    experience: [{
      title: { type: String, default: '' },
      company: { type: String, default: '' },
      location: { type: String, default: '' },
      startDate: { type: String, default: '' },
      endDate: { type: String, default: '' },
      current: { type: Boolean, default: false },
      description: { type: String, default: '' },
      highlights: [{ type: String }]
    }],
    projects: [{
      name: { type: String, default: '' },
      description: { type: String, default: '' },
      technologies: [{ type: String }],
      url: { type: String, default: '' },
      github: { type: String, default: '' }
    }],
    education: [{
      degree: { type: String, default: '' },
      field: { type: String, default: '' },
      institution: { type: String, default: '' },
      location: { type: String, default: '' },
      startDate: { type: String, default: '' },
      endDate: { type: String, default: '' },
      gpa: { type: String, default: '' }
    }],
    certifications: [{
      name: { type: String, default: '' },
      issuer: { type: String, default: '' },
      date: { type: String, default: '' },
      url: { type: String, default: '' }
    }]
  },
  pdfPath: {
    type: String,
    default: ''
  },
  template: {
    type: String,
    default: 'modern'
  },
  customStyles: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  version: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

resumeSchema.index({ sessionId: 1, isActive: 1 });
resumeSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Resume', resumeSchema);
