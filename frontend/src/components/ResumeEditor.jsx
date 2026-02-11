import { useState, useEffect } from 'react';

function ResumeEditor({ resumeData, onSave, onClose }) {
  const [formData, setFormData] = useState({
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
  });
  const [activeSection, setActiveSection] = useState('personalInfo');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (resumeData) {
      setFormData({
        personalInfo: resumeData.personalInfo || {},
        summary: resumeData.summary || '',
        skills: resumeData.skills || [],
        experience: resumeData.experience || [],
        projects: resumeData.projects || [],
        education: resumeData.education || [],
        certifications: resumeData.certifications || []
      });
    }
  }, [resumeData]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(formData);
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (section, field, value, index = null) => {
    setFormData(prev => {
      if (index !== null && Array.isArray(prev[section])) {
        const newArray = [...prev[section]];
        newArray[index] = { ...newArray[index], [field]: value };
        return { ...prev, [section]: newArray };
      }
      if (section === 'personalInfo') {
        return { ...prev, personalInfo: { ...prev.personalInfo, [field]: value } };
      }
      if (field === null) {
        return { ...prev, [section]: value };
      }
      return { ...prev, [field]: value };
    });
  };

  const addItem = (section, template) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...(prev[section] || []), template]
    }));
  };

  const removeItem = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  const sections = [
    { id: 'personalInfo', label: 'Personal Info', icon: '👤' },
    { id: 'summary', label: 'Summary', icon: '📝' },
    { id: 'skills', label: 'Skills', icon: '🛠️' },
    { id: 'experience', label: 'Experience', icon: '💼' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'certifications', label: 'Certifications', icon: '📜' }
  ];

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
        <h3 className="font-semibold text-white text-lg">Edit Resume</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex overflow-x-auto p-2 border-b border-white/10 shrink-0 gap-1">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeSection === section.id
                ? 'bg-indigo-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <span className="mr-1">{section.icon}</span>
            {section.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Personal Info */}
        {activeSection === 'personalInfo' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={formData.personalInfo.name || ''}
                  onChange={(e) => updateField('personalInfo', 'name', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.personalInfo.email || ''}
                  onChange={(e) => updateField('personalInfo', 'email', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.personalInfo.phone || ''}
                  onChange={(e) => updateField('personalInfo', 'phone', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Location</label>
                <input
                  type="text"
                  value={formData.personalInfo.location || ''}
                  onChange={(e) => updateField('personalInfo', 'location', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">LinkedIn</label>
                <input
                  type="url"
                  value={formData.personalInfo.linkedin || ''}
                  onChange={(e) => updateField('personalInfo', 'linkedin', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">GitHub</label>
                <input
                  type="url"
                  value={formData.personalInfo.github || ''}
                  onChange={(e) => updateField('personalInfo', 'github', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm text-gray-400 mb-1">Portfolio</label>
                <input
                  type="url"
                  value={formData.personalInfo.portfolio || ''}
                  onChange={(e) => updateField('personalInfo', 'portfolio', e.target.value)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {activeSection === 'summary' && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Professional Summary</label>
            <textarea
              value={formData.summary || ''}
              onChange={(e) => updateField('summary', null, e.target.value)}
              rows={6}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none resize-none"
              placeholder="Write a compelling summary of your professional background..."
            />
          </div>
        )}

        {/* Skills */}
        {activeSection === 'skills' && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Skills (one per line or comma-separated)</label>
            <textarea
              value={Array.isArray(formData.skills) ? formData.skills.join(', ') : formData.skills}
              onChange={(e) => {
                const skills = e.target.value.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
                updateField('skills', null, skills);
              }}
              rows={8}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none resize-none"
              placeholder="JavaScript, React, Node.js, Python..."
            />
            <div className="mt-4 flex flex-wrap gap-2">
              {formData.skills.map((skill, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-indigo-600/30 text-indigo-300 rounded-full text-sm flex items-center gap-2"
                >
                  {skill}
                  <button
                    onClick={() => {
                      const newSkills = formData.skills.filter((_, i) => i !== index);
                      updateField('skills', null, newSkills);
                    }}
                    className="hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {activeSection === 'experience' && (
          <div className="space-y-4">
            <button
              onClick={() => addItem('experience', {
                title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '', highlights: []
              })}
              className="w-full py-2 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition-colors"
            >
              + Add Experience
            </button>
            {formData.experience.map((exp, index) => (
              <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-indigo-400">Experience {index + 1}</span>
                  <button
                    onClick={() => removeItem('experience', index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={exp.title || ''}
                    onChange={(e) => updateField('experience', 'title', e.target.value, index)}
                    placeholder="Job Title"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={exp.company || ''}
                    onChange={(e) => updateField('experience', 'company', e.target.value, index)}
                    placeholder="Company"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={exp.location || ''}
                    onChange={(e) => updateField('experience', 'location', e.target.value, index)}
                    placeholder="Location"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={exp.startDate || ''}
                      onChange={(e) => updateField('experience', 'startDate', e.target.value, index)}
                      placeholder="Start Date"
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                    />
                    <input
                      type="text"
                      value={exp.endDate || ''}
                      onChange={(e) => updateField('experience', 'endDate', e.target.value, index)}
                      placeholder="End Date"
                      className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
                <textarea
                  value={exp.description || ''}
                  onChange={(e) => updateField('experience', 'description', e.target.value, index)}
                  placeholder="Job description..."
                  rows={2}
                  className="mt-3 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm resize-none"
                />
                <textarea
                  value={Array.isArray(exp.highlights) ? exp.highlights.join('\n') : exp.highlights || ''}
                  onChange={(e) => updateField('experience', 'highlights', e.target.value.split('\n').filter(Boolean), index)}
                  placeholder="Achievements/highlights (one per line)..."
                  rows={3}
                  className="mt-2 w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm resize-none"
                />
              </div>
            ))}
          </div>
        )}

        {/* Projects */}
        {activeSection === 'projects' && (
          <div className="space-y-4">
            <button
              onClick={() => addItem('projects', {
                name: '', description: '', technologies: [], url: '', github: ''
              })}
              className="w-full py-2 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition-colors"
            >
              + Add Project
            </button>
            {formData.projects.map((proj, index) => (
              <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-indigo-400">Project {index + 1}</span>
                  <button
                    onClick={() => removeItem('projects', index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={proj.name || ''}
                    onChange={(e) => updateField('projects', 'name', e.target.value, index)}
                    placeholder="Project Name"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <textarea
                    value={proj.description || ''}
                    onChange={(e) => updateField('projects', 'description', e.target.value, index)}
                    placeholder="Project description..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm resize-none"
                  />
                  <input
                    type="text"
                    value={Array.isArray(proj.technologies) ? proj.technologies.join(', ') : proj.technologies || ''}
                    onChange={(e) => updateField('projects', 'technologies', e.target.value.split(',').map(t => t.trim()).filter(Boolean), index)}
                    placeholder="Technologies (comma-separated)"
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="url"
                      value={proj.url || ''}
                      onChange={(e) => updateField('projects', 'url', e.target.value, index)}
                      placeholder="Live URL"
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                    />
                    <input
                      type="url"
                      value={proj.github || ''}
                      onChange={(e) => updateField('projects', 'github', e.target.value, index)}
                      placeholder="GitHub URL"
                      className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Education */}
        {activeSection === 'education' && (
          <div className="space-y-4">
            <button
              onClick={() => addItem('education', {
                degree: '', field: '', institution: '', location: '', startDate: '', endDate: '', gpa: ''
              })}
              className="w-full py-2 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition-colors"
            >
              + Add Education
            </button>
            {formData.education.map((edu, index) => (
              <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-indigo-400">Education {index + 1}</span>
                  <button
                    onClick={() => removeItem('education', index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={edu.degree || ''}
                    onChange={(e) => updateField('education', 'degree', e.target.value, index)}
                    placeholder="Degree (e.g., Bachelor's)"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={edu.field || ''}
                    onChange={(e) => updateField('education', 'field', e.target.value, index)}
                    placeholder="Field of Study"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={edu.institution || ''}
                    onChange={(e) => updateField('education', 'institution', e.target.value, index)}
                    placeholder="Institution"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={edu.location || ''}
                    onChange={(e) => updateField('education', 'location', e.target.value, index)}
                    placeholder="Location"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={edu.startDate || ''}
                    onChange={(e) => updateField('education', 'startDate', e.target.value, index)}
                    placeholder="Start Year"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={edu.endDate || ''}
                    onChange={(e) => updateField('education', 'endDate', e.target.value, index)}
                    placeholder="End Year"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={edu.gpa || ''}
                    onChange={(e) => updateField('education', 'gpa', e.target.value, index)}
                    placeholder="GPA (optional)"
                    className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certifications */}
        {activeSection === 'certifications' && (
          <div className="space-y-4">
            <button
              onClick={() => addItem('certifications', {
                name: '', issuer: '', date: '', url: ''
              })}
              className="w-full py-2 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:text-white hover:border-white/40 transition-colors"
            >
              + Add Certification
            </button>
            {formData.certifications.map((cert, index) => (
              <div key={index} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm font-medium text-indigo-400">Certification {index + 1}</span>
                  <button
                    onClick={() => removeItem('certifications', index)}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={cert.name || ''}
                    onChange={(e) => updateField('certifications', 'name', e.target.value, index)}
                    placeholder="Certification Name"
                    className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={cert.issuer || ''}
                    onChange={(e) => updateField('certifications', 'issuer', e.target.value, index)}
                    placeholder="Issuing Organization"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <input
                    type="text"
                    value={cert.date || ''}
                    onChange={(e) => updateField('certifications', 'date', e.target.value, index)}
                    placeholder="Date Obtained"
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                  <input
                    type="url"
                    value={cert.url || ''}
                    onChange={(e) => updateField('certifications', 'url', e.target.value, index)}
                    placeholder="Credential URL (optional)"
                    className="col-span-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-indigo-500 focus:outline-none text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ResumeEditor;
