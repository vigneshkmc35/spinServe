import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OwnerDashboard.css';
import { staffAPI, menuAPI } from '../../services/api';
import { validateMobile, validateRequired, getApiError } from '../../utils/ui';
import ConfirmDialog from '../../components/ConfirmDialog';

type TabType = 'dashboard' | 'kitchen' | 'server' | 'spin' | 'menu';

interface StaffMember { id: string; name: string; mobile: string; role: string; status: 'online' | 'offline'; }
interface MenuGroup { id: string; title: string; image_url?: string; restaurant_id: string; }
interface MenuItemData { id: string; group_id: string; restaurant_id: string; name: string; description?: string; price: number; image_url?: string; is_available: boolean; }
interface Toast { id: number; message: string; type: 'success' | 'error'; }
interface ConfirmState { isOpen: boolean; title: string; message: string; confirmLabel: string; onConfirm: () => void; }

const DEFAULT_CONFIRM: ConfirmState = { isOpen: false, title: '', message: '', confirmLabel: 'Confirm', onConfirm: () => { } };

const OwnerDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [showOnboardModal, setShowOnboardModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formLoading, setFormLoading] = useState(false);
    const [staffLoading, setStaffLoading] = useState(false);
    const [menuLoading, setMenuLoading] = useState(false);
    const [staffError, setStaffError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [toasts, setToasts] = useState<Toast[]>([]);
    const [confirmState, setConfirmState] = useState<ConfirmState>(DEFAULT_CONFIRM);

    // Staff
    const [allStaff, setAllStaff] = useState<StaffMember[]>([]);

    // Menu
    const [menuGroups, setMenuGroups] = useState<MenuGroup[]>([]);
    const [menuItems, setMenuItems] = useState<MenuItemData[]>([]);
    const [activeGroup, setActiveGroup] = useState<MenuGroup | null>(null);
    const [selectedItem, setSelectedItem] = useState<MenuItemData | null>(null);

    // Dialogs
    const [showGroupDialog, setShowGroupDialog] = useState(false);
    const [groupTitle, setGroupTitle] = useState('');
    const [groupImage, setGroupImage] = useState('');
    const [groupDialogError, setGroupDialogError] = useState<string | null>(null);
    const [showItemDialog, setShowItemDialog] = useState(false);
    const [itemDialogError, setItemDialogError] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => { if (localStorage.getItem('theme') === 'dark') setIsDarkMode(true); }, []);
    const toggleTheme = () => { const n = !isDarkMode; setIsDarkMode(n); localStorage.setItem('theme', n ? 'dark' : 'light'); };

    const showToast = useCallback((message: string, type: 'success' | 'error') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
    }, []);

    const requestConfirm = useCallback((title: string, message: string, confirmLabel: string, onConfirm: () => void) => {
        setConfirmState({ isOpen: true, title, message, confirmLabel, onConfirm });
    }, []);
    const closeConfirm = () => setConfirmState(DEFAULT_CONFIRM);

    // ── Fetch Staff ─────────────────────────────────────────────────────────
    const fetchStaff = useCallback(async () => {
        setStaffLoading(true); setStaffError(null);
        try { setAllStaff(await staffAPI.getAll()); }
        catch { setStaffError('Failed to load staff. Please retry.'); }
        finally { setStaffLoading(false); }
    }, []);

    // ── Fetch Menu ──────────────────────────────────────────────────────────
    const fetchMenu = useCallback(async () => {
        setMenuLoading(true);
        try {
            const [groups, items] = await Promise.all([menuAPI.getGroups(), menuAPI.getItems()]);
            setMenuGroups(groups);
            setMenuItems(items);
            if (groups.length > 0) setActiveGroup(g => g ?? groups[0]);
        } catch { showToast('Failed to load menu data.', 'error'); }
        finally { setMenuLoading(false); }
    }, [showToast]);

    useEffect(() => { fetchStaff(); }, [fetchStaff]);
    useEffect(() => { if (activeTab === 'menu') fetchMenu(); }, [activeTab, fetchMenu]);

    const currentRole = activeTab === 'kitchen' ? 'KITCHEN' : 'SERVER';
    const roleStaff = allStaff.filter(s => s.role === currentRole);
    const filteredStaff = roleStaff.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.mobile.includes(searchQuery)
    );
    const groupItems = activeGroup ? menuItems.filter(i => i.group_id === activeGroup.id) : [];

    const titles: Record<TabType, string> = {
        dashboard: 'Insights', kitchen: 'Kitchen Operations',
        server: 'Service Excellence', spin: 'Spin Intelligence', menu: 'Culinary Catalog'
    };

    const handleLogout = () => { localStorage.removeItem('user'); navigate('/login'); };

    const handleDeleteStaff = (id: string, name: string) => {
        requestConfirm('Remove Member', `Remove "${name}" from the team? This cannot be undone.`, 'Yes, Remove', async () => {
            closeConfirm();
            try { await staffAPI.delete(id); setAllStaff(prev => prev.filter(s => s.id !== id)); showToast(`${name} removed.`, 'success'); }
            catch (err) { showToast(getApiError(err), 'error'); }
        });
    };

    const handleOnboardSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setFormError(null);
        const fd = new FormData(e.currentTarget);
        const name = (fd.get('name') as string).trim();
        const mobile = (fd.get('mobile') as string).trim();
        if (!validateRequired(name)) { setFormError('Name must be at least 2 characters.'); return; }
        if (!validateMobile(mobile)) { setFormError('Enter a valid 10-digit Indian mobile number (starts with 6-9).'); return; }
        setFormLoading(true);
        try {
            if (editingStaff) {
                const updated = await staffAPI.update(editingStaff.id, { name, mobile });
                setAllStaff(prev => prev.map(s => s.id === editingStaff.id ? { ...s, ...updated } : s));
                showToast(`${name} updated.`, 'success');
            } else {
                const created = await staffAPI.create({ name, mobile, role: currentRole });
                setAllStaff(prev => [...prev, { ...created, status: 'online' }]);
                showToast(`${name} onboarded!`, 'success');
            }
            setShowOnboardModal(false); setEditingStaff(null);
        } catch (err) { setFormError(getApiError(err)); }
        finally { setFormLoading(false); }
    };

    // ── Menu Handlers ───────────────────────────────────────────────────────
    const handleAddGroup = async () => {
        setGroupDialogError(null);
        if (!groupTitle.trim()) { setGroupDialogError('Group title is required'); return; }
        try {
            const newGroup = await menuAPI.createGroup({ title: groupTitle.trim(), image_url: groupImage.trim() || undefined });
            setMenuGroups(prev => [...prev, newGroup]);
            setActiveGroup(newGroup);
            setGroupTitle(''); setGroupImage(''); setShowGroupDialog(false);
            showToast(`"${newGroup.title}" group created.`, 'success');
        } catch (err) { setGroupDialogError(getApiError(err)); }
    };

    const handleAddItem = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); setItemDialogError(null);
        if (!activeGroup) return;
        const fd = new FormData(e.currentTarget);
        const name = (fd.get('iname') as string).trim();
        const desc = (fd.get('idesc') as string).trim();
        const price = parseFloat(fd.get('iprice') as string);
        const image_url = (fd.get('iimage') as string).trim() || undefined;
        if (!name) { setItemDialogError('Item name is required'); return; }
        if (!price || price <= 0) { setItemDialogError('Enter a valid price'); return; }
        try {
            const created = await menuAPI.createItem({ group_id: activeGroup.id, name, description: desc || undefined, price, image_url });
            setMenuItems(prev => [...prev, created]);
            setShowItemDialog(false);
            showToast(`"${name}" added to ${activeGroup.title}.`, 'success');
        } catch (err) { setItemDialogError(getApiError(err)); }
    };

    const handleDeleteItem = (id: string, name: string) => {
        requestConfirm('Remove Dish', `Remove "${name}" from the menu? Customers won't see it anymore.`, 'Yes, Remove', async () => {
            closeConfirm();
            try {
                await menuAPI.deleteItem(id);
                setMenuItems(prev => prev.filter(i => i.id !== id));
                if (selectedItem?.id === id) setSelectedItem(null);
                showToast(`${name} removed.`, 'success');
            } catch (err) { showToast(getApiError(err), 'error'); }
        });
    };

    const handleDeleteGroup = (id: string, title: string) => {
        requestConfirm('Delete Group', `Delete "${title}" and ALL its items? This cannot be undone.`, 'Yes, Delete All', async () => {
            closeConfirm();
            try {
                await menuAPI.deleteGroup(id);
                const remaining = menuGroups.filter(g => g.id !== id);
                setMenuGroups(remaining);
                setMenuItems(prev => prev.filter(i => i.group_id !== id));
                setActiveGroup(remaining[0] || null);
                setSelectedItem(null);
                showToast(`"${title}" group deleted.`, 'success');
            } catch (err) { showToast(getApiError(err), 'error'); }
        });
    };

    // ── Render Staff ─────────────────────────────────────────────────────────
    const renderStaffModule = () => {
        const roleLabel = activeTab === 'kitchen' ? 'Chef' : 'Server';
        if (staffLoading) return <div className="module-view"><div className="loading-state"><div className="loader-ring"></div><p>Loading staff…</p></div></div>;
        if (staffError) return <div className="module-view"><div className="error-state"><p>⚠️ {staffError}</p><button className="action-btn-main" onClick={fetchStaff} style={{ marginTop: '1rem' }}>Retry</button></div></div>;
        return (
            <div className="module-view fade-in">
                <div className="view-header-row">
                    <div className="header-labels"><h2>{roleStaff.length} {roleLabel} Members</h2></div>
                    <button className="action-btn-main" onClick={() => { setEditingStaff(null); setFormError(null); setShowOnboardModal(true); }}>+ Onboard {roleLabel}</button>
                </div>
                <div className="search-bar-wrap">
                    <span className="search-icon">🔍</span>
                    <input className="search-input" type="text" placeholder={`Search by name or mobile…`} value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                    {searchQuery && <button className="search-clear" onClick={() => setSearchQuery('')}>×</button>}
                </div>
                {filteredStaff.length === 0
                    ? <div className="empty-state"><p>No members match "<strong>{searchQuery}</strong>"</p></div>
                    : <div className="staff-grid-structured">{filteredStaff.map(member => (
                        <div key={member.id} className="staff-card-structured">
                            <div className="staff-main-info">
                                <div className="avatar">{member.name.charAt(0).toUpperCase()}</div>
                                <div className="details"><h3>{member.name}</h3><p>{member.mobile}</p></div>
                            </div>
                            <div className="staff-footer-actions">
                                <div className={`status-tag-simple ${member.status}`}>{member.status}</div>
                                <div className="footer-btns">
                                    <button className="minimal-action" onClick={() => { setEditingStaff(member); setFormError(null); setShowOnboardModal(true); }}>Edit</button>
                                    <button className="minimal-action danger" onClick={() => handleDeleteStaff(member.id, member.name)}>Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}</div>}
            </div>
        );
    };

    // ── Render Menu ───────────────────────────────────────────────────────────
    const renderMenuModule = () => {
        if (menuLoading) return <div className="module-view"><div className="loading-state"><div className="loader-ring"></div><p>Loading menu from MongoDB…</p></div></div>;
        return (
            <div className="module-view menu-module-view fade-in">
                <div className={`menu-catalog-grid ${selectedItem ? 'has-detail' : ''}`}>

                    {/* ── LEFT COLUMN: categories + items ── */}
                    <div className="menu-left-col">
                        {/* Group Scroll Row */}
                        <div className="menu-section-label">CATEGORIES</div>
                        <div className="group-scroll-row">
                            <div className="group-card group-add-card" onClick={() => { setGroupDialogError(null); setShowGroupDialog(true); }}>
                                <div className="group-add-icon">+</div>
                                <span>New Group</span>
                            </div>
                            {menuGroups.map(group => (
                                <div key={group.id} className={`group-card ${activeGroup?.id === group.id ? 'active' : ''}`}
                                    onClick={() => { setActiveGroup(group); setSelectedItem(null); }}>
                                    {group.image_url
                                        ? <img src={group.image_url} alt={group.title} />
                                        : <div className="group-card-placeholder">{group.title.charAt(0)}</div>}
                                    <div className="group-card-label">{group.title}</div>
                                    {activeGroup?.id === group.id && <div className="group-active-bar" />}
                                </div>
                            ))}
                        </div>

                        {/* Items Panel */}
                        {activeGroup && (
                            <div className="items-panel">
                                <div className="items-panel-header">
                                    <div>
                                        <h2 className="items-panel-title">{activeGroup.title}</h2>
                                        <p className="items-panel-sub">{groupItems.length} items · click any item to view details</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button className="minimal-action danger" style={{ padding: '0.6rem 1.2rem' }}
                                            onClick={() => handleDeleteGroup(activeGroup.id, activeGroup.title)}>Delete Group</button>
                                        <button className="action-btn-main" onClick={() => { setItemDialogError(null); setShowItemDialog(true); }}>+ Add Item</button>
                                    </div>
                                </div>

                                <div className="items-grid-vertical">
                                    {groupItems.map(item => (
                                        <div key={item.id}
                                            className={`menu-item-card ${selectedItem?.id === item.id ? 'selected' : ''}`}
                                            onClick={() => setSelectedItem(prev => prev?.id === item.id ? null : item)}>
                                            <img
                                                src={item.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200'}
                                                alt={item.name}
                                                className="menu-item-thumb"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.onerror = null;
                                                    target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200';
                                                }}
                                            />
                                            <div className="menu-item-info">
                                                <div className="menu-item-top">
                                                    <h3>{item.name}</h3>
                                                    <span className="menu-item-price">₹{item.price}</span>
                                                </div>
                                                <p className="menu-item-desc">{item.description || 'No description available'}</p>
                                            </div>
                                            <div className="menu-item-actions">
                                                <button className="action-icon danger" onClick={e => { e.stopPropagation(); handleDeleteItem(item.id, item.name); }}>🗑️</button>
                                            </div>
                                        </div>
                                    ))}
                                    {groupItems.length === 0 && (
                                        <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                                            <p>No items yet. Click <strong>+ Add Item</strong> to begin.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {menuGroups.length === 0 && !menuLoading && (
                            <div className="empty-state" style={{ marginTop: '4rem' }}>
                                <p>No groups yet. Click <strong>+ New Group</strong> to create your first category.</p>
                            </div>
                        )}
                    </div>

                    {/* ── RIGHT COLUMN: full-height detail panel ── */}
                    {selectedItem && (
                        <div className="menu-right-col">
                            <div className="item-detail-drawer">
                                {/* Hero image */}
                                <div className="drawer-hero">
                                    <img
                                        src={selectedItem.image_url || 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800'}
                                        alt={selectedItem.name}
                                        className="drawer-hero-img"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null; // prevent infinite loop
                                            target.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800';
                                        }}
                                    />
                                    <div className="drawer-hero-gradient" />
                                    <button className="drawer-close" onClick={() => setSelectedItem(null)}>✕</button>
                                    <div className="drawer-hero-info">
                                        <h2 className="drawer-hero-name">{selectedItem.name}</h2>
                                        <span className="drawer-hero-price">₹{selectedItem.price}</span>
                                    </div>
                                </div>

                                {/* Body */}
                                <div className="drawer-body">
                                    <div className="drawer-pills-row">
                                        <span className={`drawer-pill ${selectedItem.is_available ? 'pill-green' : 'pill-red'}`}>
                                            <span className="pill-dot" />
                                            {selectedItem.is_available ? 'Available' : 'Unavailable'}
                                        </span>
                                        <span className="drawer-pill pill-neutral">
                                            🍽 {activeGroup?.title}
                                        </span>
                                    </div>

                                    <div className="drawer-desc-block">
                                        <p className="drawer-desc-label">Description</p>
                                        <p className="drawer-desc-text">
                                            {selectedItem.description || 'No description provided for this dish.'}
                                        </p>
                                    </div>

                                    <div className="drawer-price-card">
                                        <div className="dpc-row">
                                            <span>Base Price</span>
                                            <strong>₹{selectedItem.price}</strong>
                                        </div>
                                        <div className="dpc-row">
                                            <span>CGST (2.5%)</span>
                                            <strong>₹{(selectedItem.price * 0.025).toFixed(2)}</strong>
                                        </div>
                                        <div className="dpc-row">
                                            <span>SGST (2.5%)</span>
                                            <strong>₹{(selectedItem.price * 0.025).toFixed(2)}</strong>
                                        </div>
                                        <div className="dpc-row dpc-total">
                                            <span>Total</span>
                                            <strong>₹{(selectedItem.price * 1.05).toFixed(2)}</strong>
                                        </div>
                                    </div>

                                    <div className="drawer-action-row">
                                        <button className="drawer-btn-edit">✏️ Edit Item</button>
                                        <button
                                            className="drawer-btn-delete"
                                            onClick={() => handleDeleteItem(selectedItem.id, selectedItem.name)}
                                        >
                                            🗑 Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };




    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return (
                <div className="module-view fade-in">
                    <div className="stat-grid">
                        <div className="stat-card"><span className="label">REVENUE</span><span className="value">₹42.5k</span><span className="trend positive">↑ 12% this week</span></div>
                        <div className="stat-card"><span className="label">ORDERS</span><span className="value">14</span><span className="trend">Active right now</span></div>
                        <div className="stat-card"><span className="label">SPINS</span><span className="value">86</span><span className="trend positive">↑ 5 wins today</span></div>
                    </div>
                </div>
            );
            case 'kitchen': case 'server': return renderStaffModule();
            case 'spin': return (
                <div className="module-view fade-in"><div style={{ maxWidth: 560, margin: '0 auto' }}>
                    <div className="staff-card-structured">
                        <h3 style={{ marginBottom: '2rem', fontSize: '1.5rem', fontWeight: 800 }}>Spin Configuration</h3>
                        <div className="input-group"><label>Order Unlock Threshold (₹)</label><input type="number" defaultValue={200} /></div>
                        <div className="input-group" style={{ marginTop: '1rem' }}><label>Daily Win Limit</label><input type="number" defaultValue={2} /></div>
                        <button className="action-btn-main" style={{ marginTop: '2rem', width: '100%' }}>Update Rules</button>
                    </div>
                </div></div>
            );
            case 'menu': return renderMenuModule();
            default: return null;
        }
    };

    return (
        <div className={`app-layout ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <div className="toast-container">
                {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>)}
            </div>

            <ConfirmDialog isOpen={confirmState.isOpen} title={confirmState.title} message={confirmState.message}
                confirmLabel={confirmState.confirmLabel} onConfirm={confirmState.onConfirm} onCancel={closeConfirm} />

            {/* Add Group Dialog */}
            {showGroupDialog && (
                <div className="modal-overlay" onClick={() => setShowGroupDialog(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <header className="modal-header"><h2>New Category Group</h2>
                            <button className="close-btn" onClick={() => setShowGroupDialog(false)}>×</button></header>
                        <div className="modal-form">
                            {groupDialogError && <div className="form-error-banner">⚠️ {groupDialogError}</div>}
                            <div className="input-group"><label>Group Title</label>
                                <input type="text" value={groupTitle} onChange={e => setGroupTitle(e.target.value)} placeholder="e.g. Biryani, Pizza, Desserts" /></div>
                            <div className="input-group"><label>Cover Image URL <span style={{ fontWeight: 500, color: 'var(--text-body)', fontSize: '0.8rem' }}>(optional)</span></label>
                                <input type="text" value={groupImage} onChange={e => setGroupImage(e.target.value)} placeholder="https://images.unsplash.com/…" /></div>
                            {groupImage && <img src={groupImage} alt="preview" style={{ borderRadius: 12, width: '100%', height: 140, objectFit: 'cover', marginTop: '-0.5rem' }} onError={e => (e.currentTarget.style.display = 'none')} />}
                            <button className="action-btn-main" style={{ width: '100%', marginTop: '0.5rem' }} onClick={handleAddGroup} disabled={!groupTitle.trim()}>Create Group</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Item Dialog */}
            {showItemDialog && (
                <div className="modal-overlay" onClick={() => setShowItemDialog(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <header className="modal-header"><h2>Add Dish to {activeGroup?.title}</h2>
                            <button className="close-btn" onClick={() => setShowItemDialog(false)}>×</button></header>
                        <form className="modal-form" onSubmit={handleAddItem}>
                            {itemDialogError && <div className="form-error-banner">⚠️ {itemDialogError}</div>}
                            <div className="input-group"><label>Dish Name</label><input name="iname" type="text" placeholder="e.g. Chicken Biryani" required /></div>
                            <div className="input-group"><label>Description</label><input name="idesc" type="text" placeholder="Short flavour description…" /></div>
                            <div className="input-group"><label>Price (₹)</label><input name="iprice" type="number" min="1" placeholder="e.g. 280" required /></div>
                            <div className="input-group"><label>Image URL <span style={{ fontWeight: 500, color: 'var(--text-body)', fontSize: '0.8rem' }}>(optional — Unsplash link)</span></label>
                                <input name="iimage" type="text" placeholder="https://images.unsplash.com/…" /></div>
                            <button type="submit" className="action-btn-main" style={{ width: '100%', marginTop: '0.5rem' }}>Add to {activeGroup?.title}</button>
                        </form>
                    </div>
                </div>
            )}

            <aside className="app-sidebar">
                <div className="sidebar-brand"><div className="brand-icon">🍱</div><h1>SpinServe</h1></div>
                <nav className="sidebar-nav">
                    {[{ id: 'dashboard', icon: '📊', label: 'Insights' }, { id: 'kitchen', icon: '👨‍🍳', label: 'Kitchen' },
                    { id: 'server', icon: '💁', label: 'Server' }, { id: 'menu', icon: '🍽️', label: 'Food Menu' },
                    { id: 'spin', icon: '🎰', label: 'Settings' }
                    ].map(tab => (
                        <div key={tab.id} className={`nav-link ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => { setActiveTab(tab.id as TabType); setSearchQuery(''); setSelectedItem(null); }}>
                            <span className="nav-icon">{tab.icon}</span><span className="nav-label">{tab.label}</span>
                        </div>
                    ))}
                </nav>
                <div className="sidebar-footer"><button className="btn-logout-minimal" onClick={handleLogout}>Logout</button></div>
            </aside>

            <main className="app-main">
                <header className="app-header">
                    <div className="header-left"><span className="breadcrumb">OWNER PLATFORM</span><h1>{titles[activeTab]}</h1></div>
                    <div className="header-right">
                        <button className="theme-toggle" onClick={toggleTheme}>{isDarkMode ? '☀️ Light' : '🌙 Dark'}</button>
                        <div className="user-profile-sq">AD</div>
                    </div>
                </header>
                <div className="scroll-content">{renderContent()}</div>
            </main>

            {showOnboardModal && (
                <div className="modal-overlay" onClick={() => { setShowOnboardModal(false); setEditingStaff(null); setFormError(null); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <h2>{editingStaff ? 'Edit Member' : 'Onboard Staff'}</h2>
                            <button className="close-btn" onClick={() => { setShowOnboardModal(false); setEditingStaff(null); setFormError(null); }}>×</button>
                        </header>
                        <form className="modal-form" onSubmit={handleOnboardSubmit}>
                            {formError && <div className="form-error-banner">⚠️ {formError}</div>}
                            <div className="input-group"><label>Full Name</label><input name="name" type="text" defaultValue={editingStaff?.name} placeholder="e.g. Chef Ramu" required /></div>
                            <div className="input-group"><label>Mobile Number</label><input name="mobile" type="tel" defaultValue={editingStaff?.mobile} placeholder="e.g. 9876543210" maxLength={10} required /></div>
                            <button type="submit" className="action-btn-main" style={{ marginTop: '1rem', width: '100%' }} disabled={formLoading}>
                                {formLoading ? 'Saving…' : editingStaff ? 'Save Changes' : 'Register Member'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;
