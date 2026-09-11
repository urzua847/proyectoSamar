import React from 'react';
import './ActionButton.css';

/**
 * Standardized Table Row Action Button Component.
 * 
 * @param {'edit' | 'delete' | 'view' | 'transfer' | 'add' | 'custom'} variant
 * @param {string} title - Accessible tooltip text
 * @param {function} onClick - Click handler
 * @param {React.ReactNode} icon - Custom icon if variant is 'custom'
 * @param {boolean} disabled - Disabled state
 */
const ActionButton = ({ variant = 'custom', title, onClick, icon, disabled = false, className = '', style }) => {
    let iconContent = icon;
    let variantClass = `action-btn--${variant}`;

    if (!icon) {
        switch (variant) {
            case 'edit':
                iconContent = (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                );
                break;
            case 'delete':
                iconContent = (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                );
                break;
            case 'view':
                iconContent = (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                );
                break;
            case 'transfer':
                iconContent = (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="17 1 21 5 17 9"></polyline>
                        <path d="M3 11V9a4 4 0 0 1 4-4h14"></path>
                        <polyline points="7 23 3 19 7 15"></polyline>
                        <path d="M21 13v2a4 4 0 0 1-4 4H3"></path>
                    </svg>
                );
                break;
            case 'add':
                iconContent = (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                );
                break;
            default:
                iconContent = '•';
        }
    }

    return (
        <button
            type="button"
            className={`samar-action-btn ${variantClass} ${className}`}
            onClick={onClick}
            title={title}
            aria-label={title}
            disabled={disabled}
            style={style}
        >
            {iconContent}
        </button>
    );
};

export default ActionButton;
