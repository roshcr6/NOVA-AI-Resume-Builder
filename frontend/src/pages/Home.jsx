import { Link } from 'react-router-dom';

function Home() {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      title: 'AI Resume Builder',
      description: 'Generate professional resumes from your GitHub profile or manual input. Get AI-powered suggestions to make your resume stand out.',
      link: '/generate',
      linkText: 'Generate Resume'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      title: 'Resume Analyzer',
      description: 'Get your resume scored for ATS compatibility. Identify missing skills and receive actionable improvement suggestions.',
      link: '/analyze',
      linkText: 'Analyze Resume'
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: 'Job Apply Assistant',
      description: 'Search for jobs, generate personalized application emails, and streamline your job application process.',
      link: '/jobs',
      linkText: 'Find Jobs'
    }
  ];

  return (
    <div className="min-h-screen relative">
      {/* Hero Section */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center space-x-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-2 mb-8">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            <span className="text-sm text-indigo-400">AI-Powered Resume Builder</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            <span className="text-gradient">Build Your Future</span>
            <span className="block text-white mt-2">with AI Resumes</span>
          </h1>
          
          <p className="text-xl text-gray-400 max-w-3xl mx-auto mb-10 leading-relaxed">
            Create professional resumes, get ATS-optimized feedback, and land your dream job with NOVA - your intelligent career companion.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/generate" 
              className="group bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 flex items-center space-x-2 glow"
            >
              <span>Get Started Free</span>
              <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <Link 
              to="/analyze" 
              className="border border-white/20 text-white hover:bg-white/10 font-semibold py-4 px-8 rounded-xl transition-all duration-300"
            >
              Analyze Resume
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto mt-16 pt-8 border-t border-white/10">
            <div>
              <div className="text-3xl font-bold text-gradient">5K+</div>
              <div className="text-sm text-gray-500 mt-1">Resumes Created</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gradient">98%</div>
              <div className="text-sm text-gray-500 mt-1">ATS Success Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gradient">24/7</div>
              <div className="text-sm text-gray-500 mt-1">AI Available</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="text-white">Everything You Need to</span>
              <span className="text-gradient block mt-2">Land Your Dream Job</span>
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Powered by advanced AI, NOVA helps you create, optimize, and apply with confidence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="card group hover:border-indigo-500/30"
              >
                <div className="w-14 h-14 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-indigo-500/30 group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-400 mb-6 leading-relaxed">{feature.description}</p>
                <Link 
                  to={feature.link} 
                  className="inline-flex items-center text-indigo-400 hover:text-indigo-300 font-medium transition-colors group/link"
                >
                  <span>{feature.linkText}</span>
                  <svg className="w-4 h-4 ml-2 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">How It Works</h2>
            <p className="text-xl text-gray-400">Three simple steps to your perfect resume</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { num: 1, title: 'Input Your Info', desc: 'Connect your GitHub profile or fill in your details manually. Our AI will do the heavy lifting.' },
              { num: 2, title: 'AI Enhancement', desc: 'AI crafts professional descriptions, optimizes keywords, and structures your resume for ATS.' },
              { num: 3, title: 'Download & Apply', desc: 'Get your polished PDF resume and start applying to jobs with AI-generated cover letters.' }
            ].map((step, index) => (
              <div key={index} className="text-center group">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center text-2xl font-bold mx-auto mb-6 transition-transform duration-300 group-hover:scale-110 glow">
                  {step.num}
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center px-4">
          <div className="card border-indigo-500/30 py-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Build Your <span className="text-gradient">Dream Resume?</span>
            </h2>
            <p className="text-xl text-gray-400 mb-8">
              Join thousands of professionals who landed their dream jobs with NOVA.
            </p>
            <Link 
              to="/generate" 
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 px-10 rounded-xl text-lg transition-all duration-300 glow"
            >
              <span>Start Building Now</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 relative z-10">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center glow">
              <span className="text-white font-bold">N</span>
            </div>
            <span className="text-white font-semibold">NOVA</span>
          </div>
          <p className="text-sm text-gray-500">
            AI-Powered Resume Builder & Job Assistant
          </p>
          <p className="text-xs text-gray-600 mt-2">
            Built with React, Node.js, and Ollama AI
          </p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
