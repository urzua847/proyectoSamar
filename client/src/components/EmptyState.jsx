import React from 'react';
import './EmptyState.css';

/**
 * Standardized Empty State Component for tables and lists.
 * 
 * @param {string} title - Main headline for the empty state
 * @param {string} description - Explanation message
 * @param {string} actionLabel - Optional CTA button text
 * @param {function} onAction - Optional CTA click handler
 * @param {React.ReactNode} icon - Optional custom icon
 */
const EmptyState = ({
    title = 'No hay datos disponibles',
    description = 'No se encontraron registros en este momento.',
    actionLabel,
    onAction,
    icon
}) => {
    const defaultIcon = (
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            <line x1="9" y1="13" x2="15" y2="13"></line>
        </svg>
    );

    return (
        <div className="samar-empty-state">
            <div className="empty-state__icon-wrapper">
                {icon || defaultIcon}
            </div>
            <h3 className="empty-state__title">{title}</h3>
            <p className="empty-state__description">{description}</p>
            {actionLabel && onAction && (
                <button type="button" className="empty-state__action-btn" onClick={onAction}>
                    <span style={{ marginRight: '6px', fontSize: '1.1rem', lineHeight: 1 }}>+</span>
                    {actionLabel}
                </button>
            )}
        </div>
    );
};

export default EmptyState;
