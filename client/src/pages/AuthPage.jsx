import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { Refrigerator, Mail, Lock, User, Sun, Moon, ArrowRight } from 'lucide-react';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState('');

  const { login, register, error: authError, setError } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setValidationError('');
    setError(null);

    if (!email || !password) {
      setValidationError('Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters');
      return;
    }

    if (!isLogin && !name) {
      setValidationError('Please enter your name');
      return;
    }

    let success;
    if (isLogin) {
      success = await login(email, password);
    } else {
      success = await register(name, email, password);
    }

    if (success) {
      // Clear forms on success
      setName('');
      setEmail('');
      setPassword('');
    }
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setValidationError('');
    setError(null);
  };

  return (
    <div style={styles.container}>
      <button onClick={toggleTheme} style={styles.themeToggle}>
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} style={{ color: '#f59e0b' }} />}
      </button>

      <div className="glass-panel animate-slide-up" style={styles.card}>
        <div style={styles.logoContainer}>
          <div style={styles.logoCircle} className="animate-float">
            <Refrigerator size={40} style={{ color: 'white' }} />
          </div>
          <h1 style={styles.brandTitle}>Smart Fridge <span style={{ color: 'var(--accent-primary)' }}>AI</span></h1>
          <p style={styles.brandSubtitle}>Manage freshness, minimize waste, cook smart.</p>
        </div>

        <h2 style={styles.formTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

        {(validationError || authError) && (
          <div style={styles.errorAlert}>
            {validationError || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div style={styles.inputWrapper}>
                <User size={18} style={styles.inputIcon} />
                <input
                  type="text"
                  id="name"
                  className="form-input"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={styles.inputPadding}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={18} style={styles.inputIcon} />
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={styles.inputPadding}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                type="password"
                id="password"
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={styles.inputPadding}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={styles.submitBtn}>
            {isLogin ? 'Sign In' : 'Sign Up'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div style={styles.toggleModeRow}>
          <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
          <button onClick={switchMode} style={styles.switchBtn}>
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    padding: '20px',
    position: 'relative',
  },
  themeToggle: {
    position: 'absolute',
    top: '24px',
    right: '24px',
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    color: 'var(--text-primary)',
    cursor: 'pointer',
    padding: '10px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: 'var(--box-shadow-sm)',
    transition: 'var(--transition-smooth)',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '40px 32px',
    display: 'flex',
    flexDirection: 'column',
    borderColor: 'var(--card-border)',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoCircle: {
    width: '72px',
    height: '72px',
    borderRadius: '24px',
    backgroundColor: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 24px -4px var(--accent-glow)',
    marginBottom: '16px',
  },
  brandTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    letterSpacing: '-0.04em',
    marginBottom: '6px',
  },
  brandSubtitle: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
    maxWidth: '260px',
  },
  formTitle: {
    fontSize: '1.4rem',
    fontWeight: '700',
    marginBottom: '20px',
    textAlign: 'center',
  },
  errorAlert: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: 'var(--color-danger)',
    padding: '12px 16px',
    borderRadius: 'var(--border-radius-sm)',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '20px',
    textAlign: 'center',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
  },
  inputPadding: {
    paddingLeft: '46px',
  },
  submitBtn: {
    marginTop: '10px',
    width: '100%',
    height: '48px',
  },
  toggleModeRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '8px',
    marginTop: '24px',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
  },
  switchBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--accent-primary)',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.875rem',
    padding: '0',
    textDecoration: 'underline',
  },
};

export default AuthPage;
