import React, { useEffect, useState } from 'react';
import { BarChart3, CheckCircle2, Clock, Package, TrendingUp, TriangleAlert } from 'lucide-react';
import { getHistoryStats } from '../services/api';
import { formatDate } from '../utils/historyFormat';

const BarList = ({ data = [], labelKey = 'label', valueKey = 'total' }) => {
  const max = Math.max(...data.map((item) => item[valueKey] || 0), 1);
  return (
    <div style={styles.barList}>
      {data.length === 0 ? (
        <span style={styles.muted}>No data yet</span>
      ) : data.map((item) => (
        <div key={`${item[labelKey]}-${item[valueKey]}`} style={styles.barRow}>
          <span style={styles.barLabel}>{item[labelKey]}</span>
          <div style={styles.barTrack}>
            <div style={{ ...styles.barFill, width: `${((item[valueKey] || 0) / max) * 100}%` }} />
          </div>
          <span style={styles.barValue}>{item[valueKey]}</span>
        </div>
      ))}
    </div>
  );
};

const TrendList = ({ data = [] }) => {
  return (
    <div style={styles.barList}>
      {data.length === 0 ? (
        <span style={styles.muted}>No trend data yet</span>
      ) : data.map((item) => (
        <div key={item.label} style={styles.trendRow}>
          <span style={styles.barLabel}>{item.label}</span>
          <div style={styles.trendValues}>
            <span style={{ color: 'var(--color-success)', fontSize: '0.85rem', fontWeight: 600 }}>Met: {item.success}</span>
            <span style={{ color: 'var(--color-danger)', fontSize: '0.85rem', fontWeight: 600 }}>Missed: {item.missed}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await getHistoryStats();
        if (res.data.success) setStats(res.data.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading || !stats) {
    return <div className="glass-panel" style={styles.loading}>Loading analytics...</div>;
  }

  const cards = [
    { label: 'Total Purchased', value: stats.totalItemsEverAdded, icon: Package, color: 'var(--accent-primary)' },
    { label: 'Active Inventory', value: stats.totalActiveItems, icon: Clock, color: 'var(--color-success)' },
    { label: 'Expired Items', value: stats.totalExpiredItems, icon: TriangleAlert, color: 'var(--color-danger)' },
    { label: 'Consumed Items', value: stats.totalConsumedItems, icon: CheckCircle2, color: 'var(--color-warning)' },
  ];

  return (
    <div className="animate-fade-in" style={styles.page}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>Analytics Dashboard</h2>
          <p style={styles.subtitle}>Purchase trends, category mix, waste signals, and AI-ready planning data.</p>
        </div>
      </header>

      {/* AI Personal Insights Panel */}
      {stats.aiInsights && stats.aiInsights.length > 0 && (
        <section className="glass-panel" style={styles.insightsPanel}>
          <h3 style={styles.insightsTitle}>🤖 Smart Fridge AI Insights</h3>
          <div style={styles.insightsList}>
            {stats.aiInsights.map((insight, idx) => (
              <div key={idx} style={styles.insightItem}>
                <span style={styles.insightText}>{insight}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      <h3 style={styles.sectionTitle}>General Inventory Analytics</h3>
      <section style={styles.metricGrid}>
        {cards.map(({ label, value, icon: Icon, color }) => (
          <div className="glass-panel" style={styles.metricCard} key={label}>
            <Icon size={24} style={{ color }} />
            <span style={styles.metricLabel}>{label}</span>
            <strong style={styles.metricValue}>{value}</strong>
          </div>
        ))}
      </section>

      <section style={styles.grid}>
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}><TrendingUp size={18} /> Monthly Purchase Trends</h3>
          <BarList data={stats.monthlyPurchaseTrends} />
        </div>
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}><BarChart3 size={18} /> Weekly Purchase Trends</h3>
          <BarList data={stats.weeklyPurchaseTrends} />
        </div>
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}>Top 5 Most Added</h3>
          <BarList data={stats.mostPurchasedItems} labelKey="itemName" valueKey="count" />
        </div>
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}>Category Statistics</h3>
          <BarList data={stats.categoryWiseStatistics} labelKey="category" valueKey="total" />
        </div>
      </section>

      <section style={styles.grid}>
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}>Frequently Wasted Items</h3>
          <BarList data={stats.frequentlyWastedItems} labelKey="itemName" valueKey="count" />
        </div>
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}>Recently Added Foods</h3>
          {stats.dashboardWidgets.recentlyAddedFoods.length === 0 ? (
            <span style={styles.muted}>No recent food additions</span>
          ) : stats.dashboardWidgets.recentlyAddedFoods.slice(0, 6).map((item) => (
            <div key={item._id} style={styles.listItem}>
              <span>{item.itemName}</span>
              <small>{formatDate(item.createdAt)}</small>
            </div>
          ))}
        </div>
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}>Expiring Foods</h3>
          {stats.dashboardWidgets.expiringFoods.length === 0 ? (
            <span style={styles.muted}>Nothing expiring soon</span>
          ) : stats.dashboardWidgets.expiringFoods.slice(0, 6).map((item) => (
            <div key={item._id} style={styles.listItem}>
              <span>{item.itemName}</span>
              <small>{formatDate(item.expiryDate)}</small>
            </div>
          ))}
        </div>
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}>Expired Foods</h3>
          {stats.dashboardWidgets.expiredFoods.length === 0 ? (
            <span style={styles.muted}>No expired active items</span>
          ) : stats.dashboardWidgets.expiredFoods.slice(0, 6).map((item) => (
            <div key={item._id} style={styles.listItem}>
              <span>{item.itemName}</span>
              <small>{formatDate(item.expiryDate)}</small>
            </div>
          ))}
        </div>
      </section>

      {/* Consumption Goal Tracking Performance Section */}
      {stats.consumptionGoalStats && (
        <>
          <h3 style={styles.sectionTitle}>Consumption Goal Tracking</h3>
          <section style={styles.metricGrid}>
            <div className="glass-panel" style={styles.metricCard}>
              <Package size={24} style={{ color: 'var(--accent-primary)' }} />
              <span style={styles.metricLabel}>Total Goals Set</span>
              <strong style={styles.metricValue}>{stats.consumptionGoalStats.totalGoals}</strong>
            </div>
            <div className="glass-panel" style={styles.metricCard}>
              <CheckCircle2 size={24} style={{ color: 'var(--color-success)' }} />
              <span style={styles.metricLabel}>Completed On Time</span>
              <strong style={styles.metricValue}>{stats.consumptionGoalStats.goalsCompletedOnTime}</strong>
            </div>
            <div className="glass-panel" style={styles.metricCard}>
              <TriangleAlert size={24} style={{ color: 'var(--color-danger)' }} />
              <span style={styles.metricLabel}>Goals Missed</span>
              <strong style={styles.metricValue}>{stats.consumptionGoalStats.goalsMissed}</strong>
            </div>
            <div className="glass-panel" style={styles.metricCard}>
              <TrendingUp size={24} style={{ color: 'var(--color-warning)' }} />
              <span style={styles.metricLabel}>Success Rate</span>
              <strong style={styles.metricValue}>{stats.consumptionGoalStats.consumptionSuccessRate}%</strong>
            </div>
          </section>

          <section style={styles.grid}>
            <div className="glass-panel" style={styles.panel}>
              <h3 style={styles.panelTitle}>Goal Status Distribution</h3>
              <BarList data={stats.goalCompletionRate} labelKey="status" valueKey="count" />
            </div>
            <div className="glass-panel" style={styles.panel}>
              <h3 style={styles.panelTitle}>Most On-Time Foods</h3>
              <BarList data={stats.mostOnTimeFoods} labelKey="itemName" valueKey="count" />
            </div>
            <div className="glass-panel" style={styles.panel}>
              <h3 style={styles.panelTitle}>Most Missed Foods</h3>
              <BarList data={stats.mostMissedFoods} labelKey="itemName" valueKey="count" />
            </div>
            <div className="glass-panel" style={styles.panel}>
              <h3 style={styles.panelTitle}>Consumption Trends</h3>
              <TrendList data={stats.consumptionTrends} />
            </div>
          </section>
        </>
      )}
    </div>
  );
};

const styles = {
  page: { paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: '1.8rem', fontWeight: 800 },
  subtitle: { color: 'var(--text-muted)', marginTop: 4 },
  sectionTitle: { fontSize: '1.25rem', fontWeight: 700, marginTop: 24, marginBottom: 16, color: 'var(--text-primary)' },
  metricGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 20 },
  metricCard: { display: 'grid', gap: 8, padding: 20 },
  metricLabel: { color: 'var(--text-muted)', fontSize: '0.82rem', textTransform: 'uppercase', fontWeight: 700 },
  metricValue: { fontSize: '2rem' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18, marginBottom: 18 },
  panel: { padding: 18, minHeight: 240 },
  panelTitle: { display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', marginBottom: 16 },
  barList: { display: 'grid', gap: 12 },
  barRow: { display: 'grid', gridTemplateColumns: '95px 1fr 32px', alignItems: 'center', gap: 10 },
  barLabel: { fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  barTrack: { height: 8, borderRadius: 6, background: 'var(--bg-secondary)', overflow: 'hidden' },
  barFill: { height: '100%', background: 'var(--accent-primary)', borderRadius: 6 },
  barValue: { textAlign: 'right', fontWeight: 700 },
  listItem: { display: 'flex', justifyContent: 'space-between', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--card-border)' },
  muted: { color: 'var(--text-muted)' },
  loading: { padding: 40, textAlign: 'center', color: 'var(--text-muted)' },
  insightsPanel: {
    padding: 20,
    marginBottom: 20,
    borderLeft: '4px solid var(--accent-primary)',
    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.05) 0%, var(--card-bg) 100%)',
  },
  insightsTitle: {
    fontSize: '1.1rem',
    fontWeight: 700,
    marginBottom: 12,
    color: 'var(--text-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  insightsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
    gap: 12,
  },
  insightItem: {
    padding: '10px 14px',
    background: 'var(--bg-secondary)',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--card-border)',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
  },
  insightText: {
    lineHeight: '1.4',
  },
  trendRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid var(--card-border)',
  },
  trendValues: {
    display: 'flex',
    gap: 12,
  },
};

export default AnalyticsDashboard;
