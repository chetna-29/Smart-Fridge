import React, { useState, useContext } from 'react';
import { ThemeProvider, ThemeContext } from './context/ThemeContext';
import { AuthProvider, AuthContext } from './context/AuthContext';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import InventoryHistory from './pages/InventoryHistory';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import TimelineView from './pages/TimelineView';
import ReportsExport from './pages/ReportsExport';
import AiDashboard from './pages/AiDashboard';
import Navbar from './components/Navbar';
import { Loader2 } from 'lucide-react';

const AppContent = () => {
  const { user, loading } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <Loader2 size={48} className="animate-float" style={{ animation: 'spin 1.2s linear infinite', color: 'var(--accent-primary)' }} />
        <span style={styles.loadingText}>Synchronizing Fridge AI...</span>
      </div>
    );
  }

  // If user is not authenticated, display login/register cards
  if (!user) {
    return <AuthPage />;
  }

  return (
    <div className="container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {activeTab === 'dashboard' && <Dashboard />}
      {activeTab === 'history' && <InventoryHistory />}
      {activeTab === 'analytics' && <AnalyticsDashboard />}
      {activeTab === 'timeline' && <TimelineView />}
      {activeTab === 'reports' && <ReportsExport />}
      {activeTab === 'playground' && <AiDashboard />}
    </div>
  );
};

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
};

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    gap: '16px',
    background: 'var(--bg-gradient)',
  },
  loadingText: {
    fontFamily: 'var(--font-family-title)',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    fontSize: '1.1rem',
  },
};

export default App;
