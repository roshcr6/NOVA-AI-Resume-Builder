import { useState } from 'react';

function ResumePreview({ resumeData, pdfUrl }) {
  const [activeTab, setActiveTab] = useState('pdf');
  const [downloading, setDownloading] = useState(false);
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || '';
  const fullPdfUrl = pdfUrl?.startsWith('http') ? pdfUrl : `${baseUrl}${pdfUrl}`;

  const handleDownload = async () => {
    if (!pdfUrl) return;
    
    setDownloading(true);
    try {
      const response = await fetch(fullPdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `resume_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct link
      window.open(fullPdfUrl, '_blank');
    } finally {
      setDownloading(false);
    }
  };

  if (!resumeData) {
    return (
      <div className="card flex items-center justify-center h-96">
        <p className="text-gray-500">No resume data available</p>
      </div>
    );
  }

  const { personalInfo, summary, skills, experience, projects, education, certifications } = resumeData;

  return (
    <div className="card">
      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'preview'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          Preview
        </button>
        <button
          onClick={() => setActiveTab('pdf')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            activeTab === 'pdf'
              ? 'border-indigo-500 text-indigo-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          PDF View
        </button>
      </div>

      {activeTab === 'preview' ? (
        <div className="space-y-6 max-h-[calc(100vh-16rem)] min-h-[600px] overflow-y-auto pr-2">
          {/* Personal Info */}
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-white">
              {personalInfo?.name || 'Your Name'}
            </h2>
            <div className="flex flex-wrap gap-2 mt-2 text-sm text-gray-600">
              {personalInfo?.email && <span>{personalInfo.email}</span>}
              {personalInfo?.phone && <span>• {personalInfo.phone}</span>}
              {personalInfo?.location && <span>• {personalInfo.location}</span>}
            </div>
            <div className="flex flex-wrap gap-3 mt-2">
              {personalInfo?.linkedin && (
                <a href={personalInfo.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline">
                  LinkedIn
                </a>
              )}
              {personalInfo?.github && (
                <a href={personalInfo.github} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline">
                  GitHub
                </a>
              )}
              {personalInfo?.portfolio && (
                <a href={personalInfo.portfolio} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-400 hover:underline">
                  Portfolio
                </a>
              )}
            </div>
          </div>

          {/* Summary */}
          {summary && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Professional Summary</h3>
              <p className="text-gray-700">{summary}</p>
            </div>
          )}

          {/* Skills */}
          {skills && skills.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Skills</h3>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span key={index} className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {experience && experience.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Experience</h3>
              <div className="space-y-4">
                {experience.map((exp, index) => (
                  <div key={index} className="border-l-2 border-indigo-500 pl-4">
                    <h4 className="font-medium text-white">{exp.title}</h4>
                    <p className="text-sm text-gray-600">
                      {exp.company}{exp.location ? ` • ${exp.location}` : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </p>
                    {exp.description && (
                      <p className="text-gray-700 mt-1">{exp.description}</p>
                    )}
                    {exp.highlights && exp.highlights.length > 0 && (
                      <ul className="list-disc list-inside mt-2 text-sm text-gray-600">
                        {exp.highlights.map((highlight, i) => (
                          <li key={i}>{highlight}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects */}
          {projects && projects.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Projects</h3>
              <div className="space-y-3">
                {projects.map((project, index) => (
                  <div key={index} className="bg-white/5 rounded-lg p-3">
                    <h4 className="font-medium text-white">{project.name}</h4>
                    {project.description && (
                      <p className="text-sm text-gray-700 mt-1">{project.description}</p>
                    )}
                    {project.technologies && project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {project.technologies.map((tech, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-200 text-gray-600 rounded text-xs">
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {education && education.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-3">Education</h3>
              <div className="space-y-3">
                {education.map((edu, index) => (
                  <div key={index}>
                    <h4 className="font-medium text-white">
                      {edu.degree}{edu.field ? ` in ${edu.field}` : ''}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {edu.institution}{edu.location ? ` • ${edu.location}` : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      {edu.startDate} - {edu.endDate}
                      {edu.gpa ? ` • GPA: ${edu.gpa}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {certifications && certifications.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Certifications</h3>
              <ul className="list-disc list-inside text-gray-700">
                {certifications.map((cert, index) => (
                  <li key={index}>
                    {cert.name}
                    {cert.issuer ? ` - ${cert.issuer}` : ''}
                    {cert.date ? ` (${cert.date})` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <div className="h-[calc(100vh-16rem)] min-h-[700px]">
          {pdfUrl ? (
            <iframe
              src={`${fullPdfUrl}#zoom=page-fit&view=FitH`}
              className="w-full h-full rounded-lg border border-white/10"
              title="Resume PDF"
              style={{ minHeight: '700px' }}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              PDF not available
            </div>
          )}
        </div>
      )}

      {/* Download Button */}
      {pdfUrl && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="btn-primary flex items-center space-x-2"
          >
            {downloading ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                </svg>
                <span>Downloading...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default ResumePreview;
