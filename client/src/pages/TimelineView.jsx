import React, { useEffect, useState } from 'react';
import { CalendarDays, Loader2 } from 'lucide-react';
import { getHistory } from '../services/api';
import { groupHistoryByDate } from '../utils/historyFormat';

const actionText = {
  added: 'added',
  consumed: 'consumed',
  expired: 'expired',
  deleted: 'removed',
};

const TimelineView = () => {
  const [groups, setGroups] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await getHistory();
        if (res.data.success) setGroups(groupHistoryByDate(res.data.data));
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchTimeline();
  }, []);

  return (
    <div className="animate-fade-in" style={styles.page}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>Timeline View</h2>
          <p style={styles.subtitle}>A date-by-date record of additions, consumption, expiry, and removals.</p>
        </div>
      </header>

      <section className="glass-panel" style={styles.timelinePanel}>
        {loading ? (
          <div style={styles.loading}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /> Building timeline...</div>
        ) : Object.keys(groups).length === 0 ? (
          <div style={styles.empty}>No history events have been recorded yet.</div>
        ) : Object.entries(groups).map(([date, records]) => (
          <div key={date} style={styles.dayGroup}>
            <div style={styles.dateMarker}>
              <CalendarDays size={18} />
              <h3 style={styles.dateTitle}>{date}</h3>
            </div>
            <div style={styles.events}>
              {records.map((record) => (
                <div key={record._id} style={styles.event}>
                  <span style={styles.dot} />
                  <div>
                    <strong>{record.itemName}</strong>
                    <span style={styles.eventText}> {actionText[record.actionType] || record.actionType}</span>
                    <div style={styles.meta}>{record.category} | {record.quantity} | {record.storageType}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

const styles = {
  page: { paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: '1.8rem', fontWeight: 800 },
  subtitle: { color: 'var(--text-muted)', marginTop: 4 },
  timelinePanel: { padding: 24 },
  dayGroup: { display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, padding: '18px 0', borderBottom: '1px solid var(--card-border)' },
  dateMarker: { display: 'flex', alignItems: 'center', gap: 10, color: 'var(--accent-primary)' },
  dateTitle: { fontSize: '1rem' },
  events: { display: 'grid', gap: 14, borderLeft: '2px solid var(--card-border)', paddingLeft: 20 },
  event: { display: 'flex', alignItems: 'flex-start', gap: 12, color: 'var(--text-secondary)' },
  dot: { width: 10, height: 10, borderRadius: '50%', background: 'var(--accent-primary)', marginLeft: -26, marginTop: 5, boxShadow: '0 0 0 4px var(--bg-primary)' },
  eventText: { color: 'var(--text-muted)' },
  meta: { color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: 4 },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, padding: 60, color: 'var(--text-muted)' },
  empty: { padding: 48, textAlign: 'center', color: 'var(--text-muted)' },
};

export default TimelineView;
