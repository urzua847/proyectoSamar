import { useState, useEffect } from 'react';
import { getAuditLogs, getActivityStats } from '../services/audit.service';
import cookies from 'js-cookie';
import './AuditDashboard.css';

const AuditDashboard = () => {
    const [stats, setStats] = useState(null);
    const [alerts, setAlerts] = useState([]);
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLog, setSelectedLog] = useState(null);
    const [showDetailPopup, setShowDetailPopup] = useState(false);
    const [showDetailsSection, setShowDetailsSection] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            console.log('🔍 [AuditDashboard] Iniciando carga de datos...');

            // Obtener estadísticas
            console.log('📊 [AuditDashboard] Obteniendo estadísticas de actividad...');
            const statsData = await getActivityStats();
            console.log('✅ [AuditDashboard] Estadísticas recibidas:', statsData);
            setStats(statsData);

            // Obtener logs recientes
            console.log('📋 [AuditDashboard] Obteniendo logs recientes (página 1, límite 10)...');
            const logsData = await getAuditLogs(1, 10);
            console.log('✅ [AuditDashboard] Logs recibidos:', logsData);

            if (logsData && logsData.data) {
                setLogs(logsData.data);
                console.log(`📝 [AuditDashboard] ${logsData.data.length} logs cargados`);
            } else {
                console.warn('⚠️ [AuditDashboard] Formato de respuesta inesperado:', logsData);
                setLogs([]);
            }

            setLoading(false);
            console.log('✅ [AuditDashboard] Carga completada exitosamente');
        } catch (error) {
            console.error('❌ [AuditDashboard] Error al cargar datos:', error);
            console.error('❌ [AuditDashboard] Detalles del error:', {
                message: error.message,
                stack: error.stack,
                response: error.response?.data
            });
            setLoading(false);
        }
    };

    const handleExportExcel = async () => {
        try {
            const token = cookies.get('jwt-auth');
            const response = await fetch('/api/audit/export/excel', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Error al exportar Excel');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit_logs_${Date.now()}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exportando Excel:', error);
            alert('Error al exportar a Excel');
        }
    };

    const handleExportPDF = async () => {
        try {
            const token = cookies.get('jwt-auth');
            const response = await fetch('/api/audit/export/pdf', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Error al exportar PDF');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `audit_logs_${Date.now()}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error exportando PDF:', error);
            alert('Error al exportar a PDF');
        }
    };

    const handleRowDoubleClick = (log) => {
        console.log('🔍 [AuditDashboard] Log seleccionado:', log);
        console.log('📊 [AuditDashboard] Detalles del log:', log.details);
        setSelectedLog(log);
        setShowDetailPopup(true);
        setShowDetailsSection(false); // Reset details section
    };

    const handleCloseDetailPopup = () => {
        setShowDetailPopup(false);
        setSelectedLog(null);
        setShowDetailsSection(false);
    };

    if (loading) {
        return <div className="audit-dashboard-loading">Cargando dashboard...</div>;
    }

    return (
        <div className="audit-dashboard">
            <div className="audit-dashboard__header">
                <h2>Auditoría y Seguridad</h2>
                <div className="audit-dashboard__actions">
                    <button onClick={handleExportExcel} className="btn-export btn-export--excel">
                        Exportar Excel
                    </button>
                    <button onClick={handleExportPDF} className="btn-export btn-export--pdf">
                        Exportar PDF
                    </button>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="audit-stats">
                <div className="stat-card">
                    <div className="stat-card__content">
                        <h3>Acciones (24h)</h3>
                        <p className="stat-card__value">
                            {stats?.last24Hours?.reduce((sum, item) => sum + parseInt(item.count), 0) || 0}
                        </p>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-card__content">
                        <h3>Usuarios Activos</h3>
                        <p className="stat-card__value">{stats?.topUsers?.length || 0}</p>
                    </div>
                </div>

                <div className="stat-card stat-card--warning">
                    <div className="stat-card__content">
                        <h3>Alertas</h3>
                        <p className="stat-card__value">{alerts.length}</p>
                    </div>
                </div>
            </div>

            {/* Logs Recientes */}
            <div className="audit-logs-section">
                <h3>Actividad Reciente <span style={{ fontSize: '0.8rem', color: '#666', fontWeight: 'normal' }}>(Doble clic para ver detalles)</span></h3>
                <div className="audit-logs-table">
                    <table>
                        <thead>
                            <tr>
                                <th>Acción</th>
                                <th>Entidad</th>
                                <th>Usuario</th>
                                <th>Fecha</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map(log => (
                                <tr
                                    key={log.id}
                                    onDoubleClick={() => handleRowDoubleClick(log)}
                                    style={{ cursor: 'pointer' }}
                                    title="Doble clic para ver detalles completos"
                                >
                                    <td>
                                        <span className={`action-badge action-badge--${log.action.toLowerCase()}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td>{log.entityType}</td>
                                    <td>{log.userName || 'Sistema'}</td>
                                    <td>{new Date(log.createdAt).toLocaleString('es-CL')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Popup de Detalle */}
            {showDetailPopup && selectedLog && (
                <div className="bg" onClick={handleCloseDetailPopup}>
                    <div className="popup audit-detail-popup" onClick={(e) => e.stopPropagation()} style={{ width: '600px', maxWidth: '95%', maxHeight: '90vh', overflow: 'auto' }}>
                        <button className='btn-close-x' onClick={handleCloseDetailPopup}>X</button>

                        <h2 style={{ color: '#003366', marginBottom: '20px', fontSize: '1.2rem', fontWeight: 'bold' }}>
                            Detalle de Auditoría
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Información Principal */}
                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '10px',
                                    color: '#003366',
                                    fontWeight: '600'
                                }}>
                                    <span>📋</span>
                                    <span>Información Principal</span>
                                </div>
                                <ul style={{
                                    listStyle: 'none',
                                    padding: '0 0 0 24px',
                                    margin: 0,
                                    fontSize: '0.9rem',
                                    lineHeight: '1.8'
                                }}>
                                    <li style={{ marginBottom: '4px' }}>
                                        <strong>ID:</strong> {selectedLog.id}
                                    </li>
                                    <li style={{ marginBottom: '4px' }}>
                                        <strong>Acción:</strong>{' '}
                                        <span className={`action-badge action-badge--${selectedLog.action.toLowerCase()}`}>
                                            {selectedLog.action}
                                        </span>
                                    </li>
                                    <li style={{ marginBottom: '4px' }}>
                                        <strong>Tipo de Entidad:</strong> {selectedLog.entityType}
                                    </li>
                                    <li style={{ marginBottom: '4px' }}>
                                        <strong>ID de Entidad:</strong> {selectedLog.entityId || 'N/A'}
                                    </li>
                                    <li style={{ marginBottom: '4px' }}>
                                        <strong>Fecha:</strong> {new Date(selectedLog.createdAt).toLocaleString('es-CL', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                            second: '2-digit'
                                        })}
                                    </li>
                                </ul>
                            </div>

                            {/* Usuario */}
                            <div>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '10px',
                                    color: '#003366',
                                    fontWeight: '600'
                                }}>
                                    <span>👤</span>
                                    <span>Usuario</span>
                                </div>
                                <ul style={{
                                    listStyle: 'none',
                                    padding: '0 0 0 24px',
                                    margin: 0,
                                    fontSize: '0.9rem',
                                    lineHeight: '1.8'
                                }}>
                                    <li style={{ marginBottom: '4px' }}>
                                        <strong>Nombre:</strong> {selectedLog.userName || 'Sistema'}
                                    </li>
                                    <li style={{ marginBottom: '4px' }}>
                                        <strong>Email:</strong> {selectedLog.userEmail || 'N/A'}
                                    </li>
                                    <li style={{ marginBottom: '4px' }}>
                                        <strong>ID de Usuario:</strong> {selectedLog.userId || 'N/A'}
                                    </li>
                                </ul>
                            </div>

                            {/* Detalles del Cambio - Colapsable */}
                            <div>
                                <div
                                    onClick={() => setShowDetailsSection(!showDetailsSection)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        marginBottom: '10px',
                                        color: '#003366',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        userSelect: 'none'
                                    }}
                                >
                                    <span>{showDetailsSection ? '▼' : '▶'}</span>
                                    <span>🔍</span>
                                    <span>Detalles del Cambio</span>
                                </div>
                                {showDetailsSection && selectedLog.details && (
                                    <div style={{
                                        padding: '12px',
                                        background: '#f8f9fa',
                                        borderRadius: '6px',
                                        marginLeft: '24px'
                                    }}>
                                        <pre style={{
                                            margin: 0,
                                            fontSize: '0.75rem',
                                            fontFamily: 'monospace',
                                            overflow: 'auto',
                                            maxHeight: '300px',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word'
                                        }}>
                                            {JSON.stringify(selectedLog.details, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>

                            {/* Resumen Completo del Movimiento */}
                            <div style={{
                                background: '#fff9e6',
                                padding: '20px',
                                borderRadius: '8px',
                                border: '2px solid #ffd700'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '16px',
                                    color: '#003366',
                                    fontWeight: '600',
                                    fontSize: '1rem'
                                }}>
                                    <span>📊</span>
                                    <span>Resumen Completo del Movimiento</span>
                                </div>

                                {/* Registro de Auditoría */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{
                                        fontWeight: 'bold',
                                        color: '#003366',
                                        marginBottom: '8px',
                                        fontSize: '0.95rem'
                                    }}>
                                        Registro de Auditoría #{selectedLog.id}
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.6' }}>
                                        <strong>Qué pasó:</strong> Se realizó una acción de tipo{' '}
                                        <span className={`action-badge action-badge--${selectedLog.action.toLowerCase()}`}>
                                            {selectedLog.action}
                                        </span>
                                        {' '}sobre la entidad <strong>{selectedLog.entityType}</strong>
                                        {selectedLog.entityId && ` (ID: ${selectedLog.entityId})`}.
                                    </div>
                                </div>

                                {/* Quién lo hizo */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{
                                        fontWeight: 'bold',
                                        color: '#003366',
                                        marginBottom: '8px',
                                        fontSize: '0.95rem'
                                    }}>
                                        Quién lo hizo
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.6' }}>
                                        {selectedLog.userName ? (
                                            <>
                                                Usuario <strong>{selectedLog.userName}</strong>
                                                {selectedLog.userEmail && ` (${selectedLog.userEmail})`}
                                                {selectedLog.userId && ` con ID ${selectedLog.userId}`}.
                                            </>
                                        ) : (
                                            'Acción realizada por el Sistema automáticamente.'
                                        )}
                                    </div>
                                </div>

                                {/* Cuándo ocurrió */}
                                <div style={{ marginBottom: '16px' }}>
                                    <div style={{
                                        fontWeight: 'bold',
                                        color: '#003366',
                                        marginBottom: '8px',
                                        fontSize: '0.95rem'
                                    }}>
                                        Cuándo ocurrió
                                    </div>
                                    <div style={{ fontSize: '0.9rem', color: '#555', lineHeight: '1.6' }}>
                                        <strong>{new Date(selectedLog.createdAt).toLocaleDateString('es-CL', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</strong> a las{' '}
                                        <strong>{new Date(selectedLog.createdAt).toLocaleTimeString('es-CL')}</strong>
                                    </div>
                                </div>

                                {/* Datos modificados */}
                                {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                                    <div>
                                        <div style={{
                                            fontWeight: 'bold',
                                            color: '#003366',
                                            marginBottom: '12px',
                                            fontSize: '0.95rem'
                                        }}>
                                            Datos modificados
                                        </div>
                                        <div style={{ fontSize: '0.9rem', lineHeight: '2' }}>
                                            {Object.entries(selectedLog.details).map(([key, value]) => {
                                                // Si es un array de objetos (tabla)
                                                if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
                                                    return (
                                                        <div key={key} style={{ marginBottom: '16px' }}>
                                                            <div style={{
                                                                fontWeight: '600',
                                                                color: '#003366',
                                                                marginBottom: '8px',
                                                                textTransform: 'capitalize'
                                                            }}>
                                                                {key.replace(/_/g, ' ')}
                                                            </div>
                                                            <table style={{
                                                                width: '100%',
                                                                borderCollapse: 'collapse',
                                                                background: 'white',
                                                                fontSize: '0.85rem'
                                                            }}>
                                                                <thead>
                                                                    <tr style={{ background: '#f0f0f0' }}>
                                                                        {Object.keys(value[0]).map(col => (
                                                                            <th key={col} style={{
                                                                                padding: '8px',
                                                                                textAlign: 'left',
                                                                                borderBottom: '2px solid #ddd',
                                                                                fontWeight: '600',
                                                                                textTransform: 'capitalize'
                                                                            }}>
                                                                                {col.replace(/_/g, ' ')}
                                                                            </th>
                                                                        ))}
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {value.map((row, idx) => (
                                                                        <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                                                            {Object.values(row).map((cell, cidx) => (
                                                                                <td key={cidx} style={{ padding: '8px' }}>
                                                                                    {typeof cell === 'object' ? JSON.stringify(cell) : String(cell)}
                                                                                </td>
                                                                            ))}
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    );
                                                }

                                                // Para valores simples
                                                return (
                                                    <div key={key} style={{ marginBottom: '8px' }}>
                                                        <strong style={{ textTransform: 'capitalize' }}>
                                                            {key.replace(/_/g, ' ')}:
                                                        </strong>{' '}
                                                        {typeof value === 'number' ? (
                                                            <span style={{
                                                                background: '#3B82F6',
                                                                color: 'white',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                fontWeight: '600'
                                                            }}>
                                                                {value}
                                                            </span>
                                                        ) : typeof value === 'boolean' ? (
                                                            <span style={{
                                                                background: value ? '#10B981' : '#EF4444',
                                                                color: 'white',
                                                                padding: '2px 8px',
                                                                borderRadius: '4px',
                                                                fontWeight: '600'
                                                            }}>
                                                                {value ? 'Sí' : 'No'}
                                                            </span>
                                                        ) : (
                                                            String(value)
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button onClick={handleCloseDetailPopup} className="btn-save" style={{ minWidth: '120px' }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditDashboard;
