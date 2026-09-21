
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRecepciones } from '../services/recepcion.service';
import usePolling from '../hooks/usePolling';
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
        {
            title: "Auditoría",
            path: "/auditoria",
            desc: "Monitoreo de actividad, logs y alertas de seguridad.",
            icon: (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
            )
        },
        {
            title: "Gestión de Pedidos",
            path: "/pedidos",
            desc: "Creación y administración de planes de despacho.",
            icon: (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#003366" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="1" y="3" width="15" height="13"></rect>
                    <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle>
                    <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
            )
        },
    ];

    const [stats, setStats] = useState({ lotesAbiertos: 0, totalEntidades: 0, totalDespachos: 0, loading: true });
    const fetchStatsRef = React.useRef();

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Import axios locally to avoid duplicate imports if not existing
                const axios = (await import('../services/root.service.js')).default;
                const { getLotesActivos } = await import('../services/recepcion.service');
                const { getStockCamaras } = await import('../services/envasado.service');

                const [lotes, entidades, despachos] = await Promise.all([
                    getLotesActivos(),
                    axios.get('/entidades'),
                    axios.get('/pedidos')
                ]);

                const openLotes = lotes.filter(l => l.estado === true).length;
                
                let numEntidades = 0;
                if (Array.isArray(entidades.data?.data)) {
                    numEntidades = entidades.data.data.length;
                } else if (Array.isArray(entidades.data)) {
                    numEntidades = entidades.data.length;
                }
                
                let numDespachos = 0;
                if (despachos.data?.data?.pagination?.totalItems) {
                    numDespachos = despachos.data.data.pagination.totalItems;
                } else if (Array.isArray(despachos.data?.data?.data)) {
                    numDespachos = despachos.data.data.data.length;
                } else if (Array.isArray(despachos.data?.data)) {
                    numDespachos = despachos.data.data.length;
                }

                setStats({
                    lotesAbiertos: openLotes,
                    totalEntidades: numEntidades,
                    totalDespachos: numDespachos,
                    loading: false
                });
            } catch (error) {
                console.error("Error fetching dashboard stats:", error);
                setStats(s => ({ ...s, loading: false }));
            }
        };

        fetchStats();

        // Expone fetchStats a un ref para el polling
        fetchStatsRef.current = fetchStats;
    }, []);

    // Actualización automática cada 60 segundos para el Dashboard
    usePolling(() => {
        if (fetchStatsRef.current) {
            fetchStatsRef.current();
        }
    }, 60000);

    return (
        <div className="main-container">
            <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
                <h1 style={{ color: '#003366', textAlign: 'center', marginBottom: '28px', fontSize: '1.75rem', fontWeight: '700', letterSpacing: '-0.02em' }}>Panel de Control</h1>

                {/* Dashboard Stats Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
                    <div style={{ backgroundColor: '#e0f2fe', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #bae6fd' }}>
                        <h3 style={{ color: '#0369a1', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Lotes Abiertos (Proceso)</h3>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#0284c7', margin: 0 }}>
                            {stats.loading ? '...' : stats.lotesAbiertos}
                        </p>
                    </div>
                    <div style={{ backgroundColor: '#dcfce7', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #bbf7d0' }}>
                        <h3 style={{ color: '#166534', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Entidades Registradas</h3>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#15803d', margin: 0 }}>
                            {stats.loading ? '...' : stats.totalEntidades}
                        </p>
                    </div>
                    <div style={{ backgroundColor: '#fef3c7', padding: '20px', borderRadius: '8px', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #fde68a' }}>
                        <h3 style={{ color: '#92400e', margin: '0 0 10px 0', fontSize: '1.1rem' }}>Total Despachos</h3>
                        <p style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#b45309', margin: 0 }}>
                            {stats.loading ? '...' : stats.totalDespachos}
                        </p>
                    </div>
                </div>

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
