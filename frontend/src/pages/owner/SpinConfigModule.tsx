import React, { useState, useEffect } from 'react';
import ConfirmDialog from '../../components/ConfirmDialog';
import './SpinConfigModule.css';

export interface SpinnerSlot {
    label: string;
    probability: number;
    reward: {
        offer_type: 'PERCENTAGE_DISCOUNT' | 'FLAT_DISCOUNT' | 'FREE_ITEM';
        value: number;
        description: string;
        item_name?: string;
        category_id?: string; // Track category for selection logic
    } | null;
}

interface SpinConfigModuleProps {
    config: any;
    menuItems: any[];
    menuGroups: any[];
    onSave: (initial: number, increment: number, slots: SpinnerSlot[]) => void;
    isSaving: boolean;
}

const SpinConfigModule: React.FC<SpinConfigModuleProps> = ({ config, menuItems, menuGroups, onSave, isSaving }) => {
    const [initialThreshold, setInitialThreshold] = useState(config?.game_unlock_initial || 200);
    const [incrementThreshold, setIncrementThreshold] = useState(config?.game_unlock_increment || 50);
    const [slots, setSlots] = useState<SpinnerSlot[]>([]);
    const [errors, setErrors] = useState<Record<string, boolean>>({});
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [alertMessage, setAlertMessage] = useState('');

    useEffect(() => {
        if (config) {
            setInitialThreshold(config.game_unlock_initial || 200);
            setIncrementThreshold(config.game_unlock_increment || 50);
            if (config.spinner_slots && config.spinner_slots.length > 0) {
                setSlots(config.spinner_slots);
            } else {
                setSlots([
                    { label: 'Try Again', probability: 20, reward: null },
                    { label: 'Try Again', probability: 20, reward: null },
                    { label: 'Try Again', probability: 20, reward: null },
                    { label: 'Try Again', probability: 40, reward: null }
                ]);
            }
        }
    }, [config]);

    const handleAddSlot = () => {
        setSlots([...slots, { label: 'New Reward', probability: 0, reward: null }]);
    };

    const handleRemoveSlot = (index: number) => {
        setSlots(slots.filter((_, i) => i !== index));
    };

    const updateSlot = (index: number, key: string, value: any) => {
        if (key === 'probability') {
            const valNum = Number(value);
            const otherTotal = slots.reduce((acc, slot, i) => i === index ? acc : acc + slot.probability, 0);
            if (otherTotal + valNum > 100) {
                setAlertMessage('Total probability cannot exceed 100%. Adjusting to maximum available capacity.');
                setIsAlertOpen(true);
                value = 100 - otherTotal;
            }
        }
        const newSlots = [...slots];
        (newSlots[index] as any)[key] = value;
        setSlots(newSlots);
    };

    const handleRewardTypeChange = (index: number, type: string) => {
        if (type === 'NONE') {
            updateSlot(index, 'reward', null);
            return;
        }
        updateSlot(index, 'reward', {
            offer_type: type,
            value: 0,
            description: '',
            item_name: '',
            category_id: ''
        });
    };

    const updateRewardField = (index: number, key: string, value: any) => {
        const newSlots = [...slots];
        if (newSlots[index].reward) {
            (newSlots[index].reward as any)[key] = value;
        }
        setSlots(newSlots);
    };

    const totalProb = slots.reduce((acc, slot) => acc + slot.probability, 0);

    const handleSave = () => {
        const newErrors: Record<string, boolean> = {};
        let firstErrorId = '';

        slots.forEach((slot, idx) => {
            if (!slot.label.trim()) {
                newErrors[`slot-${idx}-label`] = true;
                if (!firstErrorId) firstErrorId = `slot-${idx}`;
            }
            if (slot.probability <= 0) {
                newErrors[`slot-${idx}-prob`] = true;
                if (!firstErrorId) firstErrorId = `slot-${idx}`;
            }
            if (slot.reward) {
                if (slot.reward.offer_type === 'PERCENTAGE_DISCOUNT' && slot.reward.value <= 0) {
                    newErrors[`slot-${idx}-reward-value`] = true;
                    if (!firstErrorId) firstErrorId = `slot-${idx}`;
                }
                if (slot.reward.offer_type === 'FREE_ITEM' && !slot.reward.item_name) {
                    newErrors[`slot-${idx}-reward-item`] = true;
                    if (!firstErrorId) firstErrorId = `slot-${idx}`;
                }
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const el = document.getElementById(firstErrorId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (totalProb !== 100) {
            alert('Total probability must be exactly 100%');
            return;
        }

        setErrors({});
        onSave(initialThreshold, incrementThreshold, slots);
    };

    const colors = ['#f43f5e', '#ecfccb', '#8b5cf6', '#3b82f6', '#f59e0b', '#10b981', '#6366f1', '#14b8a6', '#f97316', '#a855f7'];

    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    let cumulative = 0;
    const slices = slots.map((s, i) => {
        const relativeProb = totalProb > 0 ? (s.probability / totalProb) * 100 : 0;
        const start = (cumulative / 100) * 360;
        const sweep = (relativeProb / 100) * 360;
        cumulative += relativeProb;
        return { start, sweep, color: colors[i % colors.length], ...s };
    });

    // SVG Path calculation for wedges
    const getWedgePath = (startAngle: number, sweepAngle: number, r: number = 100) => {
        const centerX = 115;
        const centerY = 115;

        // If the sweep is a full circle, SVG arcs fail because start == end. 
        // We draw two 180-degree arcs to form a perfect circle instead.
        if (sweepAngle >= 359.99) {
            return `M ${centerX} ${centerY - r} 
                    A ${r} ${r} 0 1 1 ${centerX} ${centerY + r} 
                    A ${r} ${r} 0 1 1 ${centerX} ${centerY - r} Z`;
        }

        const startRad = ((startAngle - 90) * Math.PI) / 180.0;
        const endRad = ((startAngle + sweepAngle - 90) * Math.PI) / 180.0;
        const x1 = centerX + r * Math.cos(startRad);
        const y1 = centerY + r * Math.sin(startRad);
        const x2 = centerX + r * Math.cos(endRad);
        const y2 = centerY + r * Math.sin(endRad);
        const largeArc = sweepAngle > 180 ? 1 : 0;
        return `M ${centerX} ${centerY} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    };

    const probPresets = [5, 10, 15, 25, 50, 75];

    return (
        <div className="spin-config-layout fade-in">
            <div className="sc-left-col">
                <div className="sc-builder-header">
                    <div className="sc-titles">
                        <h2>Spin Intelligence</h2>
                        <p>Configure how customers earn and win rewards</p>
                    </div>
                    <button className="action-btn-main" onClick={handleSave} disabled={isSaving}>
                        {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>

                {/* Fixed Thresholds Section */}
                <div className="sc-fixed-section">
                    <div className="sc-section compact">
                        <h3 className="section-label">1. Threshold Settings</h3>
                        <div className="sg-row">
                            <div className="sg-col">
                                <label>Initial Trigger (₹)</label>
                                <input type="number" value={initialThreshold} onChange={e => setInitialThreshold(Number(e.target.value))} />
                                <small>Order value for the 1st spin</small>
                            </div>
                            <div className="sg-col">
                                <label>Next Increment (₹)</label>
                                <input type="number" value={incrementThreshold} onChange={e => setIncrementThreshold(Number(e.target.value))} />
                                <small>Extra value added for each next spin</small>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="sc-scroll-content">
                    {/* section 2: Wedges */}
                    <div className="sc-section">
                        <div className="section-header-row">
                            <h3 className="section-label">2. Wheel Wedges</h3>
                        </div>

                        <div className="slot-list">
                            {slots.map((slot, index) => (
                                <div key={index} id={`slot-${index}`} className={`slot-item ${errors[`slot-${index}-label`] || errors[`slot-${index}-prob`] || errors[`slot-${index}-reward-value`] || errors[`slot-${index}-reward-item`] ? 'has-error' : ''}`}>
                                    <div className="slot-header">
                                        <div className="wedge-color-dot" style={{ background: colors[index % colors.length], color: colors[index % colors.length] }}></div>
                                        <div className="slot-title-area">
                                            <span className="slot-index">#{index + 1}</span>
                                            <input
                                                type="text"
                                                className={errors[`slot-${index}-label`] ? 'input-error' : ''}
                                                value={slot.label}
                                                onChange={e => {
                                                    updateSlot(index, 'label', e.target.value);
                                                    if (errors[`slot-${index}-label`]) setErrors(prev => ({ ...prev, [`slot-${index}-label`]: false }));
                                                }}
                                                placeholder="Label (e.g. 10% Off)"
                                            />
                                        </div>
                                        <button className="btn-remove-slot" onClick={() => handleRemoveSlot(index)}>✕</button>
                                    </div>
                                    <div className="slot-body">
                                        <div className="sg-row">
                                            <div className="sg-col">
                                                <label>Weight (%)</label>
                                                <div className="prob-preset-row">
                                                    <input
                                                        type="number"
                                                        className={errors[`slot-${index}-prob`] ? 'input-error' : ''}
                                                        value={slot.probability}
                                                        onChange={e => {
                                                            updateSlot(index, 'probability', Number(e.target.value));
                                                            if (errors[`slot-${index}-prob`]) setErrors(prev => ({ ...prev, [`slot-${index}-prob`]: false }));
                                                        }}
                                                    />
                                                    <div className="preset-badges">
                                                        {probPresets.map(p => (
                                                            <span key={p} className="preset-badge" onClick={() => {
                                                                updateSlot(index, 'probability', p);
                                                                if (errors[`slot-${index}-prob`]) setErrors(prev => ({ ...prev, [`slot-${index}-prob`]: false }));
                                                            }}>{p}%</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="sg-col">
                                                <label>Reward Type</label>
                                                <select
                                                    value={slot.reward ? slot.reward.offer_type : 'NONE'}
                                                    onChange={e => handleRewardTypeChange(index, e.target.value)}
                                                >
                                                    <option value="NONE">No Reward / Try Again</option>
                                                    <option value="PERCENTAGE_DISCOUNT">Percentage Discount</option>
                                                    <option value="FREE_ITEM">Free Menu Item</option>
                                                </select>
                                            </div>
                                        </div>

                                        {slot.reward && slot.reward.offer_type === 'PERCENTAGE_DISCOUNT' && (
                                            <div className="sg-row animate-slide-down">
                                                <div className="sg-col">
                                                    <label>Discount Value (%)</label>
                                                    <input
                                                        type="number"
                                                        className={errors[`slot-${index}-reward-value`] ? 'input-error' : ''}
                                                        value={slot.reward.value}
                                                        onChange={e => {
                                                            updateRewardField(index, 'value', Number(e.target.value));
                                                            if (errors[`slot-${index}-reward-value`]) setErrors(prev => ({ ...prev, [`slot-${index}-reward-value`]: false }));
                                                        }}
                                                    />
                                                </div>
                                                <div className="sg-col">
                                                    <label>Description</label>
                                                    <input
                                                        type="text"
                                                        value={slot.reward.description}
                                                        onChange={e => updateRewardField(index, 'description', e.target.value)}
                                                        placeholder="e.g. 10% Off"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {slot.reward && slot.reward.offer_type === 'FREE_ITEM' && (
                                            <div className="sg-row animate-slide-down">
                                                <div className="sg-col">
                                                    <label>1. Category</label>
                                                    <div className="category-select-box" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        {slot.reward.category_id && menuGroups.find(g => g.id === slot.reward?.category_id)?.image_url && (
                                                            <img
                                                                src={menuGroups.find(g => g.id === slot.reward!.category_id)!.image_url}
                                                                alt="cat"
                                                                style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }}
                                                            />
                                                        )}
                                                        <select
                                                            value={slot.reward.category_id || ''}
                                                            onChange={e => {
                                                                updateRewardField(index, 'category_id', e.target.value);
                                                                updateRewardField(index, 'item_name', '');
                                                            }}
                                                            style={{ flex: 1 }}
                                                        >
                                                            <option value="">-- Choose Category --</option>
                                                            {menuGroups.map(g => (
                                                                <option key={g.id} value={g.id}>{g.title}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="sg-col">
                                                    <label>2. Select Dish</label>
                                                    <div className="item-select-box" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        {slot.reward.item_name && menuItems.find(m => m.name === slot.reward?.item_name)?.image_url && (
                                                            <img
                                                                src={menuItems.find(m => m.name === slot.reward!.item_name)!.image_url}
                                                                alt="item"
                                                                style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }}
                                                            />
                                                        )}
                                                        <select
                                                            value={slot.reward.item_name || ''}
                                                            className={errors[`slot-${index}-reward-item`] ? 'input-error' : ''}
                                                            onChange={e => {
                                                                updateRewardField(index, 'item_name', e.target.value);
                                                                if (errors[`slot-${index}-reward-item`]) setErrors(prev => ({ ...prev, [`slot-${index}-reward-item`]: false }));
                                                                if (!slot.reward?.description) {
                                                                    updateRewardField(index, 'description', `Free ${e.target.value}`);
                                                                }
                                                            }}
                                                            disabled={!slot.reward.category_id}
                                                            style={{ flex: 1 }}
                                                        >
                                                            <option value="">-- Choose Item --</option>
                                                            {menuItems.filter(m => m.group_id === slot.reward?.category_id).map(m => (
                                                                <option key={m.id} value={m.name}>{m.name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                        {(() => {
                            const remainingProb = Math.max(0, 100 - totalProb);
                            const isFull = remainingProb === 0;
                            return (
                                <button
                                    className={`add-wedge-btn ${isFull ? 'btn-full-capacity' : ''}`}
                                    onClick={handleAddSlot}
                                    disabled={isFull}
                                >
                                    <span className="plus">{isFull ? '✓' : '+'}</span>
                                    {isFull ? 'Wheel is at 100% Capacity' : `Add New Wedge (${remainingProb}% Capacity Left)`}
                                </button>
                            );
                        })()}
                    </div>
                </div>
            </div>

            <div className="sc-right-col">
                <div className="spin-preview-container">
                    <div className="preview-header">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: '0.5rem' }}>
                            <h3>Live Preview</h3>
                            <div className={`prob-indicator ${totalProb === 100 ? 'perfect' : 'invalid'}`}>
                                {totalProb}% / 100%
                            </div>
                        </div>
                        <p>Hover on segments to audit details</p>
                    </div>

                    <div className="interactive-wheel-box">
                        <svg
                            viewBox="0 0 230 230"
                            className="svg-spin-wheel"
                            onMouseMove={(e) => {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - rect.left - rect.width / 2;
                                const y = e.clientY - rect.top - rect.height / 2;
                                const dist = Math.sqrt(x * x + y * y);

                                if (dist < 40 || dist > 110) {
                                    if (hoveredIndex !== null) setHoveredIndex(null);
                                    return;
                                }

                                let angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
                                if (angle < 0) angle += 360;

                                const foundIdx = slices.findIndex(s => {
                                    const end = s.start + s.sweep;
                                    if (end > 360) {
                                        return angle >= s.start || angle < (end % 360);
                                    }
                                    return angle >= s.start && angle < end;
                                });

                                if (foundIdx !== hoveredIndex) setHoveredIndex(foundIdx);
                            }}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <defs>
                                {colors.map((c, i) => (
                                    <linearGradient key={`grad-${i}`} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor={c} stopOpacity="1" />
                                        <stop offset="100%" stopColor={c} stopOpacity="0.7" />
                                    </linearGradient>
                                ))}
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                                    <feMerge>
                                        <feMergeNode in="coloredBlur" />
                                        <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                </filter>
                            </defs>

                            <circle cx="115" cy="115" r="108" fill="none" stroke="#1f2937" strokeWidth="8" />
                            <circle cx="115" cy="115" r="104" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                            <g className="wheel-group" style={{ pointerEvents: 'none' }}>
                                {slices.map((slice, idx) => (
                                    <path
                                        key={idx}
                                        d={getWedgePath(slice.start, slice.sweep)}
                                        fill={`url(#grad-${idx % colors.length})`}
                                        className={`wheel-wedge ${hoveredIndex === idx ? 'hovered' : ''}`}
                                    />
                                ))}
                            </g>

                            <g style={{ pointerEvents: 'none' }}>
                                <circle cx="115" cy="115" r="18" fill="#1f2937" stroke="#facc15" strokeWidth="2" filter="url(#glow)" />
                                <circle cx="115" cy="115" r="4" fill="#facc15" />
                                <path d="M 115 15 L 105 5 L 125 5 Z" fill="#ef4444" filter="url(#glow)" />
                            </g>
                        </svg>

                        <div className="center-hub-text" style={{ pointerEvents: 'none' }}>
                            <span>SPIN</span>
                        </div>
                    </div>

                    <div className="selection-card-area">
                        {hoveredIndex !== null ? (
                            <div className="selection-detail-card animate-slide-up" style={{ '--accent-color': colors[hoveredIndex % colors.length] } as any}>
                                <div className="sd-overlay-glow"></div>
                                <div className="sd-content">
                                    <div className="sd-header">
                                        <div className="sd-title-group">
                                            <div className="sd-indicator"></div>
                                            <div className="sd-title-main">
                                                <h4>{slots[hoveredIndex].label || 'Unnamed Wedge'}</h4>
                                                <span className="sd-subtitle">{slots[hoveredIndex].probability}% WIN PROBABILITY</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="sd-reward-display">
                                        <span className="sd-reward-tag">PRIZE DETAILS</span>
                                        {slots[hoveredIndex].reward ? (
                                            <>
                                                <div className="gv-text">
                                                    {slots[hoveredIndex].reward?.offer_type === 'PERCENTAGE_DISCOUNT' ? (
                                                        <>{slots[hoveredIndex].reward?.value}<small>% OFF</small></>
                                                    ) : (
                                                        <>{slots[hoveredIndex].reward?.item_name || 'FREE'}</>
                                                    )}
                                                </div>
                                                {slots[hoveredIndex].reward?.description && (
                                                    <div className="sd-footer-desc">
                                                        <span className="quote">“</span>
                                                        <p>{slots[hoveredIndex].reward?.description}</p>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <div className="sd-null-state">
                                                <div className="sd-null-icon">⭕</div>
                                                <p>Better luck next time!</p>
                                                <span>This wedge offers no reward.</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="premium-placeholder">
                                <div className="radar-container">
                                    <div className="radar-circle"></div>
                                    <div className="radar-circle delay-1"></div>
                                    <div className="radar-circle delay-2"></div>
                                    <div className="radar-icon">📍</div>
                                </div>
                                <h3>Intelligence Preview</h3>
                                <p>Interactive mapping enabled. Hover any segment for detail.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isAlertOpen}
                title="Capacity Limit Reached"
                message={alertMessage}
                danger={false}
                confirmLabel="Understood"
                hideCancel={true}
                onConfirm={() => setIsAlertOpen(false)}
                onCancel={() => setIsAlertOpen(false)}
            />
        </div>
    );
};

export default SpinConfigModule;
