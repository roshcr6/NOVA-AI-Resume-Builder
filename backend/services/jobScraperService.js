const axios = require('axios');
const cheerio = require('cheerio');

class JobScraperService {
  constructor() {
    this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    this.cache = new Map();
    this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    this.maxCacheSize = 50; // Prevent unbounded memory growth
  }

  getCacheKey(query) {
    return `${query.role}-${query.location}-${query.remote}`.toLowerCase();
  }

  getCachedResults(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  setCachedResults(key, data) {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async searchJobs(query) {
    const cacheKey = this.getCacheKey(query);
    const cached = this.getCachedResults(cacheKey);
    if (cached && cached.jobs && cached.jobs.length > 0) {
      console.log('Returning cached job results');
      return cached;
    }

    let jobs = [];

    // Try multiple job sources
    try {
      const remoteOkJobs = await this.scrapeRemoteOk(query);
      jobs = jobs.concat(remoteOkJobs);
    } catch (error) {
      console.error('RemoteOK scraping error:', error.message);
    }

    try {
      const arbeitNowJobs = await this.scrapeArbeitNow(query);
      jobs = jobs.concat(arbeitNowJobs);
    } catch (error) {
      console.error('ArbeitNow scraping error:', error.message);
    }

    try {
      const remotiveJobs = await this.fetchRemotive(query);
      jobs = jobs.concat(remotiveJobs);
    } catch (error) {
      console.error('Remotive API error:', error.message);
    }

    // Remove duplicates based on title + company
    const seen = new Set();
    jobs = jobs.filter(job => {
      const key = `${job.title}-${job.company}`.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // Sort by date (newest first)
    jobs.sort((a, b) => new Date(b.postedAt || 0) - new Date(a.postedAt || 0));

    const result = {
      jobs: jobs.slice(0, 50), // Limit to 50 results
      totalResults: jobs.length,
      source: 'aggregated'
    };

    // Only cache if we have results
    if (result.jobs.length > 0) {
      this.setCachedResults(cacheKey, result);
    }
    
    return result;
  }

  async scrapeRemoteOk(query) {
    const jobs = [];
    try {
      const searchTerm = encodeURIComponent(query.role || 'developer');
      const url = `https://remoteok.com/api?tag=${searchTerm}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (Array.isArray(response.data)) {
        // First item is often metadata
        const jobList = response.data.slice(1);
        
        for (const job of jobList.slice(0, 20)) {
          if (!job.position) continue;
          
          // Safe date parsing
          let postedAt = null;
          try {
            if (job.date) {
              const timestamp = typeof job.date === 'number' ? job.date * 1000 : Date.parse(job.date);
              if (!isNaN(timestamp)) {
                postedAt = new Date(timestamp).toISOString();
              }
            }
          } catch (e) {
            // Ignore date parsing errors
          }
          
          jobs.push({
            id: `remoteok-${job.id || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: job.position,
            company: job.company || 'Unknown Company',
            location: job.location || 'Remote',
            salary: job.salary || '',
            description: this.cleanDescription(job.description || ''),
            url: job.url || `https://remoteok.com/remote-jobs/${job.slug}`,
            postedAt,
            source: 'RemoteOK',
            tags: job.tags || [],
            remote: true,
            logo: job.company_logo || null
          });
        }
      }
    } catch (error) {
      console.error('RemoteOK error:', error.message);
    }
    return jobs;
  }

  async scrapeArbeitNow(query) {
    const jobs = [];
    try {
      const url = `https://arbeitnow.com/api/job-board-api`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.data) {
        const filteredJobs = response.data.data.filter(job => {
          const titleMatch = job.title?.toLowerCase().includes(query.role?.toLowerCase() || '');
          const remoteMatch = !query.remote || job.remote;
          return titleMatch && remoteMatch;
        });

        for (const job of filteredJobs.slice(0, 15)) {
          jobs.push({
            id: `arbeitnow-${job.slug || Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: job.title,
            company: job.company_name || 'Unknown Company',
            location: job.location || 'Remote',
            salary: '',
            description: this.cleanDescription(job.description || ''),
            url: job.url,
            postedAt: job.created_at,
            source: 'ArbeitNow',
            tags: job.tags || [],
            remote: job.remote || false,
            logo: job.company_logo || null
          });
        }
      }
    } catch (error) {
      console.error('ArbeitNow error:', error.message);
    }
    return jobs;
  }

  async fetchRemotive(query) {
    const jobs = [];
    try {
      const searchTerm = encodeURIComponent(query.role || 'developer');
      const url = `https://remotive.com/api/remote-jobs?search=${searchTerm}`;
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': this.userAgent,
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      if (response.data && response.data.jobs) {
        for (const job of response.data.jobs.slice(0, 15)) {
          jobs.push({
            id: `remotive-${job.id}-${Math.random().toString(36).substr(2, 9)}`,
            title: job.title,
            company: job.company_name || 'Unknown Company',
            location: job.candidate_required_location || 'Worldwide',
            salary: job.salary || '',
            description: this.cleanDescription(job.description || ''),
            url: job.url,
            postedAt: job.publication_date,
            source: 'Remotive',
            tags: job.tags || [],
            remote: true,
            logo: job.company_logo || null
          });
        }
      }
    } catch (error) {
      console.error('Remotive error:', error.message);
    }
    return jobs;
  }

  cleanDescription(html) {
    if (!html) return '';
    // Remove HTML tags
    let text = html.replace(/<[^>]*>/g, ' ');
    // Decode HTML entities
    text = text.replace(/&nbsp;/g, ' ')
               .replace(/&amp;/g, '&')
               .replace(/&lt;/g, '<')
               .replace(/&gt;/g, '>')
               .replace(/&quot;/g, '"');
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    // Limit length
    return text.length > 500 ? text.substring(0, 500) + '...' : text;
  }
}

module.exports = new JobScraperService();
