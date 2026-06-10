import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { Sun, Moon, LogOut, Refrigerator, Cpu, History, BarChart3, CalendarDays, Download } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="navbar glass-panel">
      <div className="navbar-brand" onClick={() => setActiveTab('dashboard')}>
        <Refrigerator size={28} className="animate-float" style={{ color: 'var(--accent-primary)' }} />
        <span className="navbar-title">Smart Fridge <span style={{ color: 'var(--accent-primary)' }}>AI</span></span>
      </div>

      {user && (
        <div className="navbar-links">
          {[
            { id: 'dashboard', label: 'Inventory', icon: Refrigerator },
            { id: 'history', label: 'History', icon: History },
            { id: 'analytics', label: 'Analytics', icon: BarChart3 },
            { id: 'timeline', label: 'Timeline', icon: CalendarDays },
            { id: 'reports', label: 'Reports', icon: Download },
            { id: 'playground', label: 'AI', icon: Cpu },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`navbar-tab-btn ${activeTab === id ? 'active' : ''}`}
            >
              <Icon size={16} style={{ marginRight: 4 }} />
              {label}
            </button>
          ))}
        </div>
      )}

      <div className="navbar-actions">
        <button onClick={toggleTheme} className="navbar-icon-btn" title="Toggle Theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} style={{ color: '#f59e0b' }} />}
        </button>

        {user && (
          <div className="navbar-user-section">
            <span className="navbar-user-name">{user.name}</span>
            <button onClick={logout} className="navbar-logout-btn" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

