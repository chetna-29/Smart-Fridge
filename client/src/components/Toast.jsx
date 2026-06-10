import React, { useEffect } from 'react';
import { CheckCircle, AlertCircle, X, Bell } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const getStyle = () => {
    switch (type) {
      case 'error':
        return {
          bg: 'rgba(239, 68, 68, 0.95)',
          icon: <AlertCircle size={20} style={{ color: '#fff' }} />,
        };
      case 'info':
        return {
          bg: 'rgba(245, 158, 11, 0.95)',
          icon: <Bell size={20} style={{ color: '#fff' }} />,
        };
      case 'success':
      default:
        return {
          bg: 'rgba(16, 185, 129, 0.95)',
          icon: <CheckCircle size={20} style={{ color: '#fff' }} />,
        };
    }
  };

  const toastStyle = getStyle();

  return (
    <div
      className="glass-panel toast-alert"
      style={{
        ...styles.toast,
        backgroundColor: toastStyle.bg,
      }}
    >
      <div style={styles.content}>
        {toastStyle.icon}
        <span style={styles.message}>{message}</span>
      </div>
      <button onClick={onClose} style={styles.closeBtn}>
        <X size={16} />
      </button>
    </div>
  );
};

const styles = {
  toast: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px',
    borderRadius: 'var(--border-radius-md)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
    zIndex: 9999,
    minWidth: '300px',
    maxWidth: '450px',
    animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
    backdropFilter: 'blur(8px)',
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  message: {
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#ffffff',
    cursor: 'pointer',
    opacity: 0.8,
    display: 'flex',
    alignItems: 'center',
    padding: '4px',
    marginLeft: '12px',
    transition: 'opacity 0.2s',
  },
};

export default Toast;
