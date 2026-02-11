import { useState, useEffect } from 'react';
import { jobService } from '../services/api';
import { useApp } from '../context/AppContext';
import { Loader, JobCard } from '../components';

function JobApply() {
  const { showToast, currentResume, fetchCurrentResume } = useApp();
  const [isSearching, setIsSearching] = useState(false);
  const [isApplying, setIsApplying] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [emailPreview, setEmailPreview] = useState(null);
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  const [searchParams, setSearchParams] = useState({
    role: '',
    location: '',
    remote: false
  });

  useEffect(() => {
    fetchCurrentResume();
  }, [fetchCurrentResume]);

  const handleSearch = async (e) => {
    e.preventDefault();
    
    setIsSearching(true);
    try {
      const response = await jobService.search({
        role: searchParams.role,
        location: searchParams.location,
        remote: searchParams.remote
      });

      if (response.data.success) {
        setJobs(response.data.data.jobs || []);
        if (response.data.data.isMockData) {
          showToast('info', 'Showing sample jobs. Configure Adzuna API for real job listings.');
        }
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to search jobs';
      showToast('error', errorMsg);
    } finally {
      setIsSearching(false);
    }
  };

  const handleApply = async (job) => {
    if (!currentResume) {
      showToast('error', 'Please generate a resume first');
      return;
    }

    setIsApplying(job.id);
    try {
      const response = await jobService.apply({
        jobId: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        description: job.description
      });

      if (response.data.success) {
        setSelectedJob(job);
        setEmailPreview(response.data.data.emailPreview);
        setShowEmailModal(true);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to prepare application';
      showToast('error', errorMsg);
    } finally {
      setIsApplying(null);
    }
  };

  const handleOpenMailto = () => {
    if (emailPreview?.mailtoLink) {
      window.open(emailPreview.mailtoLink, '_blank');
      showToast('info', 'Opening your email client. Remember to attach your resume!');
    }
  };

  const closeModal = () => {
    setShowEmailModal(false);
    setSelectedJob(null);
    setEmailPreview(null);
  };

  return (
    <div className="page-container">
      <div className="mb-8">
        <h1 className="section-title">Job Apply Assistant</h1>
        <p className="text-gray-600">
          Search for jobs and get AI-generated application emails with your resume attached.
        </p>
      </div>

      {/* Resume Status */}
      {!currentResume && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800">
            <span className="font-medium">Note:</span> Generate a resume first to use the Quick Apply feature.
          </p>
        </div>
      )}

      {/* Search Form */}
      <form onSubmit={handleSearch} className="card mb-8">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-1">
            <label className="label">Job Role</label>
            <input
              type="text"
              value={searchParams.role}
              onChange={(e) => setSearchParams({ ...searchParams, role: e.target.value })}
              placeholder="e.g., Software Engineer"
              className="input-field"
            />
          </div>
          <div className="md:col-span-1">
            <label className="label">Location</label>
            <input
              type="text"
              value={searchParams.location}
              onChange={(e) => setSearchParams({ ...searchParams, location: e.target.value })}
              placeholder="e.g., San Francisco, CA"
              className="input-field"
            />
          </div>
          <div className="md:col-span-1 flex items-end">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={searchParams.remote}
                onChange={(e) => setSearchParams({ ...searchParams, remote: e.target.checked })}
                className="w-4 h-4 text-indigo-400 rounded focus:ring-indigo-500"
              />
              <span className="ml-2 text-gray-700">Remote Only</span>
            </label>
          </div>
          <div className="md:col-span-1 flex items-end">
            <button type="submit" disabled={isSearching} className="btn-primary w-full">
              {isSearching ? (
                <div className="flex items-center justify-center">
                  <Loader size="sm" text="" />
                  <span className="ml-2">Searching...</span>
                </div>
              ) : (
                'Search Jobs'
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Job Listings */}
      {jobs.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              onApply={handleApply}
              isApplying={isApplying === job.id}
            />
          ))}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-16 text-center">
          <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Jobs Found</h3>
          <p className="text-gray-500">
            Enter a job role and location to search for opportunities.
          </p>
        </div>
      )}

      {/* Email Preview Modal */}
      {showEmailModal && emailPreview && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-hidden p-0">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-semibold text-white">Application Email Preview</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="mb-4">
                <p className="text-sm text-gray-500 mb-1">Applying to:</p>
                <p className="font-medium text-white">{selectedJob?.title} at {selectedJob?.company}</p>
              </div>

              <div className="mb-4">
                <label className="label">Subject</label>
                <input
                  type="text"
                  value={emailPreview.subject}
                  readOnly
                  className="input-field"
                />
              </div>

              <div className="mb-4">
                <label className="label">Email Body</label>
                <textarea
                  value={emailPreview.body}
                  readOnly
                  className="input-field h-64"
                />
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
                <span>Your resume will be attached</span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end space-x-4 p-4 border-t border-white/10 bg-white/5">
              <button onClick={closeModal} className="btn-secondary">
                Cancel
              </button>
              <button onClick={handleOpenMailto} className="btn-primary flex items-center space-x-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Open in Email Client</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default JobApply;
