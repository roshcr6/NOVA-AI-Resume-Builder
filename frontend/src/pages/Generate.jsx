import { useState, useEffect } from 'react';
import { resumeService } from '../services/api';
import { useApp } from '../context/AppContext';
import { Loader, ResumePreview, ChatSidebar, ResumeEditor } from '../components';

// Template options
const TEMPLATES = [
  { id: 'modern', name: 'Modern', desc: 'Clean with colored header bar', color: '#0D84E3' },
  { id: 'classic', name: 'Classic', desc: 'Traditional Times New Roman', color: '#1A1A4D' },
  { id: 'minimal', name: 'Minimal', desc: 'Simple and elegant', color: '#000000' },
  { id: 'creative', name: 'Creative', desc: 'Bold purple with orange accents', color: '#8F44AD' },
  { id: 'professional', name: 'Professional', desc: 'Dark blue with green accents', color: '#21446B' }
];

function Generate() {
  const { showToast, currentResume, setCurrentResume, fetchCurrentResume } = useApp();
  const [activeTab, setActiveTab] = useState('github');
  const [isLoading, setIsLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [pendingGeneration, setPendingGeneration] = useState(null);
  
  // GitHub form state
  const [githubUrl, setGithubUrl] = useState('');
  
  // Manual form state
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
    skills: '',
    experience: [{
      title: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      highlights: ''
    }],
    projects: [{
      name: '',
      description: '',
      technologies: '',
      url: '',
      github: ''
    }],
    education: [{
      degree: '',
      field: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: ''
    }],
    certifications: [{
      name: '',
      issuer: '',
      date: '',
      url: ''
    }]
  });

  useEffect(() => {
    fetchCurrentResume();
  }, [fetchCurrentResume]);

  // Show template modal before generating
  const handleGitHubSubmit = async (e) => {
    e.preventDefault();
    if (!githubUrl.trim()) {
      showToast('error', 'Please enter your GitHub URL');
      return;
    }
    setPendingGeneration({ source: 'github', githubUrl: githubUrl.trim() });
    setShowTemplateModal(true);
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    
    const processedData = {
      ...formData,
      skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
      experience: formData.experience.map(exp => ({
        ...exp,
        highlights: exp.highlights.split('\n').filter(Boolean)
      })),
      projects: formData.projects.map(proj => ({
        ...proj,
        technologies: proj.technologies.split(',').map(t => t.trim()).filter(Boolean)
      }))
    };

    setPendingGeneration({ source: 'manual', formData: processedData });
    setShowTemplateModal(true);
  };

  // Actual generation after template selection
  const handleGenerateWithTemplate = async () => {
    if (!pendingGeneration) return;
    
    setShowTemplateModal(false);
    setIsLoading(true);
    
    try {
      const response = await resumeService.generate({
        ...pendingGeneration,
        template: selectedTemplate
      });

      if (response.data.success) {
        setCurrentResume(response.data.data);
        showToast('success', 'Resume generated successfully!');
        // Don't auto-open chat - let user decide
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to generate resume';
      showToast('error', errorMsg);
    } finally {
      setIsLoading(false);
      setPendingGeneration(null);
    }
  };

  const handleEdit = async (resumeId, instruction) => {
    try {
      const response = await resumeService.edit(resumeId, instruction);
      if (response.data.success) {
        setCurrentResume(response.data.data);
        showToast('success', 'Resume updated successfully!');
        return response.data.data;
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to edit resume';
      showToast('error', errorMsg);
      throw error;
    }
  };

  const handleManualSave = async (updatedData) => {
    if (!currentResume?.resumeId) return;
    
    try {
      const response = await resumeService.updateDirect(currentResume.resumeId, updatedData);
      if (response.data.success) {
        setCurrentResume(response.data.data);
        showToast('success', 'Resume saved and regenerated!');
        setEditorOpen(false);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to save resume';
      showToast('error', errorMsg);
      throw error;
    }
  };

  // Toggle functions for sidebar panels
  const toggleChat = () => {
    setChatOpen(!chatOpen);
    if (!chatOpen) setEditorOpen(false); // Close editor when opening chat
  };

  const toggleEditor = () => {
    setEditorOpen(!editorOpen);
    if (!editorOpen) setChatOpen(false); // Close chat when opening editor
  };

  const updateFormField = (section, field, value, index = null) => {
    setFormData(prev => {
      if (index !== null) {
        const newArray = [...prev[section]];
        newArray[index] = { ...newArray[index], [field]: value };
        return { ...prev, [section]: newArray };
      }
      if (section === 'personalInfo') {
        return { ...prev, personalInfo: { ...prev.personalInfo, [field]: value } };
      }
      return { ...prev, [field]: value };
    });
  };

  const addArrayItem = (section, template) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...prev[section], template]
    }));
  };

  const removeArrayItem = (section, index) => {
    setFormData(prev => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index)
    }));
  };

  // Back to form (create new resume)
  const handleBackToForm = () => {
    setChatOpen(false);
    setEditorOpen(false);
    setCurrentResume(null);
    setGithubUrl('');
  };

  return (
    <div className="page-container">
      {/* Show form when no resume, or show resume view when resume exists */}
      {!currentResume ? (
        <>
          {/* Header */}
          <div className="mb-8">
            <h1 className="section-title">Generate Your Resume</h1>
            <p className="text-gray-600">
              Choose how you want to create your resume. Our AI will help you craft a professional document.
            </p>
          </div>

          {/* Form - Centered when no resume */}
          <div className="max-w-2xl mx-auto">
            {/* Source Tabs */}
          <div className="flex border-b border-white/10 mb-6">
            <button
              onClick={() => setActiveTab('github')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'github'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              From GitHub
            </button>
            <button
              onClick={() => setActiveTab('manual')}
              className={`px-6 py-3 font-medium border-b-2 transition-colors ${
                activeTab === 'manual'
                  ? 'border-indigo-500 text-indigo-400'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              Manual Entry
            </button>
          </div>

          {/* GitHub Form */}
          {activeTab === 'github' && (
            <form onSubmit={handleGitHubSubmit} className="card">
              <div className="mb-6">
                <label className="label">GitHub Profile URL</label>
                <input
                  type="text"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/username"
                  className="input-field"
                />
                <p className="text-sm text-gray-500 mt-2">
                  We'll analyze your repositories to generate a tailored resume.
                </p>
              </div>
              <button type="submit" disabled={isLoading} className="btn-primary w-full">
                {isLoading ? <Loader size="sm" text="" /> : 'Generate from GitHub'}
              </button>
            </form>
          )}

          {/* Manual Form */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="card max-h-[70vh] overflow-y-auto">
              {/* Personal Information */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Full Name *</label>
                    <input
                      type="text"
                      value={formData.personalInfo.name}
                      onChange={(e) => updateFormField('personalInfo', 'name', e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Email *</label>
                    <input
                      type="email"
                      value={formData.personalInfo.email}
                      onChange={(e) => updateFormField('personalInfo', 'email', e.target.value)}
                      className="input-field"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Phone</label>
                    <input
                      type="tel"
                      value={formData.personalInfo.phone}
                      onChange={(e) => updateFormField('personalInfo', 'phone', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">Location</label>
                    <input
                      type="text"
                      value={formData.personalInfo.location}
                      onChange={(e) => updateFormField('personalInfo', 'location', e.target.value)}
                      placeholder="City, Country"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">LinkedIn URL</label>
                    <input
                      type="url"
                      value={formData.personalInfo.linkedin}
                      onChange={(e) => updateFormField('personalInfo', 'linkedin', e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="label">GitHub URL</label>
                    <input
                      type="url"
                      value={formData.personalInfo.github}
                      onChange={(e) => updateFormField('personalInfo', 'github', e.target.value)}
                      className="input-field"
                    />
                  </div>
                </div>
              </div>

              {/* Skills */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4">Skills</h3>
                <label className="label">Skills (comma-separated)</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => updateFormField(null, 'skills', e.target.value)}
                  placeholder="JavaScript, React, Node.js, Python..."
                  className="input-field"
                />
              </div>

              {/* Experience */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Experience</h3>
                  <button
                    type="button"
                    onClick={() => addArrayItem('experience', {
                      title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '', highlights: ''
                    })}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                  >
                    + Add Experience
                  </button>
                </div>
                {formData.experience.map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Experience {index + 1}</span>
                      {formData.experience.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem('experience', index)}
                          className="text-red-500 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={exp.title}
                        onChange={(e) => updateFormField('experience', 'title', e.target.value, index)}
                        placeholder="Job Title"
                        className="input-field"
                      />
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateFormField('experience', 'company', e.target.value, index)}
                        placeholder="Company"
                        className="input-field"
                      />
                      <input
                        type="text"
                        value={exp.startDate}
                        onChange={(e) => updateFormField('experience', 'startDate', e.target.value, index)}
                        placeholder="Start Date (e.g., Jan 2022)"
                        className="input-field"
                      />
                      <input
                        type="text"
                        value={exp.endDate}
                        onChange={(e) => updateFormField('experience', 'endDate', e.target.value, index)}
                        placeholder="End Date or Present"
                        className="input-field"
                      />
                    </div>
                    <textarea
                      value={exp.description}
                      onChange={(e) => updateFormField('experience', 'description', e.target.value, index)}
                      placeholder="Job description..."
                      className="input-field mt-3"
                      rows={2}
                    />
                    <textarea
                      value={exp.highlights}
                      onChange={(e) => updateFormField('experience', 'highlights', e.target.value, index)}
                      placeholder="Key achievements (one per line)"
                      className="input-field mt-3"
                      rows={2}
                    />
                  </div>
                ))}
              </div>

              {/* Projects */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Projects</h3>
                  <button
                    type="button"
                    onClick={() => addArrayItem('projects', {
                      name: '', description: '', technologies: '', url: '', github: ''
                    })}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                  >
                    + Add Project
                  </button>
                </div>
                {formData.projects.map((proj, index) => (
                  <div key={index} className="border rounded-lg p-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Project {index + 1}</span>
                      {formData.projects.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem('projects', index)}
                          className="text-red-500 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={proj.name}
                      onChange={(e) => updateFormField('projects', 'name', e.target.value, index)}
                      placeholder="Project Name"
                      className="input-field mb-3"
                    />
                    <textarea
                      value={proj.description}
                      onChange={(e) => updateFormField('projects', 'description', e.target.value, index)}
                      placeholder="Project description..."
                      className="input-field mb-3"
                      rows={2}
                    />
                    <input
                      type="text"
                      value={proj.technologies}
                      onChange={(e) => updateFormField('projects', 'technologies', e.target.value, index)}
                      placeholder="Technologies (comma-separated)"
                      className="input-field"
                    />
                  </div>
                ))}
              </div>

              {/* Education */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Education</h3>
                  <button
                    type="button"
                    onClick={() => addArrayItem('education', {
                      degree: '', field: '', institution: '', location: '', startDate: '', endDate: '', gpa: ''
                    })}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                  >
                    + Add Education
                  </button>
                </div>
                {formData.education.map((edu, index) => (
                  <div key={index} className="border rounded-lg p-4 mb-4">
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Education {index + 1}</span>
                      {formData.education.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeArrayItem('education', index)}
                          className="text-red-500 text-sm"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={edu.degree}
                        onChange={(e) => updateFormField('education', 'degree', e.target.value, index)}
                        placeholder="Degree (e.g., Bachelor of Science)"
                        className="input-field"
                      />
                      <input
                        type="text"
                        value={edu.field}
                        onChange={(e) => updateFormField('education', 'field', e.target.value, index)}
                        placeholder="Field of Study"
                        className="input-field"
                      />
                      <input
                        type="text"
                        value={edu.institution}
                        onChange={(e) => updateFormField('education', 'institution', e.target.value, index)}
                        placeholder="Institution"
                        className="input-field"
                      />
                      <input
                        type="text"
                        value={edu.endDate}
                        onChange={(e) => updateFormField('education', 'endDate', e.target.value, index)}
                        placeholder="Graduation Year"
                        className="input-field"
                      />
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full">
                {isLoading ? <Loader size="sm" text="" /> : 'Generate Resume'}
              </button>
            </form>
          )}
          </div>
        </>
      ) : (
        /* Resume View - When resume is generated */
        <>
          {/* Header with back button */}
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToForm}
                className="p-2 rounded-lg bg-white/10 text-gray-400 hover:text-white hover:bg-white/20 transition-colors"
                title="Create New Resume"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Your Resume</h1>
                <p className="text-gray-400 text-sm">Edit with AI or manually, then download</p>
              </div>
            </div>
            
            {/* Action buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleEditor}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  editorOpen 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white/10 text-gray-300 hover:text-white hover:bg-white/20'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Manually
              </button>
              <button
                onClick={toggleChat}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  chatOpen 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-white/10 text-gray-300 hover:text-white hover:bg-white/20'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                AI Assistant
              </button>
            </div>
          </div>

          {/* Main content area */}
          <div className="flex gap-4">
            {/* PDF Preview - takes more space when panels closed */}
            <div className={`transition-all duration-300 ${(chatOpen || editorOpen) ? 'flex-1 min-w-0' : 'w-full'}`}>
              <ResumePreview
                resumeData={currentResume.structuredData}
                pdfUrl={currentResume.pdfUrl}
              />
            </div>

            {/* Side Panel - Chat or Editor */}
            {(chatOpen || editorOpen) && (
              <div className="w-[360px] shrink-0 h-[calc(100vh-12rem)]">
                {chatOpen && (
                  <div className="h-full bg-[#0f0f0f] rounded-lg border border-white/10 shadow-xl flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                      <h3 className="font-semibold text-white">AI Edit Assistant</h3>
                      <button onClick={toggleChat} className="text-gray-400 hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                    <ChatSidebar
                      resumeId={currentResume?.resumeId}
                      onEdit={handleEdit}
                      isOpen={true}
                      onToggle={toggleChat}
                      embedded={true}
                    />
                  </div>
                )}
                {editorOpen && (
                  <div className="h-full bg-[#0f0f0f] rounded-lg border border-white/10 shadow-xl overflow-hidden">
                    <ResumeEditor
                      resumeData={currentResume?.structuredData}
                      onSave={handleManualSave}
                      onClose={toggleEditor}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="card max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-4">Choose a Template</h2>
            <p className="text-gray-400 mb-6">Select a resume template style</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {TEMPLATES.map((template) => (
                <div
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedTemplate === template.id
                      ? 'border-indigo-500 bg-indigo-500/20'
                      : 'border-white/10 hover:border-white/30 bg-white/5'
                  }`}
                >
                  <div
                    className="h-24 rounded mb-3 flex items-end p-2"
                    style={{ backgroundColor: template.color }}
                  >
                    <div className="w-full">
                      <div className="h-2 bg-white bg-opacity-50 rounded mb-1 w-3/4"></div>
                      <div className="h-2 bg-white bg-opacity-30 rounded w-1/2"></div>
                    </div>
                  </div>
                  <h3 className="font-semibold text-white">{template.name}</h3>
                  <p className="text-sm text-gray-400">{template.desc}</p>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTemplateModal(false);
                  setPendingGeneration(null);
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateWithTemplate}
                className="btn-primary"
              >
                Generate with {TEMPLATES.find(t => t.id === selectedTemplate)?.name} Template
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Generate;
