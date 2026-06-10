import React, { useState, useEffect, useContext, useRef } from 'react';
import { 
  getFoodItems, 
  addFoodItem, 
  updateFoodItem, 
  deleteFoodItem,
  consumeFoodItem,
  getExpirySuggestion,
  searchFoodReference,
  getAiNotifications
} from '../services/api';
import FoodCard from '../components/FoodCard';
import Toast from '../components/Toast';
import { 
  Search, 
  Plus, 
  Filter, 
  Info, 
  Loader2, 
  Calendar, 
  ShieldAlert, 
  ListFilter,
  CheckCircle,
  Refrigerator,
  Smile,
  BrainCircuit,
  ShoppingBag,
  AlertTriangle
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const CATEGORIES = [
  'All',
  'Fruit',
  'Vegetable',
  'Dairy',
  'Meat/Seafood',
  'Packaged Food',
  'Beverage',
  'Bakery',
  'Other'
];

const STORAGE_TYPES = ['Room Temp', 'Fridge', 'Freezer'];
const STATUSES = ['Unopened', 'Opened'];

const Dashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [expiryFilter, setExpiryFilter] = useState('all'); // all, fresh, expiring, expired
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Form states
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Fruit');
  const [quantity, setQuantity] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [storageType, setStorageType] = useState('Fridge');
  const [status, setStatus] = useState('Unopened');
  const [isPredicting, setIsPredicting] = useState(false);
  const [notes, setNotes] = useState('');

  // Autocomplete states
  const [refSuggestions, setRefSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const skipAutocompleteRef = useRef(false);
  const autocompleteRef = useRef(null);

  // Goal tracking states
  const [durationOption, setDurationOption] = useState('none');
  const [customDays, setCustomDays] = useState('');
  const [finishByDate, setFinishByDate] = useState('');
  const [consumptionGoalDays, setConsumptionGoalDays] = useState(null);

  const updateFinishByDateFromDays = (days) => {
    if (days > 0 && purchaseDate) {
      const pDate = new Date(purchaseDate);
      pDate.setDate(pDate.getDate() + days);
      setFinishByDate(pDate.toISOString().split('T')[0]);
      setConsumptionGoalDays(days);
    } else {
      setFinishByDate('');
      setConsumptionGoalDays(null);
    }
  };

  const handleDurationOptionChange = (option) => {
    setDurationOption(option);
    if (option === 'none') {
      setFinishByDate('');
      setConsumptionGoalDays(null);
    } else if (option === '3days') {
      updateFinishByDateFromDays(3);
    } else if (option === '1week') {
      updateFinishByDateFromDays(7);
    } else if (option === '2weeks') {
      updateFinishByDateFromDays(14);
    } else if (option === '1month') {
      updateFinishByDateFromDays(30);
    } else if (option === 'custom') {
      const days = parseInt(customDays) || 0;
      updateFinishByDateFromDays(days);
    }
  };

  const handleCustomDaysChange = (val) => {
    setCustomDays(val);
    const days = parseInt(val) || 0;
    updateFinishByDateFromDays(days);
  };

  const handleFinishByDateChange = (dateVal) => {
    setFinishByDate(dateVal);
    if (purchaseDate && dateVal) {
      const pDate = new Date(purchaseDate);
      pDate.setHours(0, 0, 0, 0);
      const fDate = new Date(dateVal);
      fDate.setHours(0, 0, 0, 0);
      const diffTime = fDate - pDate;
      const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
      setConsumptionGoalDays(days > 0 ? days : 0);
    } else {
      setConsumptionGoalDays(null);
    }
  };

  // Recalculate goal date when purchaseDate changes
  useEffect(() => {
    if (durationOption !== 'none' && durationOption !== 'date') {
      let days = 0;
      if (durationOption === '3days') days = 3;
      else if (durationOption === '1week') days = 7;
      else if (durationOption === '2weeks') days = 14;
      else if (durationOption === '1month') days = 30;
      else if (durationOption === 'custom') days = parseInt(customDays) || 0;
      updateFinishByDateFromDays(days);
    } else if (durationOption === 'date' && finishByDate && purchaseDate) {
      const pDate = new Date(purchaseDate);
      pDate.setHours(0, 0, 0, 0);
      const fDate = new Date(finishByDate);
      fDate.setHours(0, 0, 0, 0);
      const diffTime = fDate - pDate;
      const days = Math.round(diffTime / (1000 * 60 * 60 * 24));
      setConsumptionGoalDays(days > 0 ? days : 0);
    }
  }, [purchaseDate]);

  // Notification Toast states
  const [toast, setToast] = useState(null);

  // AI Notifications
  const [aiNotifications, setAiNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await getAiNotifications();
        if (res.data.success) {
          setAiNotifications(res.data.data);
          
          // Show toast alerts for the top 2 notifications
          res.data.data.slice(0, 2).forEach((notif, idx) => {
            setTimeout(() => {
              let toastType = 'info';
              if (notif.type === 'warning') toastType = 'warning';
              else if (notif.type === 'shopping') toastType = 'success';
              showToast(`AI Suggestion: ${notif.message}`, toastType);
            }, 4500 + idx * 1200);
          });
        }
      } catch (err) {
        console.error('Failed to fetch AI notifications:', err);
      }
    };

    if (items.length > 0) {
      fetchNotifications();
    }
  }, [items.length]);

  // Skip prediction on initial edit modal load
  const skipPredictionRef = useRef(false);

  const { user } = useContext(AuthContext);

  // Fetch food items
  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await getFoodItems({
        search: searchTerm,
        category: selectedCategory,
        expiryStatus: expiryFilter !== 'all' ? expiryFilter : undefined
      });
      if (res.data.success) {
        setItems(res.data.data);
      }
    } catch (err) {
      console.error(err);
      showToast('Error loading food items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [searchTerm, selectedCategory, expiryFilter]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Autocomplete prediction helper
  useEffect(() => {
    const predictExpiry = async () => {
      if (!itemName) return; // Skip if name is empty
      if (skipPredictionRef.current) {
        skipPredictionRef.current = false;
        return;
      }
      setIsPredicting(true);
      try {
        const res = await getExpirySuggestion(itemName, category, storageType, status);
        if (res.data.success) {
          const days = res.data.shelfLifeDays;
          const pDate = new Date(purchaseDate);
          pDate.setDate(pDate.getDate() + days);
          setExpiryDate(pDate.toISOString().split('T')[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsPredicting(false);
      }
    };

    // Debounce the API call
    const timer = setTimeout(() => {
      predictExpiry();
    }, 600);

    return () => clearTimeout(timer);
  }, [itemName, category, purchaseDate, storageType, status]);

  // Autocomplete outside click handler
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Autocomplete search and category detection effect
  useEffect(() => {
    if (!itemName) {
      setRefSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    if (skipAutocompleteRef.current) {
      skipAutocompleteRef.current = false;
      return;
    }

    const fetchSuggestions = async () => {
      try {
        const res = await searchFoodReference(itemName);
        if (res.data.success) {
          setRefSuggestions(res.data.data);
          setShowSuggestions(res.data.data.length > 0);

          // FEATURE 2: Automatic Category Detection
          if (res.data.data.length > 0) {
            const firstMatch = res.data.data[0];
            const typedLower = itemName.toLowerCase().trim();
            const matchNameLower = firstMatch.foodName.toLowerCase();
            
            if (matchNameLower.includes(typedLower) || typedLower.includes(matchNameLower)) {
              setCategory(firstMatch.mappedCategory);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching autocomplete suggestions:', err);
      }
    };

    const debounceTimer = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [itemName]);

  const handleSelectSuggestion = (item) => {
    setItemName(item.foodName);
    setCategory(item.mappedCategory);
    
    // Select recommended storage type based on recommended fields
    let storage = 'Fridge';
    let shelfLifeDays = 7;
    let tips = '';

    if (item.isFridgeRecommended !== false && item.fridgeStorageTime) {
      storage = 'Fridge';
      shelfLifeDays = item.fridgeStorageTime;
      tips = item.fridgeTips || '';
    } else if (item.isPantryRecommended !== false && item.pantryStorageTime) {
      storage = 'Room Temp';
      shelfLifeDays = item.pantryStorageTime;
      tips = item.pantryTips || '';
    } else if (item.isFreezerRecommended !== false && item.freezerStorageTime) {
      storage = 'Freezer';
      shelfLifeDays = item.freezerStorageTime;
      tips = item.freezerTips || '';
    }

    setStorageType(storage);

    // Calculate expiry date based on recommended shelf life
    const pDate = new Date(purchaseDate);
    pDate.setDate(pDate.getDate() + shelfLifeDays);
    setExpiryDate(pDate.toISOString().split('T')[0]);

    // Save FoodKeeper reference info to notes
    let noteText = `FoodKeeper ID: ${item.foodkeeperId}`;
    if (tips) {
      noteText += `\nStorage Tip: ${tips}`;
    }
    if (item.subCategory) {
      noteText += `\nSubcategory: ${item.subCategory}`;
    }
    setNotes(noteText);
    
    setShowSuggestions(false);
  };

  const handleOpenAddModal = () => {
    setIsEditing(false);
    setEditingId(null);
    setItemName('');
    setCategory('Fruit');
    setQuantity('1 unit');
    setPurchaseDate(new Date().toISOString().split('T')[0]);
    setExpiryDate('');
    setStorageType('Fridge');
    setStatus('Unopened');
    setNotes('');
    setRefSuggestions([]);
    setShowSuggestions(false);
    skipAutocompleteRef.current = false;

    // Reset goal states
    setDurationOption('none');
    setCustomDays('');
    setFinishByDate('');
    setConsumptionGoalDays(null);

    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setIsEditing(true);
    setEditingId(item._id);
    setItemName(item.itemName);
    setCategory(item.category);
    setQuantity(item.quantity);
    setPurchaseDate(new Date(item.purchaseDate).toISOString().split('T')[0]);
    setExpiryDate(new Date(item.expiryDate).toISOString().split('T')[0]);
    setStorageType(item.storageType);
    setStatus(item.status);
    setNotes(item.notes || '');
    setRefSuggestions([]);
    setShowSuggestions(false);

    // Initialize goal states from item
    if (item.finishByDate) {
      setFinishByDate(new Date(item.finishByDate).toISOString().split('T')[0]);
      if (item.consumptionGoalDays) {
        setConsumptionGoalDays(item.consumptionGoalDays);
        if ([3, 7, 14, 30].includes(item.consumptionGoalDays)) {
          if (item.consumptionGoalDays === 3) setDurationOption('3days');
          else if (item.consumptionGoalDays === 7) setDurationOption('1week');
          else if (item.consumptionGoalDays === 14) setDurationOption('2weeks');
          else if (item.consumptionGoalDays === 30) setDurationOption('1month');
        } else {
          setDurationOption('custom');
          setCustomDays(item.consumptionGoalDays.toString());
        }
      } else {
        setDurationOption('date');
        setConsumptionGoalDays(null);
      }
    } else {
      setDurationOption('none');
      setCustomDays('');
      setFinishByDate('');
      setConsumptionGoalDays(null);
    }

    skipAutocompleteRef.current = true;
    skipPredictionRef.current = true;
    setShowModal(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!itemName || !category || !quantity || !expiryDate) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const foodData = {
      itemName,
      category,
      quantity,
      purchaseDate,
      expiryDate,
      storageType,
      status,
      notes,
      finishByDate: finishByDate || null,
      consumptionGoalDays: consumptionGoalDays || null
    };

    try {
      if (isEditing) {
        const res = await updateFoodItem(editingId, foodData);
        if (res.data.success) {
          showToast('Food item updated successfully');
          fetchItems();
        }
      } else {
        const res = await addFoodItem(foodData);
        if (res.data.success) {
          showToast('Food item added successfully');
          fetchItems();
        }
      }
      setShowModal(false);
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || err.response?.data?.message || 'Failed to save food item';
      showToast(errMsg, 'error');
    }
  };

  const handleDeleteItem = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const res = await deleteFoodItem(id);
        if (res.data.success) {
          showToast('Food item removed');
          fetchItems();
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to delete food item', 'error');
      }
    }
  };

  const handleConsumeItem = async (id) => {
    if (window.confirm('Mark this food item as consumed?')) {
      try {
        const res = await consumeFoodItem(id);
        if (res.data.success) {
          showToast('Food item marked as consumed');
          fetchItems();
        }
      } catch (err) {
        console.error(err);
        showToast('Failed to mark item as consumed', 'error');
      }
    }
  };

  // Summarize stats for cards
  const stats = (() => {
    let total = items.length;
    let expiring = 0;
    let spoiled = 0;
    
    // Note: If filters are active, total is filtered. Let's calculate from all active items.
    // To show accurate overview, we can look at the raw array.
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysFromNow = new Date(today);
    threeDaysFromNow.setDate(today.getDate() + 3);

    items.forEach((item) => {
      const expDate = new Date(item.expiryDate);
      expDate.setHours(0, 0, 0, 0);

      if (expDate < today) {
        spoiled++;
      } else if (expDate <= threeDaysFromNow) {
        expiring++;
      }
    });

    return { total, expiring, spoiled };
  })();

  // Trigger reminders inside UI on load
  useEffect(() => {
    if (items.length > 0) {
      // 1. Expiry alerts
      const expiringSoonItems = items.filter((item) => {
        const days = Math.ceil((new Date(item.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 1; // Expiring today or tomorrow
      });

      if (expiringSoonItems.length > 0) {
        const names = expiringSoonItems.map(i => i.itemName).slice(0, 2).join(', ');
        const suffix = expiringSoonItems.length > 2 ? ' and others' : '';
        setTimeout(() => {
          showToast(`Reminder: ${names}${suffix} expiring soon!`, 'info');
        }, 1200);
      }

      // 2. Consumption Goal alerts (approaching or missed)
      const approachingGoalItems = items.filter((item) => {
        if (!item.finishByDate) return false;
        const days = Math.ceil((new Date(item.finishByDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days >= 0 && days <= 1; // Goal tomorrow or today
      });

      const missedGoalItems = items.filter((item) => {
        if (!item.finishByDate) return false;
        const days = Math.ceil((new Date(item.finishByDate) - new Date()) / (1000 * 60 * 60 * 24));
        return days < 0; // Goal missed
      });

      if (approachingGoalItems.length > 0) {
        const names = approachingGoalItems.map(i => i.itemName).slice(0, 2).join(', ');
        const suffix = approachingGoalItems.length > 2 ? ' and others' : '';
        setTimeout(() => {
          showToast(`Target Goal: Finish ${names}${suffix} today/tomorrow!`, 'warning');
        }, 2400);
      }

      if (missedGoalItems.length > 0) {
        const names = missedGoalItems.map(i => i.itemName).slice(0, 2).join(', ');
        const suffix = missedGoalItems.length > 2 ? ' and others' : '';
        setTimeout(() => {
          showToast(`Goal Missed: ${names}${suffix} target finish date has passed!`, 'error');
        }, 3600);
      }
    }
  }, [items.length]);

  return (
    <div style={styles.dashboardContainer} className="animate-fade-in">
      {/* Header Overview Banner */}
      <header style={styles.header}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h2 style={styles.welcomeTitle}>
            Hello, {user?.name || 'User'} <Smile size={24} style={{ display: 'inline', verticalAlign: 'middle', color: 'var(--accent-primary)', marginLeft: 6 }} />
          </h2>
          <p style={styles.welcomeSubtitle}>Here is the live status of your smart fridge.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenAddModal}>
          <Plus size={18} /> Add Food Item
        </button>
      </header>

      {/* AI Notifications Alerts */}
      {aiNotifications.length > 0 && (
        <section className="glass-panel animate-slide-up" style={styles.aiAlertsPanel}>
          <div style={styles.aiAlertsHeader}>
            <BrainCircuit size={18} style={{ color: 'var(--accent-primary)' }} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: '700' }}>AI Assistant Alerts</h4>
          </div>
          <div style={styles.aiAlertsList}>
            {aiNotifications.map((notif) => (
              <div key={notif.id} style={styles.aiAlertItem}>
                {notif.type === 'shopping' ? (
                  <ShoppingBag size={14} style={{ color: 'var(--color-success)' }} />
                ) : notif.type === 'warning' ? (
                  <AlertTriangle size={14} style={{ color: 'var(--color-warning)' }} />
                ) : (
                  <Info size={14} style={{ color: 'var(--accent-primary)' }} />
                )}
                <span style={styles.aiAlertText}>{notif.message}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Metrics Counters Row */}
      <section style={styles.metricsGrid}>
        <div className="glass-panel" style={styles.metricCard}>
          <div style={{ ...styles.metricIconContainer, color: 'var(--accent-primary)' }}>
            <Refrigerator size={24} />
          </div>
          <div style={styles.metricTexts}>
            <span style={styles.metricLabel}>Total Items</span>
            <span style={styles.metricValue}>{stats.total}</span>
          </div>
        </div>

        <div className="glass-panel" style={{ ...styles.metricCard, borderLeft: '4px solid var(--color-warning)' }}>
          <div style={{ ...styles.metricIconContainer, color: 'var(--color-warning)' }}>
            <ShieldAlert size={24} />
          </div>
          <div style={styles.metricTexts}>
            <span style={styles.metricLabel}>Expiring Soon</span>
            <span style={styles.metricValue}>{stats.expiring}</span>
          </div>
        </div>

        <div className="glass-panel" style={{ ...styles.metricCard, borderLeft: '4px solid var(--color-danger)' }}>
          <div style={{ ...styles.metricIconContainer, color: 'var(--color-danger)' }}>
            <Info size={24} />
          </div>
          <div style={styles.metricTexts}>
            <span style={styles.metricLabel}>Expired / Spoiled</span>
            <span style={styles.metricValue}>{stats.spoiled}</span>
          </div>
        </div>
      </section>

      {/* Filters & Control bar */}
      <section className="glass-panel" style={styles.controlsBar}>
        <div style={styles.searchBox}>
          <Search size={18} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search food items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filtersGroup}>
          <div style={styles.filterWrapper}>
            <ListFilter size={16} style={styles.filterIcon} />
            <select
              value={expiryFilter}
              onChange={(e) => setExpiryFilter(e.target.value)}
              style={styles.selectFilter}
            >
              <option value="all">All Expiry States</option>
              <option value="fresh">Fresh Items</option>
              <option value="expiring">Expiring Soon</option>
              <option value="expired">Expired / Spoiled</option>
            </select>
          </div>
        </div>
      </section>

      {/* Category Pills horizontal scroller */}
      <section style={styles.categoriesScroller}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              ...styles.catPill,
              ...(selectedCategory === cat ? styles.activeCatPill : {}),
            }}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Grid of Food Items */}
      {loading ? (
        <div style={styles.loadingContainer}>
          <Loader2 size={36} className="animate-float" style={{ animation: 'spin 1s linear infinite', color: 'var(--accent-primary)' }} />
          <span style={styles.loadingText}>Reading fridge inventory...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel" style={styles.emptyContainer}>
          <Refrigerator size={64} style={{ color: 'var(--text-muted)', marginBottom: 16 }} />
          <h3>No items found in your fridge</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: 6, fontSize: '0.9rem' }}>
            Try adjusting your search filters or add a new food item!
          </p>
          <button className="btn btn-primary" onClick={handleOpenAddModal} style={{ marginTop: 18 }}>
            Add Food Item
          </button>
        </div>
      ) : (
        <section style={styles.itemsGrid}>
          {items.map((item) => (
            <FoodCard
              key={item._id}
              item={item}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteItem}
              onConsume={handleConsumeItem}
            />
          ))}
        </section>
      )}

      {/* Add / Edit modal Overlay */}
      {showModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content animate-slide-up">
            <header className="modal-header">
              <h3>{isEditing ? 'Modify Food Item' : 'Add Food Item'}</h3>
              <button className="close-modal-btn" onClick={() => setShowModal(false)}>×</button>
            </header>

            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="form-group" style={{ position: 'relative' }} ref={autocompleteRef}>
                <label className="form-label">Food Item Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Organic Whole Milk"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  onFocus={() => setShowSuggestions(refSuggestions.length > 0)}
                  required
                />
                {showSuggestions && refSuggestions.length > 0 && (
                  <ul className="glass-panel autocomplete-dropdown">
                    {refSuggestions.slice(0, 5).map((item) => (
                      <li
                        key={item._id}
                        onClick={() => handleSelectSuggestion(item)}
                        className="autocomplete-dropdown-item"
                      >
                        <span className="autocomplete-item-name">{item.foodName}</span>
                        <span className="autocomplete-item-category">{item.mappedCategory}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.slice(1).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g., 2 liters, 500g"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Purchase Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ position: 'relative' }}>
                  <label className="form-label">Expiry Date *</label>
                  <input
                    type="date"
                    className="form-input"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                  />
                  {isPredicting && (
                    <span style={styles.predictingIndicator}>
                      <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                      AI predicting...
                    </span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Storage Location</label>
                  <select
                    className="form-input"
                    value={storageType}
                    onChange={(e) => setStorageType(e.target.value)}
                  >
                    {STORAGE_TYPES.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Opened Status</label>
                  <select
                    className="form-input"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                  >
                    {STATUSES.map((stat) => (
                      <option key={stat} value={stat}>{stat}</option>
                    ))}
                  </select>
                </div>
              </div>



              <div className="goal-section">
                <h4 className="goal-section-title">Consumption Goal (Optional)</h4>
                <p className="goal-section-subtitle">Set a target timeline to finish this item, separate from safety expiry.</p>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Consumption Target Mode</label>
                    <select
                      className="form-input"
                      value={durationOption}
                      onChange={(e) => handleDurationOptionChange(e.target.value)}
                    >
                      <option value="none">No Goal</option>
                      <option value="3days">3 Days</option>
                      <option value="1week">1 Week</option>
                      <option value="2weeks">2 Weeks</option>
                      <option value="1month">1 Month</option>
                      <option value="custom">Custom Days</option>
                      <option value="date">Specific Date</option>
                    </select>
                  </div>

                  {durationOption === 'custom' && (
                    <div className="form-group">
                      <label className="form-label">Custom Duration (Days)</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="e.g. 5"
                        value={customDays}
                        onChange={(e) => handleCustomDaysChange(e.target.value)}
                      />
                    </div>
                  )}

                  {(durationOption === 'date' || durationOption !== 'none') && durationOption !== 'custom' && (
                    <div className="form-group">
                      <label className="form-label">Finish By Date</label>
                      <input
                        type="date"
                        className="form-input"
                        value={finishByDate}
                        onChange={(e) => handleFinishByDateChange(e.target.value)}
                        disabled={durationOption !== 'date'}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {isEditing ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast popup */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
};

const styles = {
  dashboardContainer: {
    paddingBottom: '40px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  welcomeTitle: {
    fontSize: '1.8rem',
    fontWeight: '800',
    letterSpacing: '-0.04em',
  },
  welcomeSubtitle: {
    color: 'var(--text-muted)',
    fontSize: '0.95rem',
    marginTop: '4px',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  metricCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '24px',
    borderLeft: '4px solid var(--accent-primary)',
  },
  metricIconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '16px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--card-border)',
  },
  metricTexts: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  metricLabel: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
    letterSpacing: '0.02em',
  },
  metricValue: {
    fontSize: '1.8rem',
    fontWeight: '800',
  },
  controlsBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px',
    borderRadius: 'var(--border-radius-md)',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '16px',
  },
  searchBox: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    flex: 1,
    minWidth: '260px',
  },
  searchIcon: {
    position: 'absolute',
    left: '16px',
    color: 'var(--text-muted)',
  },
  searchInput: {
    width: '100%',
    padding: '10px 16px 10px 46px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--card-border)',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: '0.95rem',
    transition: 'var(--transition-smooth)',
  },
  filtersGroup: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  filterWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  filterIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--text-muted)',
    pointerEvents: 'none',
  },
  selectFilter: {
    padding: '10px 16px 10px 36px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--card-border)',
    borderRadius: 'var(--border-radius-sm)',
    color: 'var(--text-primary)',
    outline: 'none',
    fontSize: '0.9rem',
    fontWeight: '500',
    cursor: 'pointer',
  },
  categoriesScroller: {
    display: 'flex',
    gap: '10px',
    overflowX: 'auto',
    paddingBottom: '16px',
    marginBottom: '20px',
    scrollbarWidth: 'none', // Firefox
  },
  catPill: {
    flexShrink: 0,
    background: 'var(--card-bg)',
    border: '1px solid var(--card-border)',
    color: 'var(--text-secondary)',
    padding: '8px 16px',
    fontWeight: '600',
    fontSize: '0.85rem',
    borderRadius: '9999px',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  activeCatPill: {
    backgroundColor: 'var(--accent-primary)',
    color: 'white',
    borderColor: 'var(--accent-primary)',
    boxShadow: '0 4px 12px -3px var(--accent-glow)',
  },
  itemsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 0',
    gap: '12px',
  },
  loadingText: {
    color: 'var(--text-muted)',
    fontWeight: '500',
    fontSize: '0.95rem',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 40px',
    textAlign: 'center',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  modalContent: {
    width: '100%',
    maxWidth: '560px',
    padding: '24px 30px',
    borderColor: 'var(--card-border)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--card-border)',
    paddingBottom: '14px',
    marginBottom: '20px',
  },
  closeModalBtn: {
    background: 'none',
    border: 'none',
    fontSize: '2rem',
    fontWeight: '300',
    cursor: 'pointer',
    color: 'var(--text-muted)',
    lineHeight: '0.5',
    padding: '8px',
  },
  modalForm: {
    display: 'flex',
    flexDirection: 'column',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  predictingIndicator: {
    position: 'absolute',
    right: '12px',
    bottom: '-18px',
    fontSize: '0.7rem',
    color: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontWeight: '600',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid var(--card-border)',
    paddingTop: '16px',
    marginTop: '12px',
  },
  goalSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid var(--card-border)',
  },
  goalSectionTitle: {
    fontSize: '0.95rem',
    fontWeight: '600',
    marginBottom: '4px',
    color: 'var(--text-primary)',
  },
  goalSectionSubtitle: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginBottom: '12px',
  },
  aiAlertsPanel: {
    padding: '16px 20px',
    marginBottom: '24px',
    borderLeft: '4px solid var(--accent-primary)',
    background: 'linear-gradient(90deg, rgba(16, 185, 129, 0.03) 0%, var(--card-bg) 100%)',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  aiAlertsHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid var(--card-border)',
    paddingBottom: '8px',
  },
  aiAlertsList: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '12px',
  },
  aiAlertItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: 'var(--bg-secondary)',
    padding: '8px 12px',
    borderRadius: 'var(--border-radius-sm)',
    border: '1px solid var(--card-border)',
  },
  aiAlertText: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
};

// Add standard keyframe spin for animations if not defined
const styleSheet = document.styleSheets[0];
try {
  styleSheet.insertRule(`
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `, styleSheet.cssRules.length);
} catch (e) {}

export default Dashboard;
