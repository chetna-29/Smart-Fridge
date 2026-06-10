import React, { useEffect, useState } from 'react';
import { 
  Cpu, 
  BrainCircuit, 
  Leaf, 
  ShoppingBag, 
  TrendingUp, 
  Heart, 
  Sparkles, 
  ArrowRight,
  Info,
  Calendar,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle2,
  Trash2,
  Package
} from 'lucide-react';
import { getAiDashboardData } from '../services/api';
import ProfilePlayground from './ProfilePlayground';

// Custom BarList from Analytics
const BarList = ({ data = [], labelKey = 'label', valueKey = 'total', color = 'var(--accent-primary)' }) => {
  const max = Math.max(...data.map((item) => item[valueKey] || 0), 1);
  return (
    <div style={styles.barList}>
      {data.length === 0 ? (
        <span style={styles.muted}>No data captured yet</span>
      ) : data.map((item) => (
        <div key={`${item[labelKey]}-${item[valueKey]}`} style={styles.barRow}>
          <span style={styles.barLabel}>{item[labelKey]}</span>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFill, backgroundColor: color, width: `${((item[valueKey] || 0) / max) * 100}%` }} />
          </div>
          <span style={styles.barValue}>{item[valueKey]}</span>
        </div>
      ))}
    </div>
  );
};

// Circular radial progress health score indicator
const CircularProgress = ({ score }) => {
  const radius = 60;
  const strokeWidth = 10;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let scoreColor = 'var(--accent-primary)';
  let glowColor = 'var(--accent-glow)';
  if (score < 60) {
    scoreColor = 'var(--color-danger)';
    glowColor = 'var(--color-danger-glow)';
  } else if (score < 85) {
    scoreColor = 'var(--color-warning)';
    glowColor = 'var(--color-warning-glow)';
  }

  return (
    <div style={styles.circularContainer}>
      <svg height={radius * 2} width={radius * 2} style={styles.circularSvg}>
        <circle
          stroke="var(--bg-secondary)"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke={scoreColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset, strokeLinecap: 'round', transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
      </svg>
      <div style={styles.circularText}>
        <span style={{ ...styles.circularScore, color: scoreColor }}>{score}</span>
        <span style={styles.circularTotal}>/100</span>
      </div>
      <div style={{ ...styles.glowBackground, backgroundColor: glowColor }} />
    </div>
  );
};

const AiDashboard = () => {
  const [subTab, setSubTab] = useState('insights'); // insights | sandbox
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await getAiDashboardData();
      if (res.data.success) {
        setDashboardData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load AI Dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (subTab === 'insights') {
      fetchDashboardData();
    }
  }, [subTab]);

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const d = new Date(dateStr);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  if (subTab === 'sandbox') {
    return (
      <div className="animate-fade-in">
        <header style={styles.tabHeader}>
          <div style={styles.tabContainer}>
            <button 
              style={{ ...styles.tabButton, ...(subTab === 'insights' ? styles.activeTab : {}) }} 
              onClick={() => setSubTab('insights')}
            >
              <BrainCircuit size={16} /> AI Insights & Recommendations
            </button>
            <button 
              style={{ ...styles.tabButton, ...(subTab === 'sandbox' ? styles.activeTab : {}) }} 
              onClick={() => setSubTab('sandbox')}
            >
              <Cpu size={16} /> Future AI Sandbox Simulators
            </button>
          </div>
        </header>
        <ProfilePlayground />
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ paddingBottom: '40px' }}>
      {/* Header and Toggle Navigation */}
      <header style={styles.header}>
        <div style={styles.headerTitleRow}>
          <h2 style={styles.title}>
            Smart Fridge <span style={{ color: 'var(--accent-primary)' }}>AI Assistant</span>
          </h2>
          <p style={styles.subtitle}>Predictive food forecasting, consumption recommendations, and waste minimization.</p>
        </div>
        
        <div style={styles.tabContainer}>
          <button 
            style={{ ...styles.tabButton, ...(subTab === 'insights' ? styles.activeTab : {}) }} 
            onClick={() => setSubTab('insights')}
          >
            <BrainCircuit size={16} /> AI Insights & Recommendations
          </button>
          <button 
            style={{ ...styles.tabButton, ...(subTab === 'sandbox' ? styles.activeTab : {}) }} 
            onClick={() => setSubTab('sandbox')}
          >
            <Cpu size={16} /> Future AI Sandbox Simulators
          </button>
        </div>
      </header>

      {loading || !dashboardData ? (
        <div className="glass-panel" style={styles.loadingContainer}>
          <BrainCircuit className="animate-float" size={48} style={{ color: 'var(--accent-primary)', animation: 'spin 4s linear infinite' }} />
          <span style={styles.loadingText}>Analyzing fridge habits and generating recommendations...</span>
        </div>
      ) : (
        <div style={styles.dashboardGrid}>
          
          {/* Top Row: Health Score and Fast Metrics */}
          <section className="glass-panel" style={styles.overviewSection}>
            <div style={styles.overviewText}>
              <h3 style={styles.panelTitle}>
                <Heart size={18} style={{ color: 'var(--color-danger)' }} /> Inventory Health Score
              </h3>
              <p style={styles.overviewDesc}>
                Your score is calculated based on active expired inventory, items expiring within 3 days, and missed consumption goals. Keep it high to reduce food waste and optimize grocery costs!
              </p>
              
              <div style={styles.scoreDetails}>
                <div style={styles.scoreDetailItem}>
                  <CheckCircle2 size={16} style={{ color: 'var(--accent-primary)' }} />
                  <span>High score represents minimal food waste</span>
                </div>
                <div style={styles.scoreDetailItem}>
                  <AlertTriangle size={16} style={{ color: 'var(--color-warning)' }} />
                  <span>Score drops for expired or missed finish goals</span>
                </div>
              </div>
            </div>
            
            <div style={styles.overviewGauge}>
              <CircularProgress score={dashboardData.healthScore} />
            </div>
          </section>

          {/* Core Insights Grid */}
          <div style={styles.cardsGrid}>
            {/* Card 1: Personalized Recommendations */}
            <div className="glass-panel" style={styles.insightCard}>
              <header style={styles.cardHeader}>
                <Sparkles size={20} style={{ color: 'var(--color-warning)' }} />
                <h4>Personalized Recommendations</h4>
              </header>
              <ul style={styles.list}>
                {dashboardData.personalizedRecommendations.map((rec, idx) => (
                  <li key={idx} style={styles.listItem}>
                    <ArrowRight size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    <span style={styles.listText}>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 2: Waste Prevention Suggestions */}
            <div className="glass-panel" style={styles.insightCard}>
              <header style={styles.cardHeader}>
                <Leaf size={20} style={{ color: 'var(--accent-primary)' }} />
                <h4>Waste Prevention Suggestions</h4>
              </header>
              <ul style={styles.list}>
                {dashboardData.wastePreventionSuggestions.map((sug, idx) => (
                  <li key={idx} style={styles.listItem}>
                    <Info size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    <span style={styles.listText}>{sug}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Card 3: Smart Shopping Suggestions */}
            <div className="glass-panel" style={styles.insightCard}>
              <header style={styles.cardHeader}>
                <ShoppingBag size={20} style={{ color: 'var(--color-success)' }} />
                <h4>Shopping Recommendations</h4>
              </header>
              <ul style={styles.list}>
                {dashboardData.shoppingRecommendations.map((shop, idx) => (
                  <li key={idx} style={styles.listItem}>
                    <Plus size={14} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
                    <span style={styles.listText}>{shop}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Forecasting Section */}
          <section className="glass-panel" style={styles.forecastSection}>
            <header style={styles.sectionHeader}>
              <Calendar size={20} style={{ color: 'var(--accent-primary)' }} />
              <h4>Consumption & Depletion Forecasting</h4>
            </header>
            
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Active Item</th>
                    <th style={styles.th}>Category</th>
                    <th style={styles.th}>Purchase Date</th>
                    <th style={styles.th}>Likely Finish Date</th>
                    <th style={styles.th}>Likely Depletion</th>
                    <th style={styles.th}>Next Purchase Date</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboardData.consumptionPredictions.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={styles.noForecast}>
                        Add active food items to see consumption predictions!
                      </td>
                    </tr>
                  ) : (
                    dashboardData.consumptionPredictions.map((pred) => {
                      let tagColor = 'var(--accent-primary)';
                      let tagBg = 'var(--active-tab-bg)';
                      if (pred.daysLeft <= 1) {
                        tagColor = 'var(--color-danger)';
                        tagBg = 'var(--color-danger-glow)';
                      } else if (pred.daysLeft <= 3) {
                        tagColor = 'var(--color-warning)';
                        tagBg = 'var(--color-warning-glow)';
                      }

                      return (
                        <tr key={pred._id} style={styles.tr}>
                          <td style={{ ...styles.td, fontWeight: '700' }}>{pred.itemName}</td>
                          <td style={styles.td}>{pred.category}</td>
                          <td style={styles.td}>{formatDate(pred.purchaseDate)}</td>
                          <td style={styles.td}>{formatDate(pred.likelyConsumptionDate)}</td>
                          <td style={{ ...styles.td, color: 'var(--accent-secondary)', fontWeight: 600 }}>
                            {formatDate(pred.likelyDepletionDate)}
                          </td>
                          <td style={styles.td}>{formatDate(pred.nextPurchaseDate)}</td>
                          <td style={styles.td}>
                            <span 
                              style={{ 
                                ...styles.forecastBadge, 
                                color: tagColor, 
                                backgroundColor: tagBg 
                              }}
                            >
                              {pred.daysLeft === 0 ? 'Depleted' : pred.daysLeft === 1 ? 'Expires Tomorrow' : `Expires in ${pred.daysLeft}d`}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Charts Row */}
          <section style={styles.chartsGrid}>
            {/* Frequently Purchased */}
            <div className="glass-panel" style={styles.chartPanel}>
              <h3 style={styles.chartTitle}>
                <Package size={18} style={{ color: 'var(--accent-primary)' }} /> Frequently Purchased Foods
              </h3>
              <BarList 
                data={dashboardData.frequentlyPurchased} 
                labelKey="label" 
                valueKey="total" 
                color="var(--accent-primary)" 
              />
            </div>
            
            {/* Frequently Wasted */}
            <div className="glass-panel" style={styles.chartPanel}>
              <h3 style={styles.chartTitle}>
                <Trash2 size={18} style={{ color: 'var(--color-danger)' }} /> Frequently Wasted Foods
              </h3>
              <BarList 
                data={dashboardData.frequentlyWasted} 
                labelKey="label" 
                valueKey="total" 
                color="var(--color-danger)" 
              />
            </div>
          </section>

        </div>
      )}
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '28px',
    flexWrap: 'wrap',
    gap: '20px',
    borderBottom: '1px solid var(--card-border)',
    paddingBottom: '20px',
  },
  headerTitleRow: {
    display: 'flex',
    flexDirection: 'column',
    flex: '1 1 400px',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '800',
    letterSpacing: '-0.04em',
  },
  subtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    marginTop: '4px',
  },
  tabHeader: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '16px',
    borderBottom: '1px solid var(--card-border)',
    paddingBottom: '12px'
  },
  tabContainer: {
    display: 'flex',
    gap: '8px',
    background: 'var(--bg-secondary)',
    padding: '4px',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--card-border)',
  },
  tabButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    border: 'none',
    background: 'none',
    color: 'var(--text-secondary)',
    fontWeight: '600',
    fontSize: '0.88rem',
    borderRadius: 'calc(var(--border-radius-sm) - 4px)',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  activeTab: {
    backgroundColor: 'var(--card-bg)',
    color: 'var(--accent-primary)',
    boxShadow: 'var(--box-shadow-sm)',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 40px',
    gap: '16px',
    textAlign: 'center',
  },
  loadingText: {
    color: 'var(--text-muted)',
    fontWeight: '500',
    fontSize: '1rem',
  },
  dashboardGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  overviewSection: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '30px',
    gap: '30px',
    flexWrap: 'wrap',
    borderLeft: '5px solid var(--accent-primary)',
    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.04) 0%, var(--card-bg) 100%)',
  },
  overviewText: {
    flex: '1 1 400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  panelTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  overviewDesc: {
    color: 'var(--text-secondary)',
    fontSize: '0.92rem',
    lineHeight: '1.5',
  },
  scoreDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginTop: '6px',
  },
  scoreDetailItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
  },
  overviewGauge: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flex: '0 0 auto',
    margin: '0 auto',
  },
  circularContainer: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '120px',
    height: '120px',
  },
  circularSvg: {
    transform: 'rotate(-90deg)',
    zIndex: 2,
  },
  circularText: {
    position: 'absolute',
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    zIndex: 3,
  },
  circularScore: {
    fontSize: '2.2rem',
    fontWeight: '800',
    lineHeight: '1',
  },
  circularTotal: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
    marginLeft: '2px',
  },
  glowBackground: {
    position: 'absolute',
    width: '90px',
    height: '90px',
    borderRadius: '50%',
    filter: 'blur(30px)',
    opacity: '0.2',
    zIndex: 1,
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
  },
  insightCard: {
    padding: '24px',
    borderColor: 'var(--card-border)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid var(--card-border)',
    paddingBottom: '12px',
  },
  list: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
  },
  listItem: {
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
  listText: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  forecastSection: {
    padding: '24px',
    borderColor: 'var(--card-border)',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid var(--card-border)',
    paddingBottom: '14px',
    marginBottom: '18px',
  },
  tableWrapper: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    textAlign: 'left',
    fontSize: '0.9rem',
  },
  th: {
    padding: '12px',
    borderBottom: '2px solid var(--card-border)',
    color: 'var(--text-muted)',
    fontWeight: '700',
    fontSize: '0.82rem',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  tr: {
    borderBottom: '1px solid var(--card-border)',
    transition: 'var(--transition-smooth)',
  },
  td: {
    padding: '14px 12px',
    color: 'var(--text-primary)',
    whiteSpace: 'nowrap',
  },
  noForecast: {
    textAlign: 'center',
    padding: '30px',
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
  },
  forecastBadge: {
    display: 'inline-block',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '20px',
  },
  chartPanel: {
    padding: '20px',
    minHeight: '260px',
  },
  chartTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    marginBottom: '18px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  barList: {
    display: 'grid',
    gap: '12px',
  },
  barRow: {
    display: 'grid',
    gridTemplateColumns: '100px 1fr 32px',
    alignItems: 'center',
    gap: '10px',
  },
  barLabel: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  barTrack: {
    height: '8px',
    borderRadius: '6px',
    backgroundColor: 'var(--bg-secondary)',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: '6px',
  },
  barValue: {
    textAlign: 'right',
    fontWeight: '700',
    fontSize: '0.85rem',
  },
  muted: {
    color: 'var(--text-muted)',
    fontSize: '0.9rem',
    textAlign: 'center',
    padding: '20px 0',
  },
};

export default AiDashboard;
