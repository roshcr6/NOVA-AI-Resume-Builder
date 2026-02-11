import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Toast from './components/Toast';
import CustomCursor from './components/CustomCursor';
import InteractiveBackground from './components/InteractiveBackground';
import Home from './pages/Home';
import Generate from './pages/Generate';
import Analyze from './pages/Analyze';
import JobApply from './pages/JobApply';
import Profile from './pages/Profile';
import { useApp } from './context/AppContext';

function App() {
  const { toast, hideToast } = useApp();

  return (
    <div className="min-h-screen relative">
      {/* Background Effects */}
      <InteractiveBackground />
      <div className="gradient-orb gradient-orb-1"></div>
      <div className="gradient-orb gradient-orb-2"></div>
      
      {/* Custom Cursor */}
      <CustomCursor />
      
      <Navbar />
      <main className="pt-16 relative z-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/generate" element={<Generate />} />
          <Route path="/analyze" element={<Analyze />} />
          <Route path="/jobs" element={<JobApply />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>
      {toast.show && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={hideToast}
        />
      )}
    </div>
  );
}

export default App;
