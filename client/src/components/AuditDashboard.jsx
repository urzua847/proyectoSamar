import { useState, useEffect } from 'react';
import { getAuditLogs, getActivityStats } from '../services/audit.service';
import { showToastSuccess, showToastError } from '../helpers/sweetAlert';
import Badge from './Badge';
import cookies from 'js-cookie';
import './AuditDashboard.css';

const translateAction = (action) => {
    switch (action?.toUpperCase()) {
        case 'CREATE': return 'Registro Nuevo';
        case 'UPDATE': return 'Modificación';
        case 'DELETE': return 'Eliminación';
        case 'LOGIN': return 'Inicio de Sesión';
        case 'LOGOUT': return 'Cierre de Sesión';
        default: return action;
    }
};

const translateEntity = (entity) => {
    switch (entity?.toLowerCase()) {
        case 'produccion': return 'Lote de Producción';
        case 'recepcion': return 'Recepción de MP';
        case 'usuario': return 'Usuario';
        case 'lote': return 'Lote';
        case 'cliente': return 'Cliente';
        case 'proveedor': return 'Proveedor';
        case 'despacho': return 'Despacho';
        case 'entidad': return 'Entidad';
        case 'auth': return 'Autenticación';
        default: return entity || 'Registro';
    }
};

const getActionColor = (action) => {
    switch (action?.toUpperCase()) {
        case 'CREATE': return '#10B981'; // verde
        case 'UPDATE': return '#3B82F6'; // azul
        case 'DELETE': return '#EF4444'; // rojo
        default: return '#6B7280'; // gris
    }
};

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
            showToastSuccess('Archivo Excel generado con éxito');
        } catch (error) {
            console.error('Error exportando Excel:', error);
            showToastError('Error al exportar a Excel');
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
            showToastSuccess('Archivo PDF generado con éxito');
        } catch (error) {
            console.error('Error exportando PDF:', error);
            showToastError('Error al exportar a PDF');
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
                                            {translateAction(log.action)}
                                        </span>
                                    </td>
                                    <td>{translateEntity(log.entityType)}</td>
                                    <td>{log.userName || 'Sistema'}</td>
                                    <td>{new Date(log.createdAt).toLocaleString('es-CL')}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Popup de Detalle Humanizado */}
            {showDetailPopup && selectedLog && (
                <div className="bg" onClick={handleCloseDetailPopup}>
                    <div className="popup audit-detail-popup" onClick={(e) => e.stopPropagation()} style={{ width: '600px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', padding: '0', overflow: 'hidden' }}>
                        
                        {/* Header Moderno */}
                        <div style={{
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            padding: '20px 24px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            color: 'white'
                        }}>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', letterSpacing: '0.02em' }}>
                                Auditoría #{selectedLog.id}
                            </h2>
                            <button className='btn-close-x' onClick={handleCloseDetailPopup} style={{ position: 'static', color: 'white', background: 'rgba(255,255,255,0.1)' }}>✕</button>
                        </div>

                        {/* Body Scrollable */}
                        <div style={{ padding: '24px', overflowY: 'auto' }}>
                            
                            {/* La Historia (Resumen Narrativo) */}
                            <div style={{
                                background: '#f8fafc',
                                padding: '20px',
                                borderRadius: '8px',
                                borderLeft: `4px solid ${getActionColor(selectedLog.action)}`,
                                marginBottom: '24px',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                            }}>
                                <div style={{ fontSize: '1rem', color: '#334155', lineHeight: '1.7' }}>
                                    El <strong>{new Date(selectedLog.createdAt).toLocaleDateString('es-CL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'})}</strong> a las <strong>{new Date(selectedLog.createdAt).toLocaleTimeString('es-CL')}</strong>,<br/>
                                    el usuario <strong>{selectedLog.userName || 'Sistema'}</strong> ({selectedLog.userEmail || 'N/A'})<br/>
                                    realizó una <strong>{translateAction(selectedLog.action)}</strong> sobre el registro de <strong>{translateEntity(selectedLog.entityType)}</strong> (Referencia ID: {selectedLog.entityId || 'N/A'}).
                                </div>
                            </div>

                            {/* El Cambio (Tabla de Detalles) */}
                            {selectedLog.details && Object.keys(selectedLog.details).length > 0 && (
                                <div>
                                    <h3 style={{ fontSize: '1.05rem', color: '#1e293b', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', fontWeight: '700' }}>
                                        Campos Involucrados
                                    </h3>
                                    
                                    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                            {selectedLog.action === 'UPDATE' && selectedLog.previousData && (
                                                <thead>
                                                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
                                                        <th style={{ padding: '10px 16px', textAlign: 'left', color: '#334155', fontWeight: '600' }}>Campo Modificado</th>
                                                        <th style={{ padding: '10px 16px', textAlign: 'left', color: '#ef4444', fontWeight: '600' }}>Valor Anterior</th>
                                                        <th style={{ padding: '10px 16px', textAlign: 'left', color: '#10b981', fontWeight: '600' }}>Nuevo Valor</th>
                                                    </tr>
                                                </thead>
                                            )}
                                            <tbody>
                                                {Object.entries(selectedLog.details).map(([key, value], idx) => {
                                                    const isUpdate = selectedLog.action === 'UPDATE' && selectedLog.previousData;
                                                    const prevValue = isUpdate ? selectedLog.previousData[key] : undefined;
                                                    
                                                    // No mostrar campos que no cambiaron en un UPDATE
                                                    if (isUpdate && prevValue === value) return null;

                                                    const formatValue = (v) => {
                                                        if (typeof v === 'boolean') {
                                                            return (
                                                                <span style={{
                                                                    background: v ? '#10B981' : '#EF4444',
                                                                    color: 'white',
                                                                    padding: '2px 8px',
                                                                    borderRadius: '4px',
                                                                    fontWeight: '600',
                                                                    fontSize: '0.75rem',
                                                                    textTransform: 'uppercase'
                                                                }}>
                                                                    {v ? 'Sí' : 'No'}
                                                                </span>
                                                            );
                                                        }
                                                        if (v === null || v === '' || v === undefined) {
                                                            return <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Vacío</span>;
                                                        }
                                                        return String(v);
                                                    };

                                                    // Evitamos imprimir arrays gigantes
                                                    if (Array.isArray(value) && typeof value[0] === 'object') {
                                                        return (
                                                            <tr key={key} style={{ borderTop: idx > 0 ? '1px solid #e2e8f0' : 'none' }}>
                                                                <td style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', background: '#f8fafc', width: isUpdate ? '30%' : '40%', textTransform: 'capitalize', verticalAlign: 'top' }}>
                                                                    {key.replace(/_/g, ' ')}
                                                                </td>
                                                                {isUpdate && (
                                                                    <td style={{ padding: '12px 16px', color: '#ef4444', textDecoration: 'line-through' }}>
                                                                        <span style={{ fontSize: '0.85rem' }}>[Estructura compleja]</span>
                                                                    </td>
                                                                )}
                                                                <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: isUpdate ? '500' : 'normal' }}>
                                                                    <span style={{ color: '#64748b', fontStyle: 'italic', fontSize: '0.85rem' }}>[{value.length} registros internos]</span>
                                                                </td>
                                                            </tr>
                                                        );
                                                    }

                                                    // Para valores simples (textos, numeros, booleanos)
                                                    return (
                                                        <tr key={key} style={{ borderTop: idx > 0 ? '1px solid #e2e8f0' : 'none' }}>
                                                            <td style={{ padding: '12px 16px', fontWeight: '600', color: '#475569', background: '#f8fafc', width: isUpdate ? '30%' : '40%', textTransform: 'capitalize' }}>
                                                                {key.replace(/_/g, ' ')}
                                                            </td>
                                                            {isUpdate && (
                                                                <td style={{ padding: '12px 16px', color: '#94a3b8', textDecoration: 'line-through' }}>
                                                                    {formatValue(prevValue)}
                                                                </td>
                                                            )}
                                                            <td style={{ padding: '12px 16px', color: '#1e293b', fontWeight: isUpdate ? '600' : 'normal' }}>
                                                                {formatValue(value)}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
                                <button onClick={handleCloseDetailPopup} className="btn-cancel" style={{ minWidth: '120px' }}>
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AuditDashboard;
