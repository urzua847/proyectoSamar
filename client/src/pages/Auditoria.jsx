import React, { useState, useEffect } from 'react';
import axios from '../services/root.service';
import Table from '../components/Table';
import { format as formatTempo } from '@formkit/tempo';
import { showToastError } from '../helpers/sweetAlert';
import { useAuth } from '../context/AuthContext';
import TouchButton from '../components/TouchButton';
import '../components/AuditDashboard.css';

const Auditoria = () => {
    const { user } = useAuth();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        currentPage: 1,
        pageSize: 30,
        totalItems: 0,
        totalPages: 1
    });

    useEffect(() => {
        if (user && (user.rol === 'administrador' || user.rol === 'operador')) {
            fetchLogs(1);
        } else {
            setLoading(false); // No admin
        }
    }, [user]);

    const fetchLogs = async (page = 1) => {
        setLoading(true);
        try {
            const response = await axios.get(`/audit?page=${page}&limit=${pagination.pageSize}`);
            if (response.data?.data) {
                // response.data.data contiene { data: [...], pagination: {...} }
                setLogs(response.data.data.data || []);
                if (response.data.data.pagination) {
                    setPagination(response.data.data.pagination);
                }
            }
        } catch (error) {
            console.error("Error al cargar auditoría:", error);
            showToastError("Error al cargar historial de auditoría");
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= pagination.totalPages) {
            fetchLogs(newPage);
        }
    };

    const handleExportExcel = async () => {
        try {
            const response = await axios.get('/audit/export/excel', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `auditoria_${formatTempo(new Date(), 'YYYYMMDD_HHmm')}.xlsx`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            showToastError("Error al exportar a Excel");
        }
    };

    const handleExportPdf = async () => {
        try {
            const response = await axios.get('/audit/export/pdf', { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `auditoria_${formatTempo(new Date(), 'YYYYMMDD_HHmm')}.pdf`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            showToastError("Error al exportar a PDF");
        }
    };

    const columns = [
        { 
            header: "Fecha y Hora", 
            accessor: "createdAt",
            render: (row) => (
                <div style={{ whiteSpace: 'nowrap' }}>
                    <strong>{formatTempo(row.createdAt, "YYYY-MM-DD")}</strong>
                    <br />
                    <span style={{ color: '#64748b' }}>{formatTempo(row.createdAt, "HH:mm:ss")}</span>
                </div>
            )
        },
        { 
            header: "Usuario", 
            accessor: "userName",
            render: (row) => row.userName ? (
                <div>
                    <div style={{ fontWeight: '600', color: '#0f172a' }}>{row.userName}</div>
                </div>
            ) : <span style={{ color: '#94a3b8' }}>Sistema</span>
        },
        { 
            header: "Acción", 
            accessor: "action",
            render: (row) => {
                let badgeClass = "action-badge ";
                const act = (row.action || "").toLowerCase();
                if (act.includes('create') || act.includes('ingreso') || act.includes('produccion')) badgeClass += "action-badge--create";
                else if (act.includes('delete') || act.includes('devolucion')) badgeClass += "action-badge--delete";
                else if (act.includes('update') || act.includes('traslado')) badgeClass += "action-badge--update";
                else badgeClass += "action-badge--login";
                
                return <span className={badgeClass}>{row.action}</span>;
            }
        },
        { 
            header: "Entidad", 
            accessor: "entityType"
        },
        { 
            header: "Detalle", 
            accessor: "summary",
            render: (row) => {
                const data = row.details || {};
                let summary = row.summary || '';
                
                // Fallback local si el backend no envió el summary
                if (!summary) {
                    switch (row.entityType) {
                        case 'LoteRecepcion':
                            const loteCodigo = data.codigo || data.lote_codigo || (row.previousData ? row.previousData.codigo : null);
                            summary = `Lote ${loteCodigo ? loteCodigo : '#' + row.entityId}`;
                            if (data.peso_bruto_kg !== undefined) summary += `\nPeso Bruto: ${data.peso_bruto_kg}kg`;
                            if (data.materiaPrima !== undefined) summary += `, MP: ${data.materiaPrima}`;
                            if (data.estado !== undefined) summary += ` (Estado: ${data.estado ? 'Activo' : 'Inactivo'})`;
                            if (data.en_proceso_produccion !== undefined) summary += ` (En Producción: ${data.en_proceso_produccion ? 'Sí' : 'No'})`;
                            break;
                        case 'Produccion':
                            summary = `Producción de Lote ${data.lote_codigo || 'N/A'}`;
                            if (data.peso_total) summary += `\nTotal: ${data.peso_total}kg`;
                            if (data.peso_carne_blanca) summary += ` (Carne: ${data.peso_carne_blanca}kg, Pinzas: ${data.peso_pinzas || 0}kg)`;
                            break;
                        case 'ProductoTerminado':
                        case 'Envasado':
                            summary = `Producto Terminado`;
                            if (data.detalle_productos && Array.isArray(data.detalle_productos)) {
                                summary += `: ${data.detalle_productos.length} items`;
                                const first = data.detalle_productos[0];
                                if (first) summary += `\nEj: ${first.producto} - ${first.calibre} (${first.peso_neto_kg}kg)`;
                            } else if (data.lote_codigo) {
                                summary += `\nLote: ${data.lote_codigo}`;
                            }
                            break;
                        case 'Traslado':
                            summary = `Traslado hacia ${data.destino_nombre || 'N/A'}`;
                            if (data.detalle_items && Array.isArray(data.detalle_items)) {
                                const totalKg = data.detalle_items.reduce((sum, item) => sum + (parseFloat(item.cantidad_kg) || parseFloat(item.cantidad_solicitada) || 0), 0);
                                const pesoCaja = parseFloat(data.peso_caja) || 0;
                                const cajasStr = pesoCaja > 0 ? ` (${Math.round(totalKg / pesoCaja)} cajas)` : '';
                                summary += `\nTotal: ${totalKg.toFixed(2)}kg${cajasStr}`;
                            }
                            break;
                        case 'Pedido':
                            summary = `Pedido - Guía: ${data.numero_guia || 'N/A'}`;
                            if (data.cliente) summary += `\nCliente: ${data.cliente}`;
                            if (data.kilos_totales) summary += `\nTotal: ${data.kilos_totales}kg`;
                            break;
                        default:
                            const keys = Object.keys(data).slice(0, 3);
                            if (keys.length > 0) {
                                summary = keys.map(key => `${key}: ${data[key]}`).join(', ');
                            } else {
                                summary = 'Acción registrada sin detalles adicionales';
                            }
                    }
                }

                return (
                    <div style={{ 
                        maxHeight: '80px', 
                        overflowY: 'auto', 
                        fontSize: '0.85rem',
                        background: '#f8fafc',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        border: '1px solid #e2e8f0',
                        color: '#334155',
                        lineHeight: '1.4'
                    }}>
                        <div style={{ whiteSpace: 'pre-wrap', fontWeight: '500' }}>
                            {summary}
                        </div>
                    </div>
                );
            }
        },
        { 
            header: "IP", 
            accessor: "ipAddress",
            render: (row) => <span style={{ color: '#64748b', fontSize: '0.85rem' }}>{row.ipAddress || '-'}</span>
        }
    ];

    if (!user || (user.rol !== 'administrador' && user.rol !== 'operador')) {
        return (
            <div className="main-container">
                <div style={{ padding: '40px', textAlign: 'center', color: '#ef4444' }}>
                    <h3>Acceso Denegado</h3>
                    <p>No tienes permisos para ver el historial de auditoría.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="main-container">
            <div className="audit-dashboard" style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
                
                <header className="audit-dashboard__header">
                    <div>
                        <h2>Historial de Auditoría</h2>
                    </div>
                    <div className="audit-dashboard__actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <TouchButton 
                            variant="success" 
                            size="small" 
                            icon="📊" 
                            onClick={handleExportExcel}
                        >
                            Exportar Excel
                        </TouchButton>
                        <TouchButton 
                            variant="danger" 
                            size="small" 
                            icon="📄" 
                            onClick={handleExportPdf}
                        >
                            Exportar PDF
                        </TouchButton>
                    </div>
                </header>

                <div className="audit-logs-section" style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Registros de Actividad</h3>
                        <TouchButton 
                            variant="primary" 
                            size="small" 
                            icon="🔄" 
                            onClick={() => fetchLogs(pagination.currentPage)}
                        >
                            Refrescar
                        </TouchButton>
                    </div>

                    {loading ? (
                        <div className="audit-dashboard-loading">Cargando registros inmutables...</div>
                    ) : (
                        <>
                            <Table columns={columns} data={logs} />
                            
                            {/* Paginación */}
                            {pagination.totalPages > 1 && (
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', marginTop: '20px', gap: '15px' }}>
                                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>
                                        Página {pagination.currentPage} de {pagination.totalPages} ({pagination.totalItems} registros)
                                    </span>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button 
                                            onClick={() => handlePageChange(pagination.currentPage - 1)}
                                            disabled={!pagination.hasPreviousPage}
                                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: pagination.hasPreviousPage ? 'white' : '#f1f5f9', cursor: pagination.hasPreviousPage ? 'pointer' : 'not-allowed' }}
                                        >
                                            Anterior
                                        </button>
                                        <button 
                                            onClick={() => handlePageChange(pagination.currentPage + 1)}
                                            disabled={!pagination.hasNextPage}
                                            style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: pagination.hasNextPage ? 'white' : '#f1f5f9', cursor: pagination.hasNextPage ? 'pointer' : 'not-allowed' }}
                                        >
                                            Siguiente
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Auditoria;
