function JobCard({ job, onApply, isApplying }) {
  return (
    <div className="card hover:border-indigo-500/30 transition-all duration-200">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-white mb-1">
            {job.title}
          </h3>
          <p className="text-indigo-400 font-medium mb-2">{job.company}</p>
        </div>
        {job.salary && (
          <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">
            {job.salary}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <span className="flex items-center text-sm text-gray-400">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {job.location}
        </span>
        {job.category && (
          <span className="flex items-center text-sm text-gray-400">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            {job.category}
          </span>
        )}
      </div>

      {job.description && (
        <p className="text-gray-400 text-sm mb-4 line-clamp-3">
          {job.description}
        </p>
      )}

      <div className="flex items-center justify-between pt-4 border-t border-white/10">
        {job.created && (
          <span className="text-xs text-gray-500">
            Posted: {new Date(job.created).toLocaleDateString()}
          </span>
        )}
        <div className="flex space-x-2">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline text-sm py-1"
            >
              View Details
            </a>
          )}
          <button
            onClick={() => onApply(job)}
            disabled={isApplying}
            className="btn-primary text-sm py-1"
          >
            {isApplying ? 'Preparing...' : 'Quick Apply'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default JobCard;
