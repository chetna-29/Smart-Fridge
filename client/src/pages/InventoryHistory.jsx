import React, { useEffect, useState } from 'react';
import { Filter, History, Loader2, Search } from 'lucide-react';
import { getHistory } from '../services/api';
import { formatDate } from '../utils/historyFormat';

const CATEGORIES = ['All', 'Fruit', 'Vegetable', 'Dairy', 'Meat/Seafood', 'Packaged Food', 'Beverage', 'Bakery', 'Other'];
const STORAGE_TYPES = ['All', 'Room Temp', 'Fridge', 'Freezer'];
const ACTION_TYPES = ['All', 'added', 'consumed', 'expired', 'deleted'];

const InventoryHistory = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    category: 'All',
    storageType: 'All',
    actionType: 'All',
    startDate: '',
    endDate: '',
  });

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const params = Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value && value !== 'All')
      );
      const res = await getHistory(params);
      if (res.data.success) setRecords(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  return (
    <div className="animate-fade-in" style={styles.page}>
      <header style={styles.header}>
        <div>
          <h2 style={styles.title}>Inventory History</h2>
          <p style={styles.subtitle}>Every food item ever added stays here, even after it leaves the fridge.</p>
        </div>
      </header>

      <section className="glass-panel" style={styles.filters}>
        <div style={styles.searchBox}>
          <Search size={18} style={styles.searchIcon} />
          <input
            className="form-input"
            placeholder="Search by item name"
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            style={styles.searchInput}
          />
        </div>
        <select className="form-input" value={filters.category} onChange={(event) => updateFilter('category', event.target.value)}>
          {CATEGORIES.map((category) => <option key={category}>{category}</option>)}
        </select>
        <select className="form-input" value={filters.storageType} onChange={(event) => updateFilter('storageType', event.target.value)}>
          {STORAGE_TYPES.map((type) => <option key={type}>{type}</option>)}
        </select>
        <select className="form-input" value={filters.actionType} onChange={(event) => updateFilter('actionType', event.target.value)}>
          {ACTION_TYPES.map((type) => <option key={type}>{type}</option>)}
        </select>
        <input className="form-input" type="date" value={filters.startDate} onChange={(event) => updateFilter('startDate', event.target.value)} />
        <input className="form-input" type="date" value={filters.endDate} onChange={(event) => updateFilter('endDate', event.target.value)} />
      </section>

      <section className="glass-panel" style={styles.tablePanel}>
        <div style={styles.tableHeader}>
          <div style={styles.tableTitle}>
            <History size={20} />
            <span>{records.length} history records</span>
          </div>
          <Filter size={18} style={{ color: 'var(--text-muted)' }} />
        </div>

        {loading ? (
          <div style={styles.loading}><Loader2 size={28} style={{ animation: 'spin 1s linear infinite' }} /> Loading history...</div>
        ) : records.length === 0 ? (
          <div style={styles.empty}>No historical records match these filters.</div>
        ) : (
          <div style={styles.tableWrap}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Food</th>
                  <th style={styles.th}>Category</th>
                  <th style={styles.th}>Qty</th>
                  <th style={styles.th}>Purchased</th>
                  <th style={styles.th}>Expiry</th>
                  <th style={styles.th}>Storage</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Action</th>
                  <th style={styles.th}>Added to App</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record._id} style={styles.tr}>
                    <td style={styles.td}>{record.itemName}</td>
                    <td style={styles.td}>{record.category}</td>
                    <td style={styles.td}>{record.quantity}</td>
                    <td style={styles.td}>{formatDate(record.purchaseDate)}</td>
                    <td style={styles.td}>{formatDate(record.expiryDate)}</td>
                    <td style={styles.td}>{record.storageType}</td>
                    <td style={styles.td}>{record.status}</td>
                    <td style={styles.td}><span className="badge badge-success">{record.actionType}</span></td>
                    <td style={styles.td}>{formatDate(record.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

const styles = {
  page: { paddingBottom: 40 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  title: { fontSize: '1.8rem', fontWeight: 800 },
  subtitle: { color: 'var(--text-muted)', marginTop: 4 },
  filters: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, padding: 16, marginBottom: 20 },
  searchBox: { position: 'relative', display: 'flex', alignItems: 'center' },
  searchIcon: { position: 'absolute', left: 14, color: 'var(--text-muted)' },
  searchInput: { paddingLeft: 42 },
  tablePanel: { padding: 18 },
  tableHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  tableTitle: { display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', minWidth: 920 },
  th: { textAlign: 'left', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', padding: '10px 8px', borderBottom: '1px solid var(--card-border)' },
  tr: { borderBottom: '1px solid var(--card-border)' },
  td: { padding: '12px 8px', fontSize: '0.9rem', color: 'var(--text-secondary)' },
  loading: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: 'var(--text-muted)' },
  empty: { padding: 48, textAlign: 'center', color: 'var(--text-muted)' },
};

export default InventoryHistory;
