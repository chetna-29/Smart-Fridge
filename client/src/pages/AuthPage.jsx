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
    <div className="auth-container">
      <button onClick={toggleTheme} className="auth-theme-toggle">
        {theme === 'light' ? <Moon size={20} /> : <Sun size={20} style={{ color: '#f59e0b' }} />}
      </button>

      <div className="glass-panel auth-card animate-slide-up">
        <div className="auth-logo-container">
          <div className="auth-logo-circle animate-float">
            <Refrigerator size={40} style={{ color: 'white' }} />
          </div>
          <h1 className="auth-brand-title">Smart Fridge <span style={{ color: 'var(--accent-primary)' }}>AI</span></h1>
          <p className="auth-brand-subtitle">Manage freshness, minimize waste, cook smart.</p>
        </div>

        <h2 className="auth-form-title">{isLogin ? 'Welcome Back' : 'Create Account'}</h2>

        {(validationError || authError) && (
          <div className="auth-error-alert">
            {validationError || authError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <div className="auth-input-wrapper">
                <User size={18} className="auth-input-icon" />
                <input
                  type="text"
                  id="name"
                  className="form-input auth-input-padding"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <div className="auth-input-wrapper">
              <Mail size={18} className="auth-input-icon" />
              <input
                type="email"
                id="email"
                className="form-input auth-input-padding"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div className="auth-input-wrapper">
              <Lock size={18} className="auth-input-icon" />
              <input
                type="password"
                id="password"
                className="form-input auth-input-padding"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary auth-submit-btn">
            {isLogin ? 'Sign In' : 'Sign Up'}
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="auth-toggle-mode-row">
          <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
          <button onClick={switchMode} className="auth-switch-btn">
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

