import React from 'react';
import { 
  Calendar, 
  Trash2, 
  Edit3, 
  CheckCircle2,
  Apple, 
  Milk, 
  Flame, 
  Egg, 
  Package, 
  GlassWater, 
  Cookie, 
  HelpCircle,
  AlertTriangle,
  FolderOpen
} from 'lucide-react';
import ProgressBar from './ProgressBar';

const categoryIcons = {
  Fruit: <Apple size={20} />,
  Vegetable: <Flame size={20} />, // Let's use Flame or we can fall back
  Dairy: <Milk size={20} />,
  'Meat/Seafood': <Egg size={20} />,
  'Packaged Food': <Package size={20} />,
  Beverage: <GlassWater size={20} />,
  Bakery: <Cookie size={20} />,
  Other: <HelpCircle size={20} />,
};

const FoodCard = ({ item, onEdit, onDelete, onConsume }) => {
  const { itemName, category, quantity, purchaseDate, expiryDate, storageType, status, finishByDate } = item;

  const pDate = new Date(purchaseDate);
  const eDate = new Date(expiryDate);
  const today = new Date();
  
  // Reset hours to compare dates precisely
  today.setHours(0, 0, 0, 0);
  const cleanEDate = new Date(eDate);
  cleanEDate.setHours(0, 0, 0, 0);
  const cleanPDate = new Date(pDate);
  cleanPDate.setHours(0, 0, 0, 0);

  // Time calculations
  const totalDuration = Math.max(1, cleanEDate - cleanPDate);
  const remainingDuration = cleanEDate - today;
  const daysRemaining = Math.ceil(remainingDuration / (1000 * 60 * 60 * 24));
  
  // Freshness Percentage
  let freshnessPercent = Math.round((remainingDuration / totalDuration) * 100);
  if (daysRemaining < 0) {
    freshnessPercent = 0;
  }

  // Expiry styling and text
  let statusBadge = <span className="badge badge-success">Fresh</span>;
  if (daysRemaining < 0) {
    statusBadge = <span className="badge badge-danger">Spoiled / Expired</span>;
  } else if (daysRemaining <= 3) {
    statusBadge = (
      <span className="badge badge-warning" style={{ animation: 'pulseGlow 2s infinite' }}>
        <AlertTriangle size={12} style={{ marginRight: 4 }} />
        Expiring Soon
      </span>
    );
  }

  // Consumption Goal status
  let goalText = '';
  let goalBadge = null;
  if (finishByDate) {
    const fDate = new Date(finishByDate);
    const cleanFDate = new Date(fDate);
    cleanFDate.setHours(0, 0, 0, 0);
    const goalRemainingDuration = cleanFDate - today;
    const goalDaysRemaining = Math.ceil(goalRemainingDuration / (1000 * 60 * 60 * 24));
    
    if (goalDaysRemaining < 0) {
      goalText = `Missed by ${Math.abs(goalDaysRemaining)} day${Math.abs(goalDaysRemaining) !== 1 ? 's' : ''}`;
      goalBadge = <span className="badge badge-danger">Goal Missed</span>;
    } else if (goalDaysRemaining <= 1) {
      goalText = goalDaysRemaining === 0 ? 'Finish today!' : 'Finish tomorrow';
      goalBadge = <span className="badge badge-warning">Goal Approaching</span>;
    } else {
      goalText = `Finish in ${goalDaysRemaining} days`;
      goalBadge = <span className="badge badge-success">Goal On Track</span>;
    }
  }

  // Combined glow and border styling prioritizing safety expiry, then consumption goal status
  let glowStyle = {};
  if (daysRemaining < 0) {
    glowStyle = {
      boxShadow: '0 4px 20px -2px rgba(239, 68, 68, 0.15)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
    };
  } else if (finishByDate && (Math.ceil((new Date(finishByDate) - today) / (1000 * 60 * 60 * 24)) < 0)) {
    glowStyle = {
      boxShadow: '0 4px 20px -2px rgba(239, 68, 68, 0.15)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
    };
  } else if (daysRemaining <= 3) {
    glowStyle = {
      boxShadow: '0 4px 20px -2px rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
    };
  } else if (finishByDate && (Math.ceil((new Date(finishByDate) - today) / (1000 * 60 * 60 * 24)) <= 1)) {
    glowStyle = {
      boxShadow: '0 4px 20px -2px rgba(245, 158, 11, 0.15)',
      borderColor: 'rgba(245, 158, 11, 0.3)',
    };
  } else if (finishByDate) {
    glowStyle = {
      boxShadow: '0 4px 20px -2px rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.2)',
    };
  }

  // Category Icon helper
  const icon = categoryIcons[category] || <HelpCircle size={20} />;

  // Expiry countdown string
  let countdownText = '';
  if (daysRemaining < 0) {
    countdownText = `Expired ${Math.abs(daysRemaining)} day${Math.abs(daysRemaining) !== 1 ? 's' : ''} ago`;
  } else if (daysRemaining === 0) {
    countdownText = 'Expires today!';
  } else if (daysRemaining === 1) {
    countdownText = 'Expires tomorrow';
  } else {
    countdownText = `Expires in ${daysRemaining} days`;
  }

  return (
    <div className="glass-panel animate-slide-up" style={{ ...styles.card, ...glowStyle }}>
      <div style={styles.header}>
        <div style={styles.iconContainer} title={category}>
          {icon}
        </div>
        <div style={styles.headerText}>
          <h3 style={styles.itemName}>{itemName}</h3>
          <span style={styles.categoryName}>{category}</span>
        </div>
        <div style={styles.badgeContainer}>
          {statusBadge}
          {goalBadge && <div style={{ marginTop: 4 }}>{goalBadge}</div>}
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.metricRow}>
          <div style={styles.metric}>
            <span style={styles.metricLabel}>Quantity</span>
            <span style={styles.metricValue}>{quantity}</span>
          </div>
          <div style={styles.metric}>
            <span style={styles.metricLabel}>Storage</span>
            <span style={styles.metricValue}>{storageType}</span>
          </div>
          <div style={styles.metric}>
            <span style={styles.metricLabel}>Status</span>
            <span style={{
              ...styles.metricValue,
              color: status === 'Opened' ? 'var(--color-warning)' : 'var(--text-secondary)'
            }}>
              {status}
            </span>
          </div>
        </div>

        <div style={styles.expirySection}>
          <div style={styles.expiryLabelRow}>
            <span style={styles.countdown}>{countdownText}</span>
            <span style={styles.percent}>{freshnessPercent}% Fresh</span>
          </div>
          <ProgressBar value={freshnessPercent} />
          
          <div style={styles.dateRow}>
            <span style={styles.dateText}>
              <Calendar size={12} style={{ marginRight: 4 }} />
              Bought: {pDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
            <span style={styles.dateText}>
              <Calendar size={12} style={{ marginRight: 4 }} />
              Expiry: {eDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>

          {finishByDate && (
            <div style={{ ...styles.dateRow, marginTop: 4, paddingTop: 4, borderTop: '1px dashed var(--card-border)' }}>
              <span style={{ ...styles.dateText, color: 'var(--accent-primary)', fontWeight: '600' }}>
                <Calendar size={12} style={{ marginRight: 4 }} />
                Finish By: {new Date(finishByDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>
                {goalText}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={styles.footer}>
        <button onClick={() => onEdit(item)} style={styles.actionBtn} title="Edit Item">
          <Edit3 size={16} />
          Edit
        </button>
        {onConsume && (
          <button onClick={() => onConsume(item._id)} style={{ ...styles.actionBtn, color: 'var(--color-success)' }} title="Mark Consumed">
            <CheckCircle2 size={16} />
            Consumed
          </button>
        )}
        <button onClick={() => onDelete(item._id)} style={{ ...styles.actionBtn, color: 'var(--color-danger)' }} title="Delete Item">
          <Trash2 size={16} />
          Remove
        </button>
      </div>
    </div>
  );
};

const styles = {
  card: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '20px',
    height: '100%',
    transition: 'var(--transition-smooth)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '16px',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '40px',
    height: '40px',
    borderRadius: '12px',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--accent-primary)',
    border: '1px solid var(--card-border)',
  },
  headerText: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  itemName: {
    fontSize: '1.1rem',
    fontWeight: '600',
    lineHeight: '1.2',
  },
  categoryName: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  badgeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
    alignSelf: 'flex-start',
  },
  body: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1,
  },
  metricRow: {
    display: 'flex',
    justifyContent: 'space-between',
    backgroundColor: 'var(--bg-secondary)',
    padding: '10px 14px',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--card-border)',
  },
  metric: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
  },
  metricLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    fontWeight: '500',
  },
  metricValue: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  expirySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  expiryLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  countdown: {
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  percent: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
  },
  dateRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '6px',
  },
  dateText: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    display: 'flex',
    alignItems: 'center',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid var(--card-border)',
    paddingTop: '12px',
    marginTop: '16px',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: '600',
    fontSize: '0.85rem',
    transition: 'var(--transition-smooth)',
    padding: '6px 10px',
    borderRadius: 'var(--border-radius-sm)',
  },
};

export default FoodCard;
