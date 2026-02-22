import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './ServerView.css';

const ServerView: React.FC = () => {
    const [sessions, setSessions] = useState<any[]>([]);
    const [menu, setMenu] = useState<any[]>([]);
    const [selectedItem, setSelectedItem] = useState('');
    const [quantity, setQuantity] = useState(1);

    const refreshData = async () => {
        const { data: sess } = await api.get('/sessions');
        const { data: menuItems } = await api.get('/restaurant/menu');
        setSessions(sess);
        setMenu(menuItems);
    };

    useEffect(() => {
        refreshData();
    }, []);

    const addItem = async (sessionId: string) => {
        if (!selectedItem) return;
        await api.post(`/sessions/${sessionId}/add-items`, {
            items: [{ menu_item_id: selectedItem, quantity }]
        });
        refreshData();
    };

    return (
        <div className="server-container animate-in">
            <header className="page-header">
                <h1>Server <span className="text-gradient">Station</span></h1>
                <p>Track active sessions and update table orders.</p>
            </header>

            <div className="sessions-list">
                {sessions.map((session) => (
                    <div key={session._id} className="session-card glass">
                        <div className="card-top">
                            <div className="table-badge">Table {session.table_id}</div>
                            <div className={`status-pill ${session.game_status}`}>
                                {session.game_status}
                            </div>
                        </div>

                        <div className="order-summary">
                            <p className="total">₹ {session.total_amount}</p>
                            <ul>
                                {session.items.map((item: any, idx: number) => (
                                    <li key={idx}>{item.quantity}x {item.name}</li>
                                ))}
                            </ul>
                        </div>

                        <div className="add-controls">
                            <select onChange={(e) => setSelectedItem(e.target.value)} value={selectedItem}>
                                <option value="">Add item...</option>
                                {menu.map(item => (
                                    <option key={item._id} value={item._id}>{item.name} (₹{item.price})</option>
                                ))}
                            </select>
                            <input type="number" min="1" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                            <button className="btn-primary" onClick={() => addItem(session._id)}>Add</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServerView;
