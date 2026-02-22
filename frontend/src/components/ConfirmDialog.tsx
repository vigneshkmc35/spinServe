import React, { useEffect } from 'react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    hideCancel?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    danger = true,
    hideCancel = false,
    onConfirm,
    onCancel,
}) => {
    // Close on Escape key
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onCancel]);

    if (!isOpen) return null;

    return (
        <div className="cd-overlay" onClick={onCancel}>
            <div className="cd-box" onClick={e => e.stopPropagation()}>
                <div className={`cd-icon ${danger ? 'danger' : 'info'}`}>
                    {danger ? '🗑️' : 'ℹ️'}
                </div>
                <h3 className="cd-title">{title}</h3>
                <p className="cd-message">{message}</p>
                <div className="cd-actions">
                    {!hideCancel && (
                        <button className="cd-btn cd-cancel" onClick={onCancel}>{cancelLabel}</button>
                    )}
                    <button className={`cd-btn ${danger ? 'cd-danger' : 'cd-confirm'}`} onClick={onConfirm}>{confirmLabel}</button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
