import { useState, useEffect } from 'react';
import { analysisService } from '../services/api';
import { useApp } from '../context/AppContext';
import { Loader, FileUpload } from '../components';

function Analyze() {
  const { showToast, currentResume, fetchCurrentResume } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [file, setFile] = useState(null);
  const [originalResume, setOriginalResume] = useState(null);
  const [fixedResume, setFixedResume] = useState(null);
  const [originalPdfUrl, setOriginalPdfUrl] = useState(null);
  const [fixedPdfUrl, setFixedPdfUrl] = useState(null);
  const [showComparison, setShowComparison] = useState(false);
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  
  const [formData, setFormData] = useState({
    companyName: '',
    jobRole: '',
    jobDescription: ''
  });

  useEffect(() => {
    fetchCurrentResume();
  }, [fetchCurrentResume]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.jobRole) {
      showToast('error', 'Please fill in company name and job role');
      return;
    }

    if (!file && !currentResume) {
      showToast('error', 'Please upload a resume or generate one first');
      return;
    }

    setIsLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('companyName', formData.companyName);
      submitData.append('jobRole', formData.jobRole);
      submitData.append('jobDescription', formData.jobDescription);
      
      if (file) {
        submitData.append('resume', file);
      } else if (currentResume?.resumeId) {
        submitData.append('resumeId', currentResume.resumeId);
      }

      const response = await analysisService.analyze(submitData);
      
      if (response.data.success) {
        setAnalysis(response.data.data);
        showToast('success', 'Resume analyzed successfully!');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to analyze resume';
      showToast('error', errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFix = async () => {
    if (!analysis) return;
    
    // Store original resume data before fixing
    setOriginalResume(JSON.parse(JSON.stringify(currentResume?.structuredData || {})));
    
    setIsFixing(true);
    try {
      const response = await analysisService.fix({
        analysisId: analysis.analysisId,
        jobRole: formData.jobRole,
        jobDescription: formData.jobDescription
      });

      if (response.data.success) {
        const data = response.data.data;
        setFixedResume(data?.structuredData || data);
        
        // Use original PDF URL from the API response (backend preserves it)
        const origPdfUrl = data?.originalPdfUrl;
        setOriginalPdfUrl(origPdfUrl?.startsWith('http') ? origPdfUrl : `${baseUrl}${origPdfUrl}`);
        
        const newPdfUrl = data?.pdfUrl;
        setFixedPdfUrl(newPdfUrl?.startsWith('http') ? newPdfUrl : `${baseUrl}${newPdfUrl}`);
        setShowComparison(true);
        showToast('success', 'Resume optimized! See the comparison below.');
        await fetchCurrentResume();
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to fix resume';
      showToast('error', errorMsg);
    } finally {
      setIsFixing(false);
    }
  };

  // Helper to find differences between text
  const findDifferences = (oldText, newText) => {
    if (!oldText && !newText) return { changed: false };
    if (!oldText) return { changed: true, isNew: true };
    if (!newText) return { changed: true, isRemoved: true };
    return { changed: String(oldText).trim() !== String(newText).trim() };
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    if (score >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Improvement';
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="section-title">Resume Analyzer</h1>
        <p className="text-gray-600">
          Get your resume analyzed for ATS compatibility and receive actionable improvement suggestions.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-6">
          <form onSubmit={handleSubmit} className="card">
            <h3 className="text-lg font-semibold mb-4">Analysis Details</h3>
            
            <div className="mb-4">
              <label className="label">Company Name *</label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="e.g., Google, Microsoft, Startup Inc."
                className="input-field"
                required
              />
            </div>

            <div className="mb-4">
              <label className="label">Job Role *</label>
              <input
                type="text"
                value={formData.jobRole}
                onChange={(e) => setFormData({ ...formData, jobRole: e.target.value })}
                placeholder="e.g., Senior Software Engineer"
                className="input-field"
                required
              />
            </div>

            <div className="mb-6">
              <label className="label">Job Description (Optional)</label>
              <textarea
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder="Paste the job description here for more accurate analysis..."
                className="input-field"
                rows={4}
              />
            </div>

            <div className="mb-6">
              <FileUpload
                onFileSelect={setFile}
                label="Upload Resume (PDF)"
              />
              {!file && currentResume && (
                <p className="text-sm text-green-600 mt-2">
                  Using your current active resume for analysis.
                </p>
              )}
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader size="sm" text="" />
                  <span className="ml-2">Analyzing...</span>
                </div>
              ) : (
                'Analyze Resume'
              )}
            </button>
          </form>

          {/* Tips */}
          <div className="card bg-blue-50 border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">Tips for Better Results</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Include the full job description for more accurate analysis</li>
              <li>• Make sure your resume is in PDF format</li>
              <li>• Use a clean, ATS-friendly resume format</li>
            </ul>
          </div>
        </div>

        {/* Right Column - Results */}
        <div>
          {analysis ? (
            <div className="space-y-6">
              {/* Score Card */}
              <div className="card text-center">
                <h3 className="text-lg font-semibold mb-4">ATS Compatibility Score</h3>
                <div className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${getScoreColor(analysis.feedback.score)}`}>
                  <div>
                    <span className="text-4xl font-bold">{analysis.feedback.score}</span>
                    <span className="text-lg">/100</span>
                  </div>
                </div>
                <p className={`mt-4 text-lg font-medium ${getScoreColor(analysis.feedback.score).split(' ')[0]}`}>
                  {getScoreLabel(analysis.feedback.score)}
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  For {analysis.jobRole} at {analysis.companyName}
                </p>
              </div>

              {/* Missing Skills */}
              {analysis.feedback.missingSkills?.length > 0 && (
                <div className="card">
                  <h4 className="font-semibold text-white mb-3 flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Missing Skills
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.feedback.missingSkills.map((skill, index) => (
                      <span key={index} className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Weak Points */}
              {analysis.feedback.weakPoints?.length > 0 && (
                <div className="card">
                  <h4 className="font-semibold text-white mb-3 flex items-center">
                    <svg className="w-5 h-5 text-orange-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    Weak Points
                  </h4>
                  <ul className="space-y-2">
                    {analysis.feedback.weakPoints.map((point, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-400">{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ATS Issues */}
              {analysis.feedback.atsIssues?.length > 0 && (
                <div className="card">
                  <h4 className="font-semibold text-white mb-3 flex items-center">
                    <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    ATS Compatibility Issues
                  </h4>
                  <ul className="space-y-2">
                    {analysis.feedback.atsIssues.map((issue, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-400">{issue}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Improvement Suggestions */}
              {analysis.feedback.improvementSuggestions?.length > 0 && (
                <div className="card">
                  <h4 className="font-semibold text-white mb-3 flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Improvement Suggestions
                  </h4>
                  <ul className="space-y-2">
                    {analysis.feedback.improvementSuggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-start">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        <span className="text-gray-400">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Fix Resume Button */}
              {(currentResume || analysis?.uploadedPdf) && !showComparison && (
                <button
                  onClick={handleFix}
                  disabled={isFixing}
                  className="btn-primary w-full py-3"
                >
                  {isFixing ? (
                    <div className="flex items-center justify-center">
                      <Loader size="sm" text="" />
                      <span className="ml-2">Optimizing Resume...</span>
                    </div>
                  ) : (
                    'Fix Resume with AI'
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="card flex flex-col items-center justify-center h-96 text-center">
              <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Analysis Yet</h3>
              <p className="text-gray-500">
                Fill in the job details and upload your resume to get started.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Before/After Comparison Modal */}
      {showComparison && originalPdfUrl && fixedPdfUrl && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex flex-col z-50">
          <div className="flex-1 flex flex-col h-full">
            <div className="p-4 border-b border-white/10 flex justify-between items-center shrink-0">
              <div>
                <h2 className="text-xl font-bold text-white">Resume Comparison: Before vs After</h2>
                <p className="text-sm text-gray-400">Your updated resume is now active in your profile</p>
              </div>
              <button 
                onClick={() => setShowComparison(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="flex-1 grid md:grid-cols-2 gap-4 p-4 min-h-0">
              {/* Before Column */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <h3 className="text-lg font-semibold text-red-400 flex items-center">
                    <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                    Before (Original)
                  </h3>
                  <a
                    href={originalPdfUrl}
                    download="resume_before.pdf"
                    className="text-sm text-red-400 hover:text-red-300 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </a>
                </div>
                <div className="flex-1 bg-red-500/10 rounded-lg overflow-hidden border-2 border-red-500/30 min-h-0">
                  <iframe
                    src={originalPdfUrl}
                    className="w-full h-full"
                    title="Original Resume PDF"
                    style={{ minHeight: '100%' }}
                  />
                </div>
              </div>

              {/* After Column */}
              <div className="flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-3 shrink-0">
                  <h3 className="text-lg font-semibold text-green-400 flex items-center">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    After (Optimized) ✨
                  </h3>
                  <a
                    href={fixedPdfUrl}
                    download="resume_after.pdf"
                    className="text-sm text-green-400 hover:text-green-300 flex items-center"
                  >
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download
                  </a>
                </div>
                <div className="flex-1 bg-green-500/10 rounded-lg overflow-hidden border-2 border-green-500/30 min-h-0">
                  <iframe
                    src={fixedPdfUrl}
                    className="w-full h-full"
                    title="Optimized Resume PDF"
                    style={{ minHeight: '100%' }}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-white/10 bg-white/5 flex justify-between items-center shrink-0">
              <p className="text-sm text-gray-400">
                The <span className="font-medium text-green-400">optimized version</span> is now your active resume. You can download or use it in job applications.
              </p>
              <button 
                onClick={() => setShowComparison(false)}
                className="btn-primary"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Analyze;
