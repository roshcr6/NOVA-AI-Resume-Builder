import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { sessionService, resumeService, analysisService } from '../services/api';
import { useApp } from '../context/AppContext';
import { Loader, ResumePreview } from '../components';

function Profile() {
  const navigate = useNavigate();
  const { showToast, sessionId, clearSession, setCurrentResume } = useApp();
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [selectedResume, setSelectedResume] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await sessionService.getProfile();
      if (response.data.success) {
        setProfile(response.data.data);
        if (response.data.data.activeResume) {
          const resumeResponse = await resumeService.getById(response.data.data.activeResume.resumeId);
          if (resumeResponse.data.success) {
            setSelectedResume(resumeResponse.data.data);
          }
        }
      }
    } catch (error) {
      showToast('error', 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateResume = async (resumeId) => {
    try {
      await resumeService.activate(resumeId);
      showToast('success', 'Resume activated');
      fetchProfile();
    } catch (error) {
      showToast('error', 'Failed to activate resume');
    }
  };

  const handleDeleteResume = async (resumeId) => {
    try {
      await resumeService.delete(resumeId);
      showToast('success', 'Resume deleted');
      fetchProfile();
    } catch (error) {
      showToast('error', 'Failed to delete resume');
    }
  };

  const handleViewResume = async (resumeId) => {
    try {
      const response = await resumeService.getById(resumeId);
      if (response.data.success) {
        setSelectedResume(response.data.data);
      }
    } catch (error) {
      showToast('error', 'Failed to load resume');
    }
  };

  const handleDeleteAllData = async () => {
    setIsDeleting(true);
    try {
      await sessionService.deleteData();
      showToast('success', 'All data deleted successfully');
      setProfile(null);
      setSelectedResume(null);
      setCurrentResume(null);
      setShowDeleteConfirm(false);
      fetchProfile();
    } catch (error) {
      showToast('error', 'Failed to delete data');
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="page-container flex items-center justify-center min-h-[60vh]">
        <Loader size="lg" text="Loading profile..." />
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="section-title">Your Profile</h1>
        <p className="text-gray-600">
          Manage your resumes and view your activity history.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left Column - Stats & Resumes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Session Info */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Session Info</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Session ID:</span>
                <span className="font-mono text-gray-400 truncate max-w-[150px]" title={sessionId}>
                  {sessionId?.substring(0, 8)}...
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created:</span>
                <span className="text-gray-400">
                  {profile?.session?.createdAt 
                    ? new Date(profile.session.createdAt).toLocaleDateString() 
                    : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-indigo-500/20 rounded-lg">
                <p className="text-3xl font-bold text-indigo-400">
                  {profile?.stats?.totalResumes || 0}
                </p>
                <p className="text-sm text-gray-600">Resumes</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-3xl font-bold text-green-600">
                  {profile?.stats?.totalAnalyses || 0}
                </p>
                <p className="text-sm text-gray-600">Analyses</p>
              </div>
            </div>
            {profile?.stats?.averageScore > 0 && (
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-500">Average ATS Score</p>
                <p className="text-2xl font-bold text-indigo-400">
                  {profile.stats.averageScore}/100
                </p>
              </div>
            )}
          </div>

          {/* Resume List */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Your Resumes</h3>
              <button
                onClick={() => navigate('/generate')}
                className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
              >
                + New
              </button>
            </div>
            
            {profile?.resumes?.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {profile.resumes.map((resume) => (
                  <div
                    key={resume.resumeId}
                    className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                      resume.isActive 
                        ? 'border-indigo-500 bg-indigo-500/20' 
                        : 'border-white/10 hover:border-indigo-500/50'
                    }`}
                    onClick={() => handleViewResume(resume.resumeId)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-white truncate">
                          {resume.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          v{resume.version} • {new Date(resume.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {resume.isActive && (
                          <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded">
                            Active
                          </span>
                        )}
                        {!resume.isActive && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleActivateResume(resume.resumeId);
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300"
                          >
                            Activate
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteResume(resume.resumeId);
                          }}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                No resumes yet. Create one to get started!
              </p>
            )}
          </div>

          {/* Analysis History */}
          <div className="card">
            <h3 className="font-semibold text-white mb-4">Recent Analyses</h3>
            {profile?.analyses?.length > 0 ? (
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {profile.analyses.slice(0, 5).map((analysis) => (
                  <div key={analysis.analysisId} className="flex items-center justify-between py-2 border-b last:border-0">
                    <div>
                      <p className="font-medium text-white text-sm">
                        {analysis.jobRole}
                      </p>
                      <p className="text-xs text-gray-500">
                        {analysis.companyName}
                      </p>
                    </div>
                    <div className={`px-2 py-1 rounded text-sm font-medium ${
                      analysis.score >= 70 ? 'bg-green-100 text-green-700' :
                      analysis.score >= 50 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {analysis.score}/100
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm text-center py-4">
                No analyses yet. Try analyzing your resume!
              </p>
            )}
          </div>

          {/* Danger Zone */}
          <div className="card border-red-200">
            <h3 className="font-semibold text-red-600 mb-4">Danger Zone</h3>
            <p className="text-sm text-gray-600 mb-4">
              Delete all your data including resumes and analyses. This action cannot be undone.
            </p>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-2 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white rounded-lg font-medium transition-colors"
            >
              Delete All Data
            </button>
          </div>
        </div>

        {/* Right Column - Resume Preview */}
        <div className="lg:col-span-2">
          {selectedResume ? (
            <ResumePreview
              resumeData={selectedResume.structuredData}
              pdfUrl={selectedResume.pdfUrl}
            />
          ) : (
            <div className="card flex flex-col items-center justify-center h-96 text-center">
              <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <h3 className="text-xl font-semibold text-gray-400 mb-2">Select a Resume</h3>
              <p className="text-gray-500">
                Click on a resume from the list to preview it here.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Confirm Deletion</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete all your data? This will permanently remove all your resumes and analyses. This action cannot be undone.
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 btn-secondary"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAllData}
                disabled={isDeleting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
