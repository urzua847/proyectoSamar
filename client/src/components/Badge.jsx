import React from 'react';
import './Badge.css';

/**
 * Standardized Badge component for status & categorical indicators.
 * 
 * @param {string} status - 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'create' | 'update' | 'delete' | 'pending' | 'completed' | 'active' | 'inactive'
 * @param {string} variant - 'solid' (default) | 'outline' | 'subtle'
 * @param {React.ReactNode} children - Content inside the badge
 * @param {string} className - Optional extra CSS class
 */
const Badge = ({ status = 'neutral', variant = 'solid', children, className = '', style }) => {
    // Normalizar estados comunes
    const normalizedStatus = String(status).toLowerCase();
    
    let typeClass = 'badge--neutral';

    if (['success', 'activo', 'activa', 'completado', 'completada', 'create', 'crear', 'aprobado'].includes(normalizedStatus)) {
        typeClass = 'badge--success';
    } else if (['warning', 'pendiente', 'en_proceso', 'proceso', 'update', 'actualizar', 'alerta'].includes(normalizedStatus)) {
        typeClass = 'badge--warning';
    } else if (['danger', 'error', 'inactivo', 'inactiva', 'delete', 'eliminar', 'cancelado', 'rechazado'].includes(normalizedStatus)) {
        typeClass = 'badge--danger';
    } else if (['info', 'enviado', 'despachado', 'recepcionado', 'primary'].includes(normalizedStatus)) {
        typeClass = 'badge--info';
    }

    const variantClass = `badge--${variant}`;

    return (
        <span className={`samar-badge ${typeClass} ${variantClass} ${className}`} style={style}>
            {children || status}
        </span>
    );
};

export default Badge;
