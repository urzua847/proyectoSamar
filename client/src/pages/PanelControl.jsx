
import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/users.css';

const PanelControl = () => {
    const navigate = useNavigate();

    const options = [
        {
            title: "Gestión de Usuarios",
            path: "/users",
            desc: "Crear, editar y eliminar usuarios del sistema.",
            icon: (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                </svg>
            )
        },
        {
            title: "Gestión de Productos",
            path: "/mantenedor-productos",
            desc: "Administrar definiciones de productos y calibres.",
            icon: (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                    <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                    <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
            )
        },
        {
            title: "Gestión de Entidades",
            path: "/entidades",
            desc: "Gestión unificada de Clientes y Proveedores.",
            icon: (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
                </svg>
            )
        },
    ];

    return (
        <div className="main-container">
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ color: '#003366', textAlign: 'center', marginBottom: '40px' }}>Panel de Control</h1>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', maxWidth: '1000px', margin: '0 auto' }}>
                    {options.map((opt, idx) => (
                        <div
                            key={idx}
                            onClick={() => navigate(opt.path)}
                            style={{
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                padding: '30px',
                                cursor: 'pointer',
                                transition: 'transform 0.2s, box-shadow 0.2s',
                                border: '1px solid #eee',
                                textAlign: 'center',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '15px'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-5px)';
                                e.currentTarget.style.boxShadow = '0 8px 15px rgba(0,0,0,0.15)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                            }}
                        >
                            <div style={{ marginBottom: '10px' }}>{opt.icon}</div>
                            <h3 style={{ color: '#003366', margin: 0 }}>{opt.title}</h3>
                            <p style={{ color: '#666', fontSize: '0.95rem' }}>{opt.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default PanelControl;
