import React, { useEffect, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { exportHistory, getHistoryStats } from '../services/api';
import { downloadBlob } from '../utils/historyFormat';

const ReportsExport = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState('');

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

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const res = await exportHistory({ format });
      const extension = format === 'excel' ? 'xls' : format;
      downloadBlob(res.data, `food-history.${extension}`);
    } catch (error) {
      console.error(error);
    } finally {
      setExporting('');
    }
  };

  return (
    <div className="animate-fade-in" style={styles.page}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>Reports & Export</h2>
          <p style={styles.subtitle}>Download complete immutable history data for analysis, sharing, or backups.</p>
        </div>
      </header>

      <section style={styles.grid}>
        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}>History Report Summary</h3>
          {loading || !stats ? (
            <div style={styles.loading}><Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /> Loading report data...</div>
          ) : (
            <div style={styles.summaryGrid}>
              <div style={styles.summaryItem}><span>Total purchased</span><strong>{stats.totalItemsEverAdded}</strong></div>
              <div style={styles.summaryItem}><span>Active items</span><strong>{stats.totalActiveItems}</strong></div>
              <div style={styles.summaryItem}><span>Expired items</span><strong>{stats.totalExpiredItems}</strong></div>
              <div style={styles.summaryItem}><span>Consumed items</span><strong>{stats.totalConsumedItems}</strong></div>
              <div style={styles.summaryItem}><span>Inventory value</span><strong>{stats.totalInventoryValue ?? 'Future'}</strong></div>
            </div>
          )}
        </div>

        <div className="glass-panel" style={styles.panel}>
          <h3 style={styles.panelTitle}>Export Complete History</h3>
          <div style={styles.exportButtons}>
            <button className="btn btn-primary" onClick={() => handleExport('csv')} disabled={Boolean(exporting)}>
              <FileText size={18} /> {exporting === 'csv' ? 'Exporting...' : 'CSV'}
            </button>
            <button className="btn btn-primary" onClick={() => handleExport('excel')} disabled={Boolean(exporting)}>
              <FileSpreadsheet size={18} /> {exporting === 'excel' ? 'Exporting...' : 'Excel'}
            </button>
            <button className="btn btn-primary" onClick={() => handleExport('pdf')} disabled={Boolean(exporting)}>
              <Download size={18} /> {exporting === 'pdf' ? 'Exporting...' : 'PDF'}
            </button>
          </div>
        </div>
      </section>

      <section className="glass-panel" style={styles.panel}>
        <h3 style={styles.panelTitle}>Sample API Responses</h3>
        <pre style={styles.code}>{`GET /api/history/stats
{
  "success": true,
  "data": {
    "totalItemsEverAdded": 42,
    "totalActiveItems": 18,
    "totalExpiredItems": 3,
    "totalConsumedItems": 12,
    "mostPurchasedItems": [{ "itemName": "Milk", "count": 6 }],
    "monthlyPurchaseTrends": [{ "label": "2026-05", "total": 14 }]
  }
}

GET /api/history?category=Dairy&startDate=2026-05-01&endDate=2026-05-31
{
  "success": true,
  "count": 1,
  "data": [{
    "itemName": "Milk",
    "category": "Dairy",
    "quantity": "2 liters",
    "actionType": "added"
  }]
}`}</pre>
      </section>
    </div>
  );
};

const styles = {
  page: { paddingBottom: 40 },
  header: { marginBottom: 20 },
  title: { fontSize: '1.8rem', fontWeight: 800 },
  subtitle: { color: 'var(--text-muted)', marginTop: 4 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginBottom: 18 },
  panel: { padding: 20 },
  panelTitle: { fontSize: '1.05rem', marginBottom: 16 },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12 },
  summaryItem: { display: 'grid', gap: 6, padding: 14, border: '1px solid var(--card-border)', borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-secondary)' },
  exportButtons: { display: 'flex', flexWrap: 'wrap', gap: 12 },
  loading: { display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-muted)' },
  code: { overflowX: 'auto', padding: 16, borderRadius: 'var(--border-radius-sm)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)', lineHeight: 1.6 },
};

export default ReportsExport;
