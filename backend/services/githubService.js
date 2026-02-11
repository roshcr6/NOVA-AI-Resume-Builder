const axios = require('axios');

class GitHubService {
  constructor() {
    this.baseUrl = 'https://api.github.com';
    this.cache = new Map();
    this.cacheTimeout = 60 * 60 * 1000; // 1 hour cache
    this.maxCacheSize = 100; // Prevent unbounded memory growth
    
    // Build headers with optional token
    const headers = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Nova-Resume-Builder'
    };
    
    // Add GitHub token if available (increases rate limit from 60 to 5000 req/hour)
    if (process.env.GITHUB_TOKEN) {
      headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
    }
    
    this.axiosInstance = axios.create({
      baseURL: this.baseUrl,
      timeout: 15000,
      headers
    });
  }

  getCached(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log(`Using cached GitHub data for: ${key}`);
      return cached.data;
    }
    return null;
  }

  setCache(key, data) {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  extractUsername(githubUrl) {
    try {
      const url = new URL(githubUrl);
      if (url.hostname !== 'github.com') {
        throw new Error('Not a valid GitHub URL');
      }
      
      const pathParts = url.pathname.split('/').filter(Boolean);
      if (pathParts.length === 0) {
        throw new Error('No username found in URL');
      }
      
      return pathParts[0];
    } catch (error) {
      if (error.message.includes('Invalid URL')) {
        if (/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(githubUrl)) {
          return githubUrl;
        }
      }
      throw new Error('Invalid GitHub URL or username');
    }
  }

  async fetchUserProfile(username) {
    try {
      const response = await this.axiosInstance.get(`/users/${username}`);
      return {
        login: response.data.login,
        name: response.data.name || response.data.login,
        email: response.data.email || '',
        bio: response.data.bio || '',
        company: response.data.company || '',
        location: response.data.location || '',
        blog: response.data.blog || '',
        publicRepos: response.data.public_repos,
        followers: response.data.followers,
        following: response.data.following,
        createdAt: response.data.created_at,
        avatarUrl: response.data.avatar_url,
        htmlUrl: response.data.html_url
      };
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('GitHub user not found');
      }
      if (error.response?.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
      throw new Error('Failed to fetch GitHub profile');
    }
  }

  async fetchUserRepos(username, limit = 10) {
    try {
      const response = await this.axiosInstance.get(`/users/${username}/repos`, {
        params: {
          sort: 'updated',
          direction: 'desc',
          per_page: limit,
          type: 'owner'
        }
      });

      return response.data.map(repo => ({
        name: repo.name,
        description: repo.description || '',
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        url: repo.html_url,
        homepage: repo.homepage || '',
        topics: repo.topics || [],
        createdAt: repo.created_at,
        updatedAt: repo.updated_at,
        isForked: repo.fork
      }));
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('GitHub user not found');
      }
      if (error.response?.status === 403) {
        throw new Error('GitHub API rate limit exceeded. Please try again later.');
      }
      throw new Error('Failed to fetch GitHub repositories');
    }
  }

  async fetchRepoLanguages(username, repoName) {
    try {
      const response = await this.axiosInstance.get(`/repos/${username}/${repoName}/languages`);
      return response.data;
    } catch (error) {
      return {};
    }
  }

  async fetchAllRepoLanguages(username, repos) {
    const languageStats = {};
    
    const languagePromises = repos.slice(0, 5).map(async (repo) => {
      try {
        const languages = await this.fetchRepoLanguages(username, repo.name);
        for (const [lang, bytes] of Object.entries(languages)) {
          languageStats[lang] = (languageStats[lang] || 0) + bytes;
        }
      } catch (error) {
        console.warn(`Failed to fetch languages for ${repo.name}`);
      }
    });

    await Promise.all(languagePromises);

    const sortedLanguages = Object.entries(languageStats)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang);

    return sortedLanguages;
  }

  async fetchCompleteProfile(githubUrl) {
    try {
      const username = this.extractUsername(githubUrl);
      
      // Check cache first
      const cacheKey = `github-profile-${username}`;
      const cached = this.getCached(cacheKey);
      if (cached) {
        return cached;
      }
      
      const [profile, repos] = await Promise.all([
        this.fetchUserProfile(username),
        this.fetchUserRepos(username, 10)
      ]);

      const originalRepos = repos.filter(repo => !repo.isForked);
      const languages = await this.fetchAllRepoLanguages(username, originalRepos);

      const allTopics = new Set();
      originalRepos.forEach(repo => {
        repo.topics.forEach(topic => allTopics.add(topic));
      });

      const result = {
        profile,
        repositories: originalRepos,
        languages,
        topics: Array.from(allTopics),
        stats: {
          totalRepos: profile.publicRepos,
          totalStars: originalRepos.reduce((sum, repo) => sum + repo.stars, 0),
          totalForks: originalRepos.reduce((sum, repo) => sum + repo.forks, 0)
        }
      };
      
      // Cache the result
      this.setCache(cacheKey, result);
      
      return result;
    } catch (error) {
      console.error('GitHub fetch error:', error);
      throw error;
    }
  }
}

module.exports = new GitHubService();
