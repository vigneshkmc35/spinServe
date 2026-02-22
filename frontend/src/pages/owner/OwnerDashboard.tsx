import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './OwnerDashboard.css';
import { staffAPI, menuAPI } from '../../services/api';
import { confirmAction, validateMobile, validateRequired, getApiError } from '../../utils/ui';

type TabType = 'dashboard' | 'kitchen' | 'server' | 'spin' | 'menu';

interface StaffMember {
    id: string;
    name: string;
    mobile: string;
    role: string;
    status: 'online' | 'offline';
}

interface MenuItem {
    id: string;
    name: string;
    category: string;
    price: number;
    is_available: boolean;
}

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error';
}

const CATEGORIES = ['Breads', 'Signature Rice', 'Gourmet Sides', 'Desserts', 'Beverages'];

const FOOD_IMAGES: Record<string, string> = {
    'Butter Naan': 'https://images.unsplash.com/photo-1533777857417-cbe94a9d0ee9?auto=format&fit=crop&q=80&w=300',
    'Garlic Naan': 'https://images.unsplash.com/photo-1601050633647-81a35d377a8a?auto=format&fit=crop&q=80&w=300',
    'Roti': 'https://images.unsplash.com/photo-1589187151003-00e9603005b0?auto=format&fit=crop&q=80&w=300',
    'Laccha Paratha': 'https://images.unsplash.com/photo-1626082869491-03486c05d045?auto=format&fit=crop&q=80&w=300',
    'Jeera Rice': 'https://images.unsplash.com/photo-1512058560366-cd242d4536ee?auto=format&fit=crop&q=80&w=300',
    'Veg Biryani': 'https://images.unsplash.com/photo-1563379091339-03b21bc4a6f8?auto=format&fit=crop&q=80&w=300',
    'Paneer Pulao': 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=300',
    'Kashmiri Pulao': 'https://images.unsplash.com/photo-1605333396915-47ed6b68a00e?auto=format&fit=crop&q=80&w=300',
    'Paneer Tikka': 'https://images.unsplash.com/photo-1567184109191-3776122f4109?auto=format&fit=crop&q=80&w=300',
    'Dal Makhani': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=300',
    'Butter Chicken': 'https://images.unsplash.com/photo-1603894584100-348981ef40ae?auto=format&fit=crop&q=80&w=300',
    'Mix Veg': 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=300',
    'Gulab Jamun': 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?auto=format&fit=crop&q=80&w=300',
    'Rasmalai': 'https://images.unsplash.com/photo-1610192244261-3f33de3f72e5?auto=format&fit=crop&q=80&w=300',
    'Kulfi': 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&q=80&w=300',
    'Gajar Halwa': 'https://images.unsplash.com/photo-1613144321350-a9cb579e0094?auto=format&fit=crop&q=80&w=300',
    'Mango Lassi': 'https://images.unsplash.com/photo-1571006682855-3fc2741715a7?auto=format&fit=crop&q=80&w=300',
    'Masala Chai': 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&q=80&w=300',
    'Fresh Lime Soda': 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=300',
    'Cold Coffee': 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=300',
};

const OwnerDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [activeCategory, setActiveCategory] = useState<string>('Breads');
    const [showOnboardModal, setShowOnboardModal] = useState(false);
    const [showFoodModal, setShowFoodModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [toasts, setToasts] = useState<Toast[]>([]);

    const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

    const navigate = useNavigate();

    useEffect(() => {
        if (localStorage.getItem('theme') === 'dark') setIsDarkMode(true);
    }, []);

    const toggleTheme = () => {
        const next = !isDarkMode;
        setIsDarkMode(next);
        localStorage.setItem('theme', next ? 'dark' : 'light');
    };

    // --- Toast System ---
    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const fetchAllData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [staffData, menuData] = await Promise.all([staffAPI.getAll(), menuAPI.getAll()]);
            setAllStaff(staffData);
            setMenuItems(menuData);
        } catch {
            setError('Failed to connect to MongoDB. Please check your backend server.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    // Derived + filtered
    const currentRole = activeTab === 'kitchen' ? 'KITCHEN' : 'SERVER';
    const roleStaff = allStaff.filter(s => s.role === currentRole);
    const filteredStaff = roleStaff.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.mobile.includes(searchQuery)
    );

    const titles: Record<TabType, string> = {
        dashboard: 'Insights', kitchen: 'Kitchen Operations',
        server: 'Service Excellence', spin: 'Spin Intelligence', menu: 'Culinary Catalog'
    };

    const handleLogout = () => { localStorage.removeItem('user'); navigate('/login'); };

    const handleDeleteStaff = async (id: string, name: string) => {
        if (!confirmAction(`Remove "${name}" from the team?`)) return;
        try {
            await staffAPI.delete(id);
            setAllStaff(prev => prev.filter(s => s.id !== id));
            showToast(`${name} has been removed.`, 'success');
        } catch (err) {
            showToast(getApiError(err), 'error');
        }
    };

    const handleOnboardSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError(null);
        const formData = new FormData(e.currentTarget);
        const name = (formData.get('name') as string).trim();
        const mobile = (formData.get('mobile') as string).trim();

        // Frontend validation first
        if (!validateRequired(name)) { setFormError('Name must be at least 2 characters.'); return; }
        if (!validateMobile(mobile)) { setFormError('Enter a valid 10-digit Indian mobile number (starts with 6-9).'); return; }

        setFormLoading(true);
        try {
            if (editingStaff) {
                const updated = await staffAPI.update(editingStaff.id, { name, mobile });
                setAllStaff(prev => prev.map(s => s.id === editingStaff.id ? { ...s, ...updated } : s));
                showToast(`${name} updated successfully.`, 'success');
            } else {
                const created = await staffAPI.create({ name, mobile, role: currentRole });
                setAllStaff(prev => [...prev, { ...created, status: 'online' }]);
                showToast(`${name} onboarded successfully!`, 'success');
            }
            setShowOnboardModal(false);
            setEditingStaff(null);
        } catch (err) {
            setFormError(getApiError(err));
        } finally {
            setFormLoading(false);
        }
    };

    const renderOnboardModal = () => (
        <div className="modal-overlay" onClick={() => { setShowOnboardModal(false); setEditingStaff(null); setFormError(null); }}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <h2>{editingStaff ? 'Edit Member' : 'Onboard Staff'}</h2>
                    <button className="close-btn" onClick={() => { setShowOnboardModal(false); setEditingStaff(null); setFormError(null); }}>×</button>
                </header>
                <form className="modal-form" onSubmit={handleOnboardSubmit}>
                    {formError && <div className="form-error-banner">⚠️ {formError}</div>}
                    <div className="input-group">
                        <label>Full Name</label>
                        <input name="name" type="text" defaultValue={editingStaff?.name} placeholder="e.g. Chef Ramu" required />
                    </div>
                    <div className="input-group">
                        <label>Mobile Number</label>
                        <input name="mobile" type="tel" defaultValue={editingStaff?.mobile} placeholder="e.g. 9876543210" maxLength={10} required />
                    </div>
                    <button type="submit" className="action-btn-main" style={{ marginTop: '1rem', width: '100%' }} disabled={formLoading}>
                        {formLoading ? 'Saving…' : editingStaff ? 'Save Changes' : 'Register Member'}
                    </button>
                </form>
            </div>
        </div>
    );

    const renderStaffModule = () => {
        const roleLabel = activeTab === 'kitchen' ? 'Chef' : 'Server';
        return (
            <div className="module-view fade-in">
                <div className="view-header-row">
                    <div className="header-labels">
                        <h2>{roleStaff.length} {roleLabel} Members</h2>
                    </div>
                    <button className="action-btn-main" onClick={() => { setEditingStaff(null); setFormError(null); setShowOnboardModal(true); }}>
                        + Onboard {roleLabel}
                    </button>
                </div>

                {/* Search Bar */}
                <div className="search-bar-wrap">
                    <span className="search-icon">🔍</span>
                    <input
                        className="search-input"
                        type="text"
                        placeholder={`Search ${roleLabel.toLowerCase()} by name or mobile…`}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>
                    )}
                </div>

                {filteredStaff.length === 0 ? (
                    <div className="empty-state">
                        <p>No members match "<strong>{searchQuery}</strong>"</p>
                    </div>
                ) : (
                    <div className="staff-grid-structured">
                        {filteredStaff.map(member => (
                            <div key={member.id} className="staff-card-structured">
                                <div className="staff-main-info">
                                    <div className="avatar">{member.name.charAt(0).toUpperCase()}</div>
                                    <div className="details">
                                        <h3>{member.name}</h3>
                                        <p>{member.mobile}</p>
                                    </div>
                                </div>
                                <div className="staff-footer-actions">
                                    <div className={`status-tag-simple ${member.status}`}>{member.status}</div>
                                    <div className="footer-btns">
                                        <button className="minimal-action" onClick={() => { setEditingStaff(member); setFormError(null); setShowOnboardModal(true); }}>Edit</button>
                                        <button className="minimal-action danger" onClick={() => handleDeleteStaff(member.id, member.name)}>Delete</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderContent = () => {
        if (loading) return (
            <div className="module-view">
                <div className="loading-state">
                    <div className="loader-ring"></div>
                    <p>Fetching data from MongoDB…</p>
                </div>
            </div>
        );

        if (error) return (
            <div className="module-view">
                <div className="error-state">
                    <p>⚠️ {error}</p>
                    <button className="action-btn-main" onClick={fetchAllData} style={{ marginTop: '1rem' }}>Retry</button>
                </div>
            </div>
        );

        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="module-view fade-in">
                        <div className="stat-grid">
                            <div className="stat-card"><span className="label">REVENUE</span><span className="value">₹42.5k</span><span className="trend positive">↑ 12% this week</span></div>
                            <div className="stat-card"><span className="label">ORDERS</span><span className="value">14</span><span className="trend">Active right now</span></div>
                            <div className="stat-card"><span className="label">SPINS</span><span className="value">86</span><span className="trend positive">↑ 5 wins today</span></div>
                        </div>
                    </div>
                );

            case 'kitchen':
            case 'server':
                return renderStaffModule();

            case 'spin':
                return (
                    <div className="module-view fade-in">
                        <div style={{ maxWidth: 560, margin: '0 auto' }}>
                            <div className="staff-card-structured">
                                <h3 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 800 }}>Spin Configuration</h3>
                                <div className="input-group"><label>Order Unlock Threshold (₹)</label><input type="number" defaultValue={200} /></div>
                                <div className="input-group" style={{ marginTop: '1rem' }}><label>Daily Win Limit</label><input type="number" defaultValue={2} /></div>
                                <button className="action-btn-main" style={{ marginTop: '2rem', width: '100%' }}>Update Rules</button>
                            </div>
                        </div>
                    </div>
                );

            case 'menu': {
                const filtered = menuItems.filter(item => item.category === activeCategory);
                return (
                    <div className="module-view fade-in">
                        <div className="tab-strip-structured">
                            {CATEGORIES.map(cat => (
                                <button key={cat} className={`tab-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>{cat}</button>
                            ))}
                        </div>
                        <div className="view-header-row tight" style={{ marginTop: '2rem' }}>
                            <h2>{activeCategory} <span style={{ color: 'var(--text-body)', fontWeight: 600, fontSize: '1.2rem' }}>({filtered.length})</span></h2>
                            <button className="action-btn-main" onClick={() => setShowFoodModal(true)}>+ New Item</button>
                        </div>
                        <div className="food-grid-structured">
                            {filtered.map(item => (
                                <div key={item.id} className="food-item-structured">
                                    <img src={FOOD_IMAGES[item.name] || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=300'} alt={item.name} />
                                    <div className="item-body">
                                        <div className="top"><h3>{item.name}</h3><span className="price">₹{item.price}</span></div>
                                        <div className="actions">
                                            <button className="action-icon">✏️</button>
                                            <button className="action-icon danger" onClick={() => {
                                                if (confirmAction(`Remove "${item.name}" from the menu?`)) {
                                                    setMenuItems(prev => prev.filter(m => m.id !== item.id));
                                                    showToast(`${item.name} removed from menu.`, 'success');
                                                }
                                            }}>🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            }
            default: return null;
        }
    };

    return (
        <div className={`app-layout ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            {/* Toast Container */}
            <div className="toast-container">
                {toasts.map(t => (
                    <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>
                ))}
            </div>

            <aside className="app-sidebar">
                <div className="sidebar-brand">
                    <div className="brand-icon">🍱</div>
                    <h1>SpinServe</h1>
                </div>
                <nav className="sidebar-nav">
                    {[
                        { id: 'dashboard', icon: '📊', label: 'Insights' },
                        { id: 'kitchen', icon: '👨‍🍳', label: 'Kitchen' },
                        { id: 'server', icon: '💁', label: 'Server' },
                        { id: 'menu', icon: '🍽️', label: 'Food Menu' },
                        { id: 'spin', icon: '🎰', label: 'Settings' }
                    ].map(tab => (
                        <div key={tab.id} className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => { setActiveTab(tab.id as TabType); setSearchQuery(''); }}>
                            <span className="nav-icon">{tab.icon}</span>
                            <span className="nav-label">{tab.label}</span>
                        </div>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button className="btn-logout-minimal" onClick={handleLogout}>Logout</button>
                </div>
            </aside>

            <main className="app-main">
                <header className="app-header">
                    <div className="header-left">
                        <span className="breadcrumb">OWNER PLATFORM</span>
                        <h1>{titles[activeTab]}</h1>
                    </div>
                    <div className="header-right">
                        <button className="theme-toggle" onClick={toggleTheme}>{isDarkMode ? '☀️ Light' : '🌙 Dark'}</button>
                        <div className="user-profile-sq">AD</div>
                    </div>
                </header>
                <div className="scroll-content">{renderContent()}</div>
            </main>

            {showOnboardModal && renderOnboardModal()}

            {showFoodModal && (
                <div className="modal-overlay" onClick={() => setShowFoodModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <h2>Add New Dish</h2>
                            <button className="close-btn" onClick={() => setShowFoodModal(false)}>×</button>
                        </header>
                        <form className="modal-form" onSubmit={(e) => { e.preventDefault(); setShowFoodModal(false); showToast('New dish added.', 'success'); }}>
                            <div className="input-group"><label>Dish Name</label><input type="text" placeholder="e.g. Paneer Butter Masala" required /></div>
                            <div className="input-group"><label>Price (₹)</label><input type="number" min="1" placeholder="e.g. 250" required /></div>
                            <div className="input-group">
                                <label>Category</label>
                                <select style={{ width: '100%', padding: '1rem 1.5rem', borderRadius: 'var(--radius-m)', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-head)', fontSize: '1rem' }}>
                                    {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="action-btn-main" style={{ marginTop: '1rem', width: '100%' }}>Add to Catalog</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;
