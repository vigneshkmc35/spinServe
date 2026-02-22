import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './OwnerDashboard.css';

type TabType = 'dashboard' | 'kitchen' | 'server' | 'spin' | 'menu';

interface StaffMember {
    id: string;
    name: string;
    mobile: string;
    status: 'online' | 'offline';
}

interface MenuItem {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    image?: string;
}

import { confirmAction, validateMobile, validateRequired } from '../../utils/ui';

const OwnerDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<TabType>('dashboard');
    const [activeCategory, setActiveCategory] = useState<string>('Breads');
    const [showOnboardModal, setShowOnboardModal] = useState(false);
    const [showFoodModal, setShowFoodModal] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Toggle system theme support
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') setIsDarkMode(true);
    }, []);

    const toggleTheme = () => {
        const newTheme = !isDarkMode;
        setIsDarkMode(newTheme);
        localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    };

    const [kitchenStaff, setKitchenStaff] = useState<StaffMember[]>(
        Array.from({ length: 20 }, (_, i) => ({
            id: `k${i + 1}`,
            name: ['Chef Ramu', 'Chef Mani', 'Chef Rahul', 'Chef Priya', 'Chef Arjun', 'Chef Suman', 'Chef Vikram', 'Chef Ananya', 'Chef Kabir', 'Chef Zara', 'Chef Ishaan', 'Chef Diya', 'Chef Advait', 'Chef Kavya', 'Chef Vivaan', 'Chef Meera', 'Chef Reyansh', 'Chef Saisha', 'Chef Aarav', 'Chef Myra'][i],
            mobile: `98765432${10 + i}`,
            status: i % 5 === 0 ? 'offline' : 'online'
        }))
    );

    const [serverStaff, setServerStaff] = useState<StaffMember[]>(
        Array.from({ length: 20 }, (_, i) => ({
            id: `s${i + 1}`,
            name: ['Kumar', 'Sunil', 'Anita', 'Rohan', 'Sneha', 'Deepak', 'Pooja', 'Vikash', 'Neha', 'Amit', 'Suresh', 'Kiran', 'Preeti', 'Rajesh', 'Sonal', 'Varun', 'Tanya', 'Akash', 'Shweta', 'Nitin'][i],
            mobile: `99887766${10 + i}`,
            status: i % 4 === 0 ? 'offline' : 'online'
        }))
    );

    const [categories] = useState(['Breads', 'Signature Rice', 'Gourmet Sides', 'Desserts', 'Beverages']);
    const [menuItems, setMenuItems] = useState<MenuItem[]>([
        // Breads
        { id: 'm1', name: 'Butter Naan', description: 'Soft and fluffy Indian bread with butter', price: 40, category: 'Breads', image: 'https://images.unsplash.com/photo-1533777857417-cbe94a9d0ee9?auto=format&fit=crop&q=80&w=300' },
        { id: 'm2', name: 'Garlic Naan', description: 'Oven baked bread with chopped garlic', price: 50, category: 'Breads', image: 'https://images.unsplash.com/photo-1601050633647-81a35d377a8a?auto=format&fit=crop&q=80&w=300' },
        { id: 'm3', name: 'Roti', description: 'Whole wheat flatbread', price: 20, category: 'Breads', image: 'https://images.unsplash.com/photo-1589187151003-00e9603005b0?auto=format&fit=crop&q=80&w=300' },
        { id: 'm4', name: 'Laccha Paratha', description: 'Multi-layered flaky bread', price: 60, category: 'Breads', image: 'https://images.unsplash.com/photo-1626082869491-03486c05d045?auto=format&fit=crop&q=80&w=300' },
        // Signature Rice
        { id: 'm5', name: 'Jeera Rice', description: 'Fragrant basmati rice with cumin seeds', price: 120, category: 'Signature Rice', image: 'https://images.unsplash.com/photo-1512058560366-cd242d4536ee?auto=format&fit=crop&q=80&w=300' },
        { id: 'm6', name: 'Veg Biryani', description: 'Aromtaic rice dish with mixed vegetables', price: 180, category: 'Signature Rice', image: 'https://images.unsplash.com/photo-1563379091339-03b21bc4a6f8?auto=format&fit=crop&q=80&w=300' },
        { id: 'm7', name: 'Paneer Pulao', description: 'Rice cooked with paneer and mild spices', price: 200, category: 'Signature Rice', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&q=80&w=300' },
        { id: 'm8', name: 'Kashmiri Pulao', description: 'Sweet saffron rice with dry fruits', price: 220, category: 'Signature Rice', image: 'https://images.unsplash.com/photo-1605333396915-47ed6b68a00e?auto=format&fit=crop&q=80&w=300' },
        // Gourmet Sides
        { id: 'm9', name: 'Paneer Tikka', description: 'Grilled paneer cubes marinated in spices', price: 250, category: 'Gourmet Sides', image: 'https://images.unsplash.com/photo-1567184109191-3776122f4109?auto=format&fit=crop&q=80&w=300' },
        { id: 'm10', name: 'Dal Makhani', description: 'Slow cooked black lentils with cream', price: 280, category: 'Gourmet Sides', image: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&q=80&w=300' },
        { id: 'm11', name: 'Butter Chicken', description: 'Tender chicken in creamy tomato sauce', price: 350, category: 'Gourmet Sides', image: 'https://images.unsplash.com/photo-1603894584100-348981ef40ae?auto=format&fit=crop&q=80&w=300' },
        { id: 'm12', name: 'Mix Veg', description: 'Assorted seasonal vegetables in gravy', price: 180, category: 'Gourmet Sides', image: 'https://images.unsplash.com/photo-1626074353765-517a681e40be?auto=format&fit=crop&q=80&w=300' },
        // Desserts
        { id: 'm13', name: 'Gulab Jamun', description: 'Deep fried milk solids in sugar syrup', price: 80, category: 'Desserts', image: 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?auto=format&fit=crop&q=80&w=300' },
        { id: 'm14', name: 'Rasmalai', description: 'Soft paneer balls in sweetened milk', price: 120, category: 'Desserts', image: 'https://images.unsplash.com/photo-1610192244261-3f33de3f72e5?auto=format&fit=crop&q=80&w=300' },
        { id: 'm15', name: 'Kulfi', description: 'Traditional Indian ice cream', price: 100, category: 'Desserts', image: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&q=80&w=300' },
        { id: 'm16', name: 'Gajar Halwa', description: 'Sweet carrot pudding with nuts', price: 150, category: 'Desserts', image: 'https://images.unsplash.com/photo-1613144321350-a9cb579e0094?auto=format&fit=crop&q=80&w=300' },
        // Beverages
        { id: 'm17', name: 'Mango Lassi', description: 'Sweet yogurt drink with mango pulp', price: 90, category: 'Beverages', image: 'https://images.unsplash.com/photo-1571006682855-3fc2741715a7?auto=format&fit=crop&q=80&w=300' },
        { id: 'm18', name: 'Masala Chai', description: 'Spiced Indian tea with milk', price: 40, category: 'Beverages', image: 'https://images.unsplash.com/photo-1561336313-0bd5e0b27ec8?auto=format&fit=crop&q=80&w=300' },
        { id: 'm19', name: 'Fresh Lime Soda', description: 'Bubbly lime drink with spices', price: 70, category: 'Beverages', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=300' },
        { id: 'm20', name: 'Cold Coffee', description: 'Iced coffee with chocolate syrup', price: 130, category: 'Beverages', image: 'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&q=80&w=300' }
    ]);

    const navigate = useNavigate();

    const titles: Record<TabType, string> = {
        dashboard: 'Insights',
        kitchen: 'Kitchen Operations',
        server: 'Service Excellence',
        spin: 'Spin Intelligence',
        menu: 'Culinary Catalog'
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleDeleteStaff = (id: string, type: 'kitchen' | 'server') => {
        if (!confirmAction(`Are you sure you want to remove this ${type} member?`)) return;
        if (type === 'kitchen') setKitchenStaff(kitchenStaff.filter(s => s.id !== id));
        else setServerStaff(serverStaff.filter(s => s.id !== id));
    };

    const handleOnboardSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormError(null);
        const formData = new FormData(e.currentTarget);
        const name = (formData.get('name') as string).trim();
        const mobile = (formData.get('mobile') as string).trim();

        // Standard Utility Validation
        if (!validateRequired(name)) { setFormError('Identity name is required'); return; }
        if (!validateMobile(mobile)) { setFormError('Please enter a valid 10-digit mobile number'); return; }

        if (editingStaff) {
            const updated = { ...editingStaff, name, mobile };
            if (activeTab === 'kitchen') setKitchenStaff(kitchenStaff.map(s => s.id === updated.id ? updated : s));
            else setServerStaff(serverStaff.map(s => s.id === updated.id ? updated : s));
        } else {
            const newStaff: StaffMember = { id: Math.random().toString(36).substr(2, 9), name, mobile, status: 'online' };
            if (activeTab === 'kitchen') setKitchenStaff([...kitchenStaff, newStaff]);
            else setServerStaff([...serverStaff, newStaff]);
        }
        setShowOnboardModal(false);
        setEditingStaff(null);
    };

    const renderOnboardModal = () => (
        <div className="modal-overlay" onClick={() => { setShowOnboardModal(false); setEditingStaff(null); }}>
            <div className={`modal-content ${isDarkMode ? 'dark-card' : ''}`} onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <h2>{editingStaff ? 'Edit Agent' : 'New Onboarding'}</h2>
                    <button className="close-btn" onClick={() => { setShowOnboardModal(false); setEditingStaff(null); }}>×</button>
                </header>
                <form className="modal-form" onSubmit={handleOnboardSubmit}>
                    {formError && <div className="form-error-banner">{formError}</div>}
                    <div className="input-group">
                        <label>Identity Name</label>
                        <input name="name" type="text" defaultValue={editingStaff?.name} placeholder="e.g. Master Chef" required />
                    </div>
                    <div className="input-group">
                        <label>Mobile Bridge</label>
                        <input name="mobile" type="tel" defaultValue={editingStaff?.mobile} placeholder="e.g. 9876543210" required />
                    </div>
                    <button type="submit" className="action-btn-main">
                        {editingStaff ? 'Update Details' : 'Confirm Registration'}
                    </button>
                </form>
            </div>
        </div>
    );

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard':
                return (
                    <div className="module-view fade-in">
                        <div className="stat-grid">
                            <div className="stat-card">
                                <span className="label">REVENUE</span>
                                <span className="value">₹42.5k</span>
                                <span className="trend positive">↑ 12%</span>
                            </div>
                            <div className="stat-card">
                                <span className="label">ORDERS</span>
                                <span className="value">14</span>
                                <span className="trend">Real-time</span>
                            </div>
                            <div className="stat-card">
                                <span className="label">SPINS</span>
                                <span className="value">86</span>
                                <span className="trend positive">↑ 5 Wins</span>
                            </div>
                        </div>
                    </div>
                );
            case 'kitchen':
            case 'server':
                const staff = activeTab === 'kitchen' ? kitchenStaff : serverStaff;
                return (
                    <div className="module-view fade-in">
                        <div className="view-header-row">
                            <div className="header-labels">
                                <h2>{staff.length} Active {activeTab} Members</h2>
                                <p>Managing workforce identity and connectivity</p>
                            </div>
                            <button className="action-btn-main btn-sq" onClick={() => setShowOnboardModal(true)}>
                                + Onboard {activeTab === 'kitchen' ? 'Chef' : 'Server'}
                            </button>
                        </div>

                        <div className="staff-grid-structured">
                            {staff.map(member => (
                                <div key={member.id} className="staff-card-structured">
                                    <div className="staff-main-info">
                                        <div className="avatar">{member.name.charAt(0)}</div>
                                        <div className="details">
                                            <h3>{member.name}</h3>
                                            <p>{member.mobile}</p>
                                        </div>
                                    </div>
                                    <div className="staff-footer-actions">
                                        <div className={`status-tag-simple ${member.status}`}>{member.status}</div>
                                        <div className="footer-btns">
                                            <button className="minimal-action" onClick={() => { setEditingStaff(member); setShowOnboardModal(true); }}>Edit</button>
                                            <button className="minimal-action danger" onClick={() => handleDeleteStaff(member.id, activeTab as 'kitchen' | 'server')}>Delete</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            case 'spin':
                return (
                    <div className="module-view fade-in">
                        <div className="card-container-centered">
                            <div className="config-card-structured">
                                <h3>Logic Configuration</h3>
                                <div className="config-row">
                                    <div className="config-item">
                                        <label>Unlock Threshold (₹)</label>
                                        <input type="number" defaultValue={200} />
                                    </div>
                                    <div className="config-item">
                                        <label>Daily Win Limit</label>
                                        <input type="number" defaultValue={2} />
                                    </div>
                                </div>
                                <button className="action-btn-main full">Update Game Rules</button>
                            </div>
                        </div>
                    </div>
                );
            case 'menu':
                return (
                    <div className="module-view fade-in">
                        <div className="tab-strip-structured">
                            {categories.map(cat => (
                                <button key={cat} className={`tab-btn ${activeCategory === cat ? 'active' : ''}`} onClick={() => setActiveCategory(cat)}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <div className="view-header-row tight">
                            <h2>{activeCategory}</h2>
                            <button className="action-btn-main btn-sq ghost" onClick={() => setShowFoodModal(true)}>+ New Item</button>
                        </div>
                        <div className="food-grid-structured">
                            {menuItems.filter(item => item.category === activeCategory).map(item => (
                                <div key={item.id} className="food-item-structured">
                                    <img src={item.image} alt={item.name} />
                                    <div className="item-body">
                                        <div className="top">
                                            <h3>{item.name}</h3>
                                            <span className="price">₹{item.price}</span>
                                        </div>
                                        <p>{item.description}</p>
                                        <div className="actions">
                                            <button className="action-icon">✏️</button>
                                            <button className="action-icon danger" onClick={() => {
                                                if (confirmAction(`Are you sure you want to remove ${item.name}?`)) {
                                                    setMenuItems(menuItems.filter(m => m.id !== item.id));
                                                }
                                            }}>🗑️</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className={`app-layout ${isDarkMode ? 'dark-mode' : 'light-mode'}`}>
            <aside className="app-sidebar">
                <div className="sidebar-brand">
                    <div className="brand-icon">🍱</div>
                    <h1>SpinServe </h1>
                </div>
                <nav className="sidebar-nav">
                    {[
                        { id: 'dashboard', icon: '◻️', label: 'Insights' },
                        { id: 'kitchen', icon: '👨‍🍳', label: 'Kitchen' },
                        { id: 'server', icon: '💁', label: 'Server' },
                        { id: 'menu', icon: '🍲', label: 'Food Menu' },
                        { id: 'spin', icon: '🎰', label: 'Settings' }
                    ].map(tab => (
                        <div key={tab.id} className={`nav-link ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id as TabType)}>
                            <span className="nav-icon">{tab.icon}</span>
                            <span className="nav-label">{tab.label}</span>
                        </div>
                    ))}
                </nav>
                <div className="sidebar-footer">
                    <button className="btn-logout-minimal" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <main className="app-main">
                <header className="app-header">
                    <div className="header-left">
                        <span className="breadcrumb">OWNER PLATFORM</span>
                        <h1>{titles[activeTab]}</h1>
                    </div>
                    <div className="header-right">
                        <button className="theme-toggle" onClick={toggleTheme}>
                            {isDarkMode ? '☀️ Light' : '🌙 Dark'}
                        </button>
                        <div className="user-profile-sq">AD</div>
                    </div>
                </header>
                <div className="scroll-content">
                    {renderContent()}
                </div>
            </main>

            {showOnboardModal && renderOnboardModal()}
            {showFoodModal && (
                <div className="modal-overlay" onClick={() => setShowFoodModal(false)}>
                    <div className={`modal-content ${isDarkMode ? 'dark-card' : ''}`} onClick={e => e.stopPropagation()}>
                        <header className="modal-header">
                            <h2>Add New Dish</h2>
                            <button className="close-btn" onClick={() => setShowFoodModal(false)}>×</button>
                        </header>
                        <form className="modal-form" onSubmit={(e) => { e.preventDefault(); setShowFoodModal(false); }}>
                            <div className="input-group">
                                <label>Dish Name</label>
                                <input type="text" placeholder="e.g. Paneer Butter Masala" required />
                            </div>
                            <div className="input-group">
                                <label>Price (₹)</label>
                                <input type="number" placeholder="e.g. 250" required />
                            </div>
                            <button type="submit" className="action-btn-main">Add to Catalog</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OwnerDashboard;
