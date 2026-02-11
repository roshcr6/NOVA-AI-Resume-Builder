import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from '../utils/uuid';
import api from '../services/api';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [sessionId, setSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentResume, setCurrentResume] = useState(null);
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState({ show: false, type: 'info', message: '' });

  useEffect(() => {
    initSession();
  }, []);

  const initSession = () => {
    try {
      let storedSessionId = localStorage.getItem('nova_session_id');
      
      if (!storedSessionId) {
        storedSessionId = uuidv4();
        localStorage.setItem('nova_session_id', storedSessionId);
      }
      
      setSessionId(storedSessionId);
      setLoading(false);
    } catch (error) {
      console.error('Failed to initialize session:', error);
      const newSessionId = uuidv4();
      setSessionId(newSessionId);
      setLoading(false);
    }
  };

  const showToast = useCallback((type, message) => {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  }, []);

  const hideToast = useCallback(() => {
    setToast(prev => ({ ...prev, show: false }));
  }, []);

  const fetchCurrentResume = useCallback(async () => {
    if (!sessionId) return null;
    
    try {
      const response = await api.get('/resume/current');
      if (response.data.success) {
        setCurrentResume(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Failed to fetch current resume:', error);
      }
      setCurrentResume(null);
    }
    return null;
  }, [sessionId]);

  const fetchProfile = useCallback(async () => {
    if (!sessionId) return null;
    
    try {
      const response = await api.get('/session/profile');
      if (response.data.success) {
        setProfile(response.data.data);
        return response.data.data;
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
    return null;
  }, [sessionId]);

  const clearSession = useCallback(() => {
    localStorage.removeItem('nova_session_id');
    const newSessionId = uuidv4();
    localStorage.setItem('nova_session_id', newSessionId);
    setSessionId(newSessionId);
    setCurrentResume(null);
    setProfile(null);
    showToast('success', 'Session cleared successfully');
  }, [showToast]);

  const value = {
    sessionId,
    loading,
    currentResume,
    setCurrentResume,
    fetchCurrentResume,
    profile,
    fetchProfile,
    toast,
    showToast,
    hideToast,
    clearSession
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

export default AppContext;
