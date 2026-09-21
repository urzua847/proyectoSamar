import React, { useState } from 'react';
import Badge from '../Badge';
import ActionButton from '../ActionButton';

const ProductItem = ({ prod, expandedProd, toggleProd, handleDeleteProduct, handleRemoveCalibre, handleAddCalibre }) => {
    const isProdExpanded = expandedProd.includes(prod.id);
    const [newCalibre, setNewCalibre] = useState('');

    const handleAdd = () => {
        if (newCalibre.trim()) {
            handleAddCalibre(prod, newCalibre.trim());
            setNewCalibre('');
        }
    };

    return (
        <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: 'translateY(0)'
        }}
        onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.08)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = '#cbd5e1';
        }}
        onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = '#e2e8f0';
        }}>
            <div
                style={{
                    padding: '16px 20px',
                    background: isProdExpanded ? '#f8fafc' : '#ffffff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none',
                    transition: 'background 0.2s'
                }}
                onClick={() => toggleProd(prod.id)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <strong style={{ color: '#0f172a', fontSize: '1rem', fontWeight: 700 }}>{prod.nombre}</strong>
                    {prod.origen && prod.tipo === 'elaborado' && (
                        <Badge status="info" variant="subtle">Origen: {prod.origen}</Badge>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>

                    <ActionButton
                        variant="delete"
                        title="Eliminar Producto"
                        onClick={() => handleDeleteProduct(prod)}
                    />
                    <span style={{ 
                        color: '#64748b', 
                        fontSize: '0.8rem', 
                        padding: '4px', 
                        cursor: 'pointer',
                        transform: isProdExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease',
                        display: 'inline-block'
                    }}>
                        ▼
                    </span>
                </div>
            </div>



            {isProdExpanded && (
                <div style={{ 
                    padding: '20px', 
                    borderTop: '1px solid #e2e8f0', 
                    backgroundColor: '#ffffff',
                    animation: 'fadeInDown 0.3s ease-out'
                }}>
                    <style>{`
                        @keyframes fadeInDown {
                            from { opacity: 0; transform: translateY(-10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>
                    <h4 style={{ 
                        margin: '0 0 16px 0', 
                        fontSize: '0.8rem', 
                        color: '#64748b', 
                        textTransform: 'uppercase', 
                        letterSpacing: '0.08em',
                        fontWeight: 700
                    }}>
                        Calibres / Variantes Disponibles
                    </h4>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ textAlign: 'left', color: '#475569' }}>
                                <th style={{ padding: '0 12px 12px 12px', borderBottom: '2px solid #e2e8f0', fontWeight: 600 }}>Calibre / Nombre</th>
                                <th style={{ padding: '0 12px 12px 12px', borderBottom: '2px solid #e2e8f0', width: '90px', textAlign: 'center', fontWeight: 600 }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(prod.calibres || []).map((cal, idx) => (
                                <tr key={idx} style={{ 
                                    borderBottom: '1px solid #f1f5f9',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <td style={{ padding: '12px', color: '#334155', fontWeight: 500 }}>{cal}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCalibre(prod, cal)}
                                            style={{
                                                color: '#ef4444',
                                                background: 'rgba(239, 68, 68, 0.1)',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.75rem',
                                                fontWeight: 700,
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {(!prod.calibres || prod.calibres.length === 0) && (
                                <tr>
                                    <td colSpan="2" style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.9rem', fontStyle: 'italic' }}>
                                        Sin calibres configurados
                                    </td>
                                </tr>
                            )}

                            <tr style={{ background: 'transparent' }}>
                                <td style={{ padding: '16px 12px 0 12px' }}>
                                    <input
                                        placeholder="Agregar nuevo calibre (ej: 100g, Standard)..."
                                        value={newCalibre}
                                        onChange={e => setNewCalibre(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '6px',
                                            fontSize: '0.9rem',
                                            outline: 'none',
                                            transition: 'border-color 0.2s',
                                            backgroundColor: '#f8fafc'
                                        }}
                                        onFocus={e => {
                                            e.currentTarget.style.borderColor = '#3b82f6';
                                            e.currentTarget.style.backgroundColor = '#ffffff';
                                        }}
                                        onBlur={e => {
                                            e.currentTarget.style.borderColor = '#cbd5e1';
                                            e.currentTarget.style.backgroundColor = '#f8fafc';
                                        }}
                                    />
                                </td>
                                <td style={{ padding: '16px 12px 0 12px', textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={handleAdd}
                                        style={{
                                            background: 'linear-gradient(135deg, #0284c7, #2563eb)',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '8px 16px',
                                            borderRadius: '6px',
                                            cursor: 'pointer',
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                                            transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.transform = 'translateY(-1px)';
                                            e.currentTarget.style.boxShadow = '0 4px 6px rgba(37, 99, 235, 0.3)';
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 4px rgba(37, 99, 235, 0.2)';
                                        }}
                                    >
                                        Agregar
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProductItem;
