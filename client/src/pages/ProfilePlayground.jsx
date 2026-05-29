import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ThemeContext } from '../context/ThemeContext';
import { getFoodItems, addFoodItem } from '../services/api';
import Toast from '../components/Toast';
import { 
  User, 
  Mail, 
  Sun, 
  Moon, 
  Cpu, 
  Camera, 
  ScanBarcode, 
  FileText, 
  ChefHat, 
  Loader2, 
  CheckCircle,
  HelpCircle,
  Plus,
  Compass
} from 'lucide-react';

const ProfilePlayground = () => {
  const { user } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  // Playground Tab State: image-scanner, barcode, recipe-builder
  const [playgroundTab, setPlaygroundTab] = useState('image-scanner');

  // Fridge inventory state (used for recipe builder)
  const [fridgeItems, setFridgeItems] = useState([]);
  const [loadingFridge, setLoadingFridge] = useState(false);

  // States for Image Scanner Sandbox
  const [selectedSampleImage, setSelectedSampleImage] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanning, setScanning] = useState(false);

  // States for Barcode/Receipt OCR Sandbox
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [addingOcrItems, setAddingOcrItems] = useState(false);

  // States for AI Recipe Sandbox
  const [recipes, setRecipes] = useState([]);
  const [generatingRecipes, setGeneratingRecipes] = useState(false);

  // Toast feedback state
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch fridge items to detect expiring foods
  const fetchFridgeItems = async () => {
    setLoadingFridge(true);
    try {
      const res = await getFoodItems();
      if (res.data.success) {
        setFridgeItems(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingFridge(false);
    }
  };

  useEffect(() => {
    fetchFridgeItems();
  }, []);

  // Sandbox 1: Image Recognition Simulation
  const sampleFoodImages = [
    {
      id: 'banana_fresh',
      name: 'Fresh Bananas',
      url: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=150&auto=format&fit=crop&q=60',
      analysis: { item: 'Banana', category: 'Fruit', status: 'Fresh', score: 98, shelfLife: '5 days', rotten: false, description: 'Yellow outer peel, firm skin. Good for standard storage.' }
    },
    {
      id: 'apple_rotten',
      name: 'Rotten Apple',
      url: 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=150&auto=format&fit=crop&q=60',
      analysis: { item: 'Apple', category: 'Fruit', status: 'Spoiled / Moldy', score: 94, shelfLife: 'Expired', rotten: true, description: 'Fungal spots and soft texture. Recommend disposal.' }
    },
    {
      id: 'milk_box',
      name: 'Dairy Milk',
      url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=150&auto=format&fit=crop&q=60',
      analysis: { item: 'Milk', category: 'Dairy', status: 'Fresh', score: 95, shelfLife: '7 days', rotten: false, description: 'Unopened carton package. Safe to keep refrigerated.' }
    }
  ];

  const handleRunImageAnalysis = () => {
    if (!selectedSampleImage) {
      showToast('Please select a food item sample first', 'error');
      return;
    }

    setScanning(true);
    setScanResult(null);

    setTimeout(() => {
      setScanResult(selectedSampleImage.analysis);
      setScanning(false);
      showToast('AI Image Recognition Complete!');
    }, 1800);
  };

  const handleAddScannedItem = async () => {
    if (!scanResult) return;

    try {
      const today = new Date();
      let expDate = new Date();
      if (scanResult.shelfLife === 'Expired') {
        expDate.setDate(today.getDate() - 1);
      } else {
        const days = parseInt(scanResult.shelfLife);
        expDate.setDate(today.getDate() + (isNaN(days) ? 7 : days));
      }

      const res = await addFoodItem({
        itemName: scanResult.item,
        category: scanResult.category,
        quantity: '1 unit',
        purchaseDate: today.toISOString().split('T')[0],
        expiryDate: expDate.toISOString().split('T')[0],
        storageType: 'Fridge',
        status: 'Unopened'
      });

      if (res.data.success) {
        showToast(`Added ${scanResult.item} to fridge inventory`);
        fetchFridgeItems();
      }
    } catch (err) {
      showToast('Failed to add scanned item', 'error');
    }
  };

  // Sandbox 2: Barcode & Receipt OCR Mock
  const mockReceiptOCR = () => {
    setOcrLoading(true);
    setOcrResult(null);

    setTimeout(() => {
      setOcrResult([
        { itemName: 'Spinach', category: 'Vegetable', quantity: '1 pack', shelfLife: 4 },
        { itemName: 'Bread', category: 'Bakery', quantity: '1 loaf', shelfLife: 5 },
        { itemName: 'Chicken Breast', category: 'Meat/Seafood', quantity: '500g', shelfLife: 3 },
      ]);
      setOcrLoading(false);
      showToast('Receipt parsed: 3 items found!');
    }, 2000);
  };

  const handleAddOcrItems = async () => {
    if (!ocrResult) return;
    setAddingOcrItems(true);

    try {
      for (const item of ocrResult) {
        const today = new Date();
        const expDate = new Date();
        expDate.setDate(today.getDate() + item.shelfLife);

        await addFoodItem({
          itemName: item.itemName,
          category: item.category,
          quantity: item.quantity,
          purchaseDate: today.toISOString().split('T')[0],
          expiryDate: expDate.toISOString().split('T')[0],
          storageType: 'Fridge',
          status: 'Unopened'
        });
      }

      showToast('All items added to your fridge successfully!');
      setOcrResult(null);
      fetchFridgeItems();
    } catch (err) {
      showToast('Error saving OCR items', 'error');
    } finally {
      setAddingOcrItems(false);
    }
  };

  // Sandbox 3: Recipe Generator based on Expiring Foods
  const generateRecipesFromFridge = () => {
    setGeneratingRecipes(true);
    setRecipes([]);

    setTimeout(() => {
      // Find expiring items
      const itemsExpiringSoon = fridgeItems.filter((item) => {
        const remaining = new Date(item.expiryDate) - new Date();
        const days = Math.ceil(remaining / (1000 * 60 * 60 * 24));
        return days <= 4;
      });

      const expiringNames = itemsExpiringSoon.map((i) => i.itemName.toLowerCase());

      // Predefined mock recipes database
      const recipeDb = [
        {
          title: 'Creamy Fruit & Banana Parfait',
          ingredients: ['banana', 'yogurt', 'milk'],
          matchPercent: 80,
          difficulty: 'Easy',
          time: '5 mins',
          steps: ['Slice the bananas.', 'Layer yogurt and bananas in a glass.', 'Drizzle honey and add granola on top.']
        },
        {
          title: 'Smart Fridge Vegetable Stir Fry',
          ingredients: ['broccoli', 'carrot', 'spinach', 'tofu', 'onion'],
          matchPercent: 75,
          difficulty: 'Medium',
          time: '15 mins',
          steps: ['Chop carrots, broccoli, and onion.', 'Heat oil in a pan, sauté onion and vegetables.', 'Toss in spinach and sauces. Serve hot.']
        },
        {
          title: 'Sautéed Garlic Chicken Breast',
          ingredients: ['chicken', 'garlic', 'butter'],
          matchPercent: 90,
          difficulty: 'Easy',
          time: '20 mins',
          steps: ['Season chicken breast with salt and pepper.', 'Melt butter with garlic, cook chicken on both sides until golden.', 'Garnish with fresh parsley.']
        }
      ];

      // Calculate matching factor
      const computedRecipes = recipeDb.map((recipe) => {
        const matches = recipe.ingredients.filter(ing => 
          expiringNames.some(item => item.includes(ing))
        );
        const matchPercent = Math.max(10, Math.round((matches.length / recipe.ingredients.length) * 100));
        return {
          ...recipe,
          matchPercent,
          matchedIngredients: matches
        };
      }).sort((a, b) => b.matchPercent - a.matchPercent);

      setRecipes(computedRecipes);
      setGeneratingRecipes(false);
      showToast('Custom recipe ideas synthesized!');
    }, 1800);
  };

  return (
    <div style={styles.container} className="animate-fade-in">
      <div style={styles.layout}>
        {/* Profile Card Sidebar */}
        <aside className="glass-panel" style={styles.sidebar}>
          <div style={styles.profileHeader}>
            <div style={styles.avatarCircle}>
              <User size={36} style={{ color: 'white' }} />
            </div>
            <h3 style={styles.userName}>{user?.name || 'Smart Fridge User'}</h3>
            <span style={styles.userRole}>Smart Fridge Owner</span>
          </div>

          <div style={styles.profileDetails}>
            <div style={styles.detailRow}>
              <Mail size={16} style={{ color: 'var(--text-muted)' }} />
              <span style={styles.detailText}>{user?.email || 'user@example.com'}</span>
            </div>
            <div style={styles.detailRow}>
              <Cpu size={16} style={{ color: 'var(--text-muted)' }} />
              <span style={styles.detailText}>AI Integrations: Active</span>
            </div>
          </div>

          <div style={styles.settingsSection}>
            <h4 style={styles.sectionHeader}>Settings</h4>
            <div style={styles.toggleOption} onClick={toggleTheme}>
              <span>App Theme</span>
              <button style={styles.themeToggleBtn}>
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} style={{ color: '#f59e0b' }} />}
                <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>
                  {theme === 'light' ? 'Dark' : 'Light'}
                </span>
              </button>
            </div>
          </div>
        </aside>

        {/* AI Playground Sandbox Area */}
        <main className="glass-panel" style={styles.playgroundMain}>
          <header style={styles.playgroundHeader}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={24} style={{ color: 'var(--accent-primary)' }} />
              <h3 style={styles.playgroundTitle}>AI & Future Features Playground</h3>
            </div>
            <p style={styles.playgroundSub}>
              Experiment with mock AI pipelines. These sandbox components simulate the machine learning models of future updates.
            </p>
          </header>

          {/* Sub Navigation tabs */}
          <nav style={styles.playgroundNav}>
            <button
              onClick={() => setPlaygroundTab('image-scanner')}
              style={{
                ...styles.playTab,
                ...(playgroundTab === 'image-scanner' ? styles.activePlayTab : {}),
              }}
            >
              <Camera size={16} style={{ marginRight: 6 }} />
              Food Image Scanner
            </button>
            <button
              onClick={() => setPlaygroundTab('barcode')}
              style={{
                ...styles.playTab,
                ...(playgroundTab === 'barcode' ? styles.activePlayTab : {}),
              }}
            >
              <ScanBarcode size={16} style={{ marginRight: 6 }} />
              Receipt OCR / Barcode
            </button>
            <button
              onClick={() => setPlaygroundTab('recipes')}
              style={{
                ...styles.playTab,
                ...(playgroundTab === 'recipes' ? styles.activePlayTab : {}),
              }}
            >
              <ChefHat size={16} style={{ marginRight: 6 }} />
              AI Recipe Generator
            </button>
          </nav>

          {/* Sandbox content components */}
          <div style={styles.sandboxBody}>
            
            {/* Tab 1: Image Recognition */}
            {playgroundTab === 'image-scanner' && (
              <div className="animate-slide-up" style={styles.tabContent}>
                <h4>Rotten Food & Item Recognition Simulation</h4>
                <p style={styles.tabInstruction}>
                  Pick a sample food photo below to feed into the virtual TensorFlow Lite MobileNet classifier.
                </p>

                <div style={styles.imageSelectorGrid}>
                  {sampleFoodImages.map((img) => (
                    <div
                      key={img.id}
                      onClick={() => setSelectedSampleImage(img)}
                      style={{
                        ...styles.imageCard,
                        ...(selectedSampleImage?.id === img.id ? styles.selectedImageCard : {})
                      }}
                    >
                      <img src={img.url} alt={img.name} style={styles.foodThumbnail} />
                      <span style={styles.thumbnailLabel}>{img.name}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.actionsBar}>
                  <button
                    className="btn btn-primary"
                    onClick={handleRunImageAnalysis}
                    disabled={scanning || !selectedSampleImage}
                  >
                    {scanning ? (
                      <>
                        <Loader2 size={16} className="animate-float" style={{ animation: 'spin 1s linear infinite' }} />
                        Analyzing with TensorFlow...
                      </>
                    ) : (
                      'Analyze Selected Image'
                    )}
                  </button>
                </div>

                {/* Analysis Output */}
                {scanResult && (
                  <div className="glass-panel" style={styles.analysisResultPanel}>
                    <header style={styles.analysisHeader}>
                      <h5>Classification Results</h5>
                      <span className={`badge ${scanResult.rotten ? 'badge-danger' : 'badge-success'}`}>
                        {scanResult.status}
                      </span>
                    </header>
                    <div style={styles.resultDetailsGrid}>
                      <div style={styles.resultField}>
                        <span style={styles.resultLabel}>Detected Item</span>
                        <span style={styles.resultVal}>{scanResult.item}</span>
                      </div>
                      <div style={styles.resultField}>
                        <span style={styles.resultLabel}>Category</span>
                        <span style={styles.resultVal}>{scanResult.category}</span>
                      </div>
                      <div style={styles.resultField}>
                        <span style={styles.resultLabel}>Model Confidence</span>
                        <span style={styles.resultVal}>{scanResult.score}%</span>
                      </div>
                      <div style={styles.resultField}>
                        <span style={styles.resultLabel}>Shelf Life Prediction</span>
                        <span style={styles.resultVal}>{scanResult.shelfLife}</span>
                      </div>
                    </div>
                    <p style={styles.resultDescription}>{scanResult.description}</p>
                    
                    {!scanResult.rotten && (
                      <button
                        className="btn btn-secondary"
                        onClick={handleAddScannedItem}
                        style={{ marginTop: 14, width: '100%', fontSize: '0.85rem' }}
                      >
                        <Plus size={14} /> Add Classified Item to Fridge
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Barcode & Receipt OCR */}
            {playgroundTab === 'barcode' && (
              <div className="animate-slide-up" style={styles.tabContent}>
                <h4>Receipt OCR Scanner Sandbox</h4>
                <p style={styles.tabInstruction}>
                  Simulate scanning your grocery bill receipt. The OCR pipeline reads item text, categories, and estimates shelf life automatically.
                </p>

                <div style={styles.scanPlaceholderPanel}>
                  <div style={styles.mockReceiptGraphic}>
                    <FileText size={48} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>GROCERY RECEIPT</span>
                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>* MOCK SIMULATION *</span>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={mockReceiptOCR}
                    disabled={ocrLoading}
                  >
                    {ocrLoading ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Parsing OCR Text...
                      </>
                    ) : (
                      'Simulate Camera Scanning'
                    )}
                  </button>
                </div>

                {ocrResult && (
                  <div className="glass-panel animate-slide-up" style={styles.ocrResultPanel}>
                    <h5>OCR Extraction Output</h5>
                    <ul style={styles.ocrList}>
                      {ocrResult.map((item, index) => (
                        <li key={index} style={styles.ocrListItem}>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={styles.ocrItemName}>{item.itemName}</span>
                            <span style={styles.ocrItemCat}>{item.category} • Qty: {item.quantity}</span>
                          </div>
                          <span className="badge badge-success">Predicted Expiry: {item.shelfLife} days</span>
                        </li>
                      ))}
                    </ul>
                    <button
                      className="btn btn-primary"
                      onClick={handleAddOcrItems}
                      disabled={addingOcrItems}
                      style={{ width: '100%', marginTop: '16px' }}
                    >
                      {addingOcrItems ? (
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        'Save All Scanned Items to Fridge'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: AI Recipes */}
            {playgroundTab === 'recipes' && (
              <div className="animate-slide-up" style={styles.tabContent}>
                <h4>AI Smart Chef Recipe Builder</h4>
                <p style={styles.tabInstruction}>
                  Uses items currently in your fridge—specifically prioritizing those expiring soon—to synthesize meal suggestions.
                </p>

                <div style={styles.actionsBar}>
                  <button
                    className="btn btn-primary"
                    onClick={generateRecipesFromFridge}
                    disabled={generatingRecipes || fridgeItems.length === 0}
                  >
                    {generatingRecipes ? (
                      <>
                        <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                        Analyzing ingredients...
                      </>
                    ) : (
                      'Suggest Recipes'
                    )}
                  </button>
                </div>

                {fridgeItems.length === 0 && (
                  <div style={styles.noIngredientsAlert}>
                    No items in your fridge inventory. Add items on the Dashboard page to enable recipe suggestions!
                  </div>
                )}

                {recipes.length > 0 && (
                  <div style={styles.recipeGrid} className="animate-slide-up">
                    {recipes.map((rec, i) => (
                      <div key={i} className="glass-panel" style={styles.recipeCard}>
                        <div style={styles.recipeHeader}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <ChefHat size={20} style={{ color: 'var(--accent-primary)' }} />
                            <h5>{rec.title}</h5>
                          </div>
                          <span className="badge badge-success" style={{ backgroundColor: 'var(--accent-glow)' }}>
                            {rec.matchPercent}% Match
                          </span>
                        </div>

                        <div style={styles.recipeMeta}>
                          <span>Prep Time: {rec.time}</span>
                          <span>Complexity: {rec.difficulty}</span>
                        </div>

                        <div style={styles.recipeIngredients}>
                          <span style={styles.ingredientLabel}>Used from Fridge:</span>
                          <div style={styles.ingredientPills}>
                            {rec.ingredients.map((ing, k) => {
                              const isMatched = rec.matchedIngredients?.includes(ing);
                              return (
                                <span
                                  key={k}
                                  style={{
                                    ...styles.recipePill,
                                    backgroundColor: isMatched ? 'var(--accent-glow)' : 'var(--bg-secondary)',
                                    color: isMatched ? 'var(--accent-primary)' : 'var(--text-muted)',
                                    borderColor: isMatched ? 'var(--accent-primary)' : 'transparent',
                                  }}
                                >
                                  {ing}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        <div style={styles.stepsList}>
                          <span style={styles.ingredientLabel}>Preparation:</span>
                          <ol style={styles.stepsOrderedList}>
                            {rec.steps.map((step, idx) => (
                              <li key={idx} style={styles.stepItem}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

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
  container: {
    paddingBottom: '40px',
  },
  layout: {
    display: 'flex',
    gap: '24px',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  sidebar: {
    flex: '1 1 300px',
    padding: '30px 24px',
    height: 'fit-content',
    display: 'flex',
    flexDirection: 'column',
    borderColor: 'var(--card-border)',
  },
  profileHeader: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    borderBottom: '1px solid var(--card-border)',
    paddingBottom: '20px',
    marginBottom: '20px',
  },
  avatarCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: 'var(--accent-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 8px 20px -5px var(--accent-glow)',
    marginBottom: '12px',
  },
  userName: {
    fontSize: '1.2rem',
    fontWeight: '700',
  },
  userRole: {
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  profileDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '24px',
  },
  detailRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '0.85rem',
  },
  detailText: {
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  settingsSection: {
    borderTop: '1px solid var(--card-border)',
    paddingTop: '20px',
  },
  sectionHeader: {
    fontSize: '0.85rem',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: '700',
    letterSpacing: '0.04em',
    marginBottom: '12px',
  },
  toggleOption: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  themeToggleBtn: {
    background: 'var(--bg-secondary)',
    border: '1px solid var(--card-border)',
    color: 'var(--text-primary)',
    padding: '8px 14px',
    borderRadius: 'var(--border-radius-sm)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  playgroundMain: {
    flex: '3 1 700px',
    padding: '30px',
    display: 'flex',
    flexDirection: 'column',
    borderColor: 'var(--card-border)',
  },
  playgroundHeader: {
    borderBottom: '1px solid var(--card-border)',
    paddingBottom: '20px',
    marginBottom: '20px',
  },
  playgroundTitle: {
    fontSize: '1.4rem',
    fontWeight: '800',
  },
  playgroundSub: {
    fontSize: '0.85rem',
    color: 'var(--text-muted)',
    marginTop: '6px',
    lineHeight: '1.4',
  },
  playgroundNav: {
    display: 'flex',
    gap: '10px',
    marginBottom: '24px',
    flexWrap: 'wrap',
    borderBottom: '1px solid var(--card-border)',
    paddingBottom: '12px',
  },
  playTab: {
    background: 'none',
    border: 'none',
    color: 'var(--text-muted)',
    padding: '10px 16px',
    fontWeight: '600',
    fontSize: '0.9rem',
    borderRadius: 'var(--border-radius-sm)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    transition: 'var(--transition-smooth)',
  },
  activePlayTab: {
    color: 'var(--accent-primary)',
    backgroundColor: 'var(--active-tab-bg)',
  },
  sandboxBody: {
    flex: 1,
  },
  tabContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  tabInstruction: {
    fontSize: '0.9rem',
    color: 'var(--text-muted)',
    lineHeight: '1.4',
  },
  imageSelectorGrid: {
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
    marginTop: '8px',
  },
  imageCard: {
    flex: '1 1 120px',
    maxWidth: '180px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: 'var(--border-radius-sm)',
    background: 'var(--bg-secondary)',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'var(--transition-smooth)',
  },
  selectedImageCard: {
    borderColor: 'var(--accent-primary)',
    boxShadow: '0 4px 12px -3px var(--accent-glow)',
  },
  foodThumbnail: {
    width: '100%',
    aspectRatio: '4/3',
    objectFit: 'cover',
    borderRadius: '6px',
    border: '1px solid var(--card-border)',
  },
  thumbnailLabel: {
    fontSize: '0.8rem',
    fontWeight: '600',
  },
  actionsBar: {
    display: 'flex',
    marginTop: '10px',
  },
  analysisResultPanel: {
    padding: '20px',
    marginTop: '16px',
    borderColor: 'var(--card-border)',
  },
  analysisHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--card-border)',
    paddingBottom: '10px',
    marginBottom: '14px',
  },
  resultDetailsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    gap: '16px',
    marginBottom: '14px',
  },
  resultField: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  resultLabel: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    textTransform: 'uppercase',
  },
  resultVal: {
    fontSize: '0.95rem',
    fontWeight: '700',
  },
  resultDescription: {
    fontSize: '0.85rem',
    color: 'var(--text-secondary)',
    lineHeight: '1.4',
  },
  scanPlaceholderPanel: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    background: 'var(--bg-secondary)',
    border: '1px dashed var(--card-border)',
    borderRadius: 'var(--border-radius-md)',
    gap: '16px',
  },
  mockReceiptGraphic: {
    width: '120px',
    padding: '16px',
    borderRadius: 'var(--border-radius-sm)',
    background: 'var(--bg-primary)',
    border: '1px solid var(--card-border)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
    boxShadow: 'var(--box-shadow-sm)',
  },
  ocrResultPanel: {
    padding: '20px',
    borderColor: 'var(--card-border)',
  },
  ocrList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginTop: '12px',
  },
  ocrListItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    background: 'var(--bg-secondary)',
    border: '1px solid var(--card-border)',
    borderRadius: 'var(--border-radius-sm)',
  },
  ocrItemName: {
    fontWeight: '600',
    fontSize: '0.95rem',
  },
  ocrItemCat: {
    fontSize: '0.75rem',
    color: 'var(--text-muted)',
    marginTop: '2px',
  },
  noIngredientsAlert: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '16px 20px',
    borderRadius: 'var(--border-radius-sm)',
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
  },
  recipeGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    marginTop: '12px',
  },
  recipeCard: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
    borderColor: 'var(--card-border)',
  },
  recipeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid var(--card-border)',
    paddingBottom: '10px',
  },
  recipeMeta: {
    display: 'flex',
    gap: '16px',
    fontSize: '0.8rem',
    color: 'var(--text-muted)',
    fontWeight: '600',
  },
  recipeIngredients: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  ingredientLabel: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    color: 'var(--text-muted)',
    fontWeight: '700',
  },
  ingredientPills: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  recipePill: {
    fontSize: '0.75rem',
    fontWeight: '600',
    padding: '4px 10px',
    borderRadius: '9999px',
    border: '1px solid transparent',
  },
  stepsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  stepsOrderedList: {
    paddingLeft: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  stepItem: {
    fontSize: '0.85rem',
    lineHeight: '1.4',
    color: 'var(--text-secondary)',
  },
};

export default ProfilePlayground;
