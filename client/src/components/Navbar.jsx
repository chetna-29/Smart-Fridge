import React, { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';
import { AuthContext } from '../context/AuthContext';
import { Sun, Moon, LogOut, Refrigerator, Cpu } from 'lucide-react';

const Navbar = ({ activeTab, setActiveTab }) => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="glass-panel" style={styles.navbar}>
      <div style={styles.brand} onClick={() => setActiveTab('dashboard')}>
        <Refrigerator size={28} className="animate-float" style={{ color: 'var(--accent-primary)' }} />
        <span style={styles.title}>Smart Fridge <span style={{ color: 'var(--accent-primary)' }}>AI</span></span>
      </div>

      {user && (
        <div style={styles.links}>
          <button
            onClick={() => setActiveTab('dashboard')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'dashboard' ? styles.activeTab : {}),
            }}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('playground')}
            style={{
              ...styles.tabBtn,
              ...(activeTab === 'playground' ? styles.activeTab : {}),
            }}
          >
            <Cpu size={16} style={{ marginRight: 4 }} />
            AI Playground
          </button>
        </div>
      )}

      <div style={styles.actions}>
        <button onClick={toggleTheme} style={styles.iconBtn} title="Toggle Theme">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} style={{ color: '#f59e0b' }} />}
        </button>

        {user && (
          <div style={styles.userSection}>
            <span style={styles.userName}>{user.name}</span>
            <button onClick={logout} style={styles.logoutBtn} title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

const styles = {
  navbar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    margin: '16px 0 24px 0',
    borderRadius: 'var(--border-radius-md)',
    position: 'sticky',
    top: 16,
    zIndex: 100,
    backgroundColor: 'var(--navbar-bg)',
    borderColor: 'var(--navbar-border)',
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
  },
  title: {
    fontSize: '1.4rem',
    fontWeight: '800',
    letterSpacing: '-0.03em',
  },
  links: {
    display: 'flex',
    gap: '12px',
  },
  tabBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    padding: '8px 16px',
    fontWeight: '600',
    fontSize: '0.95rem',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition-smooth)',
  },
  activeTab: {
    color: 'var(--accent-primary)',
    backgroundColor: 'var(--active-tab-bg)',
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: '8px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-smooth)',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderLeft: '1px solid var(--card-border)',
    paddingLeft: '16px',
  },
  userName: {
    fontWeight: '600',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
  },
  logoutBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: 'var(--border-radius-sm)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition-smooth)',
  },
};

export default Navbar;
