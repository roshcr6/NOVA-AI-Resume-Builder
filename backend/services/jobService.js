const axios = require('axios');

class JobService {
  constructor() {
    this.adzunaBaseUrl = 'https://api.adzuna.com/v1/api/jobs';
  }

  async searchJobs(options = {}) {
    const { 
      role = '', 
      location = 'us', 
      remote = false,
      page = 1,
      resultsPerPage = 10
    } = options;

    try {
      const appId = process.env.ADZUNA_APP_ID;
      const apiKey = process.env.ADZUNA_API_KEY;
      
      if (!appId || !apiKey || appId === 'your_adzuna_app_id') {
        return this.getMockJobs(role, location, remote);
      }

      const country = this.mapLocationToCountry(location);
      
      const params = {
        app_id: appId,
        app_key: apiKey,
        results_per_page: resultsPerPage,
        what: role,
        content_type: 'application/json'
      };

      if (location && location.length > 2) {
        params.where = location;
      }

      const response = await axios.get(
        `${this.adzunaBaseUrl}/${country}/search/${page}`,
        { params, timeout: 10000 }
      );

      const jobs = response.data.results.map(job => ({
        id: job.id,
        title: job.title,
        company: job.company?.display_name || 'Company Not Listed',
        location: job.location?.display_name || 'Location Not Specified',
        description: job.description?.substring(0, 300) + '...',
        salary: this.formatSalary(job.salary_min, job.salary_max),
        url: job.redirect_url,
        created: job.created,
        category: job.category?.label || 'General'
      }));

      return {
        jobs,
        totalResults: response.data.count || jobs.length,
        page,
        resultsPerPage
      };
    } catch (error) {
      console.error('Job search error:', error.message);
      return this.getMockJobs(role, location, remote);
    }
  }

  mapLocationToCountry(location) {
    const countryMap = {
      'us': 'us',
      'usa': 'us',
      'united states': 'us',
      'uk': 'gb',
      'united kingdom': 'gb',
      'canada': 'ca',
      'australia': 'au',
      'germany': 'de',
      'france': 'fr',
      'india': 'in'
    };

    const normalized = (location || '').toLowerCase().trim();
    return countryMap[normalized] || 'us';
  }

  formatSalary(min, max) {
    if (!min && !max) return 'Competitive';
    if (min && max) {
      return `$${this.formatNumber(min)} - $${this.formatNumber(max)}`;
    }
    if (min) return `From $${this.formatNumber(min)}`;
    return `Up to $${this.formatNumber(max)}`;
  }

  formatNumber(num) {
    return Math.round(num).toLocaleString();
  }

  getMockJobs(role, location, remote) {
    const mockJobs = [
      {
        id: '1',
        title: `Senior ${role || 'Software Engineer'}`,
        company: 'Tech Innovations Inc.',
        location: remote ? 'Remote' : (location || 'San Francisco, CA'),
        description: 'We are looking for a talented professional to join our growing team. This role involves working on cutting-edge projects with modern technologies...',
        salary: '$120,000 - $180,000',
        url: 'https://example.com/job/1',
        created: new Date().toISOString(),
        category: 'Technology'
      },
      {
        id: '2',
        title: `${role || 'Full Stack Developer'}`,
        company: 'Digital Solutions Corp',
        location: remote ? 'Remote' : (location || 'New York, NY'),
        description: 'Join our dynamic team and work on exciting projects. We offer competitive benefits and a great work-life balance...',
        salary: '$100,000 - $150,000',
        url: 'https://example.com/job/2',
        created: new Date().toISOString(),
        category: 'Technology'
      },
      {
        id: '3',
        title: `Junior ${role || 'Developer'}`,
        company: 'StartupXYZ',
        location: remote ? 'Remote' : (location || 'Austin, TX'),
        description: 'Great opportunity for someone starting their career. We provide mentorship and growth opportunities...',
        salary: '$70,000 - $90,000',
        url: 'https://example.com/job/3',
        created: new Date().toISOString(),
        category: 'Technology'
      },
      {
        id: '4',
        title: `Lead ${role || 'Engineer'}`,
        company: 'Enterprise Systems Ltd',
        location: remote ? 'Remote' : (location || 'Seattle, WA'),
        description: 'Lead a team of talented engineers and drive technical excellence. Must have experience with team management...',
        salary: '$150,000 - $200,000',
        url: 'https://example.com/job/4',
        created: new Date().toISOString(),
        category: 'Technology'
      },
      {
        id: '5',
        title: `${role || 'Software Developer'} - Contract`,
        company: 'Consulting Partners',
        location: remote ? 'Remote' : (location || 'Chicago, IL'),
        description: 'Contract position with possibility of conversion to full-time. Work on diverse client projects...',
        salary: '$80/hr - $120/hr',
        url: 'https://example.com/job/5',
        created: new Date().toISOString(),
        category: 'Technology'
      }
    ];

    return {
      jobs: mockJobs,
      totalResults: mockJobs.length,
      page: 1,
      resultsPerPage: 10,
      isMockData: true
    };
  }
}

module.exports = new JobService();
