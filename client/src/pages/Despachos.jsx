import React, { useState, useEffect, useMemo, Fragment } from 'react';
import axios from '../services/root.service.js';
import { format as formatTempo } from "@formkit/tempo";
import '../styles/users.css';
import '../styles/pedidos.css';
import { showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';

const Despachos = ({ isEmbedded = false }) => {
    const [orderHistory, setOrderHistory] = useState([]);
    const [expandedRows, setExpandedRows] = useState({});

    const toggleRow = (id) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Filtros locales
    const [historialFilters, setHistorialFilters] = useState({
        cliente: '',
        fecha_desde: '',
        fecha_hasta: '',
        numero_guia: ''
    });
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        fetchHistory();
    }, []);

    // Carga TODOS los datos sin filtros
    const fetchHistory = async () => {
        try {
            const response = await axios.get('/pedidos');
            const responseData = response.data.data;
            const rawData = responseData.data || responseData;

            if (!Array.isArray(rawData)) { setOrderHistory([]); return; }

            const data = rawData.map(v => {
                const hasPhysicalBoxes = v.cajasAsignadas && v.cajasAsignadas.length > 0;
                const calculatedKilos = hasPhysicalBoxes
                    ? v.cajasAsignadas.reduce((acc, caja) => acc + Number(caja.peso_neto_kg || 0), 0)
                    : v.detalles?.reduce((acc, curr) => acc + Number(curr.kilos_totales), 0) || 0;

                return {
                    id: v.id,
                    fechaISO: v.fecha,  // guardamos la fecha original para comparar
                    fecha: formatTempo(v.fecha, "DD-MM-YYYY HH:mm"),
                    cliente: v.cliente,
                    guia: v.numero_guia || '-',
                    estado: v.estado,
                    totalItems: v.detalles?.reduce((acc, curr) => acc + Number(curr.cajas_asignadas != null ? curr.cajas_asignadas : curr.cantidad_bultos || 0), 0) || 0,
                    totalKilos: calculatedKilos.toFixed(2),
                    details: v.detalles,
                    cajasFisicas: v.cajasAsignadas || []
                };
            });
            setOrderHistory(data);
        } catch (error) {
            console.error("Error fetching history", error);
        }
    };

    // Filtrado local instantáneo con useMemo
    const filteredHistory = useMemo(() => {
        let filtered = orderHistory.filter(item => {
            const matchCliente = !historialFilters.cliente ||
                (item.cliente || '').toLowerCase().includes(historialFilters.cliente.toLowerCase());

            const matchGuia = !historialFilters.numero_guia ||
                (item.guia || '').toLowerCase().includes(historialFilters.numero_guia.toLowerCase());

            const itemDate = item.fechaISO ? item.fechaISO.slice(0, 10) : '';
            const matchDesde = !historialFilters.fecha_desde || itemDate >= historialFilters.fecha_desde;
            const matchHasta = !historialFilters.fecha_hasta || itemDate <= historialFilters.fecha_hasta;

            return matchCliente && matchGuia && matchDesde && matchHasta;
        });

        filtered.sort((a, b) => {
            const timeA = a.fechaISO ? new Date(a.fechaISO).getTime() : 0;
            const timeB = b.fechaISO ? new Date(b.fechaISO).getTime() : 0;
            return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
        });

        return filtered;
    }, [orderHistory, historialFilters, sortOrder]);

    // Limpiar filtros
    const handleClearFilters = () => {
        setHistorialFilters({ cliente: '', fecha_desde: '', fecha_hasta: '', numero_guia: '' });
    };

    // Exportar a Excel
    const handleExportExcel = async () => {
        try {
            const params = new URLSearchParams();
            if (historialFilters.cliente) params.append('cliente', historialFilters.cliente);
            if (historialFilters.fecha_desde) params.append('fecha_desde', historialFilters.fecha_desde);
            if (historialFilters.fecha_hasta) params.append('fecha_hasta', historialFilters.fecha_hasta);
            if (historialFilters.numero_guia) params.append('numero_guia', historialFilters.numero_guia);

            const url = `/pedidos/export/excel${params.toString() ? '?' + params.toString() : ''}`;

            const response = await axios.get(url, {
                responseType: 'blob'
            });

            // Crear link de descarga
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `despachos_${Date.now()}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            showSuccessAlert('Excel Exportado', 'El archivo se ha descargado correctamente.');
        } catch (error) {
            console.error('Error exportando Excel:', error);
            showErrorAlert('Error', 'No se pudo exportar el archivo Excel.');
        }
    };

    // Exportar a PDF
    const handleExportPDF = async () => {
        try {
            const params = new URLSearchParams();
            if (historialFilters.cliente) params.append('cliente', historialFilters.cliente);
            if (historialFilters.fecha_desde) params.append('fecha_desde', historialFilters.fecha_desde);
            if (historialFilters.fecha_hasta) params.append('fecha_hasta', historialFilters.fecha_hasta);
            if (historialFilters.numero_guia) params.append('numero_guia', historialFilters.numero_guia);

            const url = `/pedidos/export/pdf${params.toString() ? '?' + params.toString() : ''}`;

            const response = await axios.get(url, {
                responseType: 'blob'
            });

            // Crear link de descarga
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `despachos_${Date.now()}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);

            showSuccessAlert('PDF Exportado', 'El archivo se ha descargado correctamente.');
        } catch (error) {
            console.error('Error exportando PDF:', error);
            showErrorAlert('Error', 'No se pudo exportar el archivo PDF.');
        }
    };

    return (
        <div className={isEmbedded ? "" : "main-container"}>
            <div className={isEmbedded ? "" : "table-wrapper"}>
                <div className="top-table" style={{ display: 'flex', justifyContent: isEmbedded ? 'flex-end' : 'space-between', alignItems: 'center' }}>
                    {!isEmbedded && <h1 className="title-table" style={{ margin: 0 }}>Historial de Despachos</h1>}
                    <div style={{ display: 'flex', gap: '10px', width: isEmbedded ? '100%' : 'auto', justifyContent: isEmbedded ? 'flex-end' : 'flex-start' }}>
                        <button onClick={handleExportExcel} className="btn-new" style={{ padding: '8px 16px' }}>
                            Exportar Excel
                        </button>
                        <button onClick={handleExportPDF} className="btn-delete" style={{ padding: '8px 16px' }}>
                            Exportar PDF
                        </button>
                    </div>
                </div>

                <div className="table-container-box">
                    {/* Filtros */}
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Cliente..."
                            value={historialFilters.cliente}
                            onChange={e => setHistorialFilters({ ...historialFilters, cliente: e.target.value })}
                            className="search-input"
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#fff', padding: '0 8px', borderRadius: '4px', border: '1px solid #ccc', height: '38px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#666' }}>Desde:</span>
                            <input
                                type="date"
                                value={historialFilters.fecha_desde}
                                onChange={e => setHistorialFilters({ ...historialFilters, fecha_desde: e.target.value })}
                                style={{ border: 'none', outline: 'none', backgroundColor: 'transparent' }}
                                title="Fecha desde"
                            />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', backgroundColor: '#fff', padding: '0 8px', borderRadius: '4px', border: '1px solid #ccc', height: '38px' }}>
                            <span style={{ fontSize: '0.85rem', color: '#666' }}>Hasta:</span>
                            <input
                                type="date"
                                value={historialFilters.fecha_hasta}
                                onChange={e => setHistorialFilters({ ...historialFilters, fecha_hasta: e.target.value })}
                                style={{ border: 'none', outline: 'none', backgroundColor: 'transparent' }}
                                title="Fecha hasta"
                            />
                        </div>
                        <input
                            type="text"
                            placeholder="N° Documento..."
                            value={historialFilters.numero_guia}
                            onChange={e => setHistorialFilters({ ...historialFilters, numero_guia: e.target.value })}
                            className="search-input"
                        />
                        <select
                            value={sortOrder}
                            onChange={e => setSortOrder(e.target.value)}
                            className="search-input"
                            style={{ height: '38px' }}
                        >
                            <option value="desc">Más recientes</option>
                            <option value="asc">Más antiguos</option>
                        </select>
                        <button onClick={handleClearFilters} className="btn-cancel" style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
                            Limpiar
                        </button>
                    </div>



                    {/* Tabla Personalizada con Productos Expandidos */}
                    <div style={{ overflowX: 'auto' }}>
                        <table className="samar-table" style={{ width: '100%' }}>
                            <thead>
                                <tr>
                                    <th style={{ width: '50px' }}>ID</th>
                                    <th style={{ width: '100px' }}>Fecha</th>
                                    <th style={{ width: '150px' }}>Cliente</th>
                                    <th style={{ width: '100px' }}>Documento</th>
                                    <th style={{ width: '200px' }}>Producto</th>
                                    <th style={{ width: '120px' }}>Calibre</th>
                                    <th style={{ width: '70px' }}>Cajas</th>
                                    <th style={{ width: '90px' }}>Kilos/Caja</th>
                                    <th style={{ width: '80px' }}>Kilos</th>
                                    <th style={{ width: '100px' }}>Total Kilos</th>
                                    <th style={{ width: '100px' }}>Total Cajas</th>
                                    <th style={{ width: '100px' }}>Estado</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredHistory.map((pedido) => {
                                    const products = pedido.details || [];
                                    const isExpanded = expandedRows[pedido.id];

                                    // Agrupar productos por nombre + calibre
                                    const groupedProducts = products.reduce((acc, p) => {
                                        const nombre = p.definicion_producto?.nombre || p.producto?.definicion?.nombre || 'N/A';
                                        const calibre = p.tipo_formato || p.producto?.calibre || 'N/A';
                                        const key = `${nombre}_${calibre}`;

                                        if (!acc[key]) {
                                            acc[key] = {
                                                nombre,
                                                calibre,
                                                totalCajas: 0,
                                                totalCajasSolicitadas: 0,
                                                totalKilos: 0
                                            };
                                        }
                                        acc[key].totalCajas += parseFloat(p.cajas_asignadas != null ? p.cajas_asignadas : p.cantidad_bultos) || 0;
                                        acc[key].totalCajasSolicitadas += parseFloat(p.cantidad_bultos) || 0;
                                        acc[key].totalKilos += parseFloat(p.kilos_totales) || 0;
                                        return acc;
                                    }, {});

                                    const productList = Object.values(groupedProducts).map(group => {
                                        const matchingBoxes = (pedido.cajasFisicas || []).filter(c => 
                                            (c.definicion?.nombre === group.nombre || c.cajaDefinicion?.nombre === group.nombre) && 
                                            c.calibre === group.calibre
                                        );
                                        if (matchingBoxes.length > 0) {
                                            group.totalKilos = matchingBoxes.reduce((sum, c) => sum + parseFloat(c.peso_neto_kg || 0), 0);
                                        }
                                        return group;
                                    });

                                    return (
                                        <Fragment key={pedido.id}>
                                            <tr 
                                                onClick={() => toggleRow(pedido.id)}
                                                style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#f8fafc' : 'white', transition: 'background-color 0.2s' }}
                                            >
                                                <td style={{ fontWeight: '600' }}>
                                                    <span style={{ marginRight: '8px', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', fontSize: '0.8rem' }}>
                                                        ▶
                                                    </span>
                                                    {pedido.id}
                                                </td>
                                                <td>{pedido.fecha}</td>
                                                <td>{pedido.cliente}</td>
                                                <td style={{ fontWeight: '600', color: '#3b82f6' }}>{pedido.guia}</td>
                                                <td colSpan={5} style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                                    {productList.length} tipo(s) de producto
                                                </td>
                                                <td style={{ textAlign: 'center', fontWeight: '600' }}>{pedido.totalKilos}</td>
                                                <td style={{ textAlign: 'center', fontWeight: '600' }}>{pedido.totalItems}</td>
                                                <td style={{ textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '4px 8px',
                                                        borderRadius: '4px',
                                                        backgroundColor: '#dbeafe',
                                                        color: '#1e40af',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {pedido.estado}
                                                    </span>
                                                </td>
                                            </tr>
                                            
                                            {isExpanded && (
                                                <tr style={{ backgroundColor: '#f8fafc' }}>
                                                    <td colSpan={12} style={{ padding: '0' }}>
                                                        <div style={{ padding: '15px 40px', borderBottom: '2px solid #cbd5e1' }}>
                                                            {productList.length === 0 ? (
                                                                <p style={{ margin: 0, color: '#64748b', fontStyle: 'italic' }}>Sin productos registrados en este pedido.</p>
                                                            ) : (
                                                                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                                                    <thead style={{ backgroundColor: '#f1f5f9' }}>
                                                                        <tr>
                                                                            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>Producto</th>
                                                                            <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>Calibre</th>
                                                                            <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>Cajas (Entregadas / Solicitadas)</th>
                                                                            <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>Kilos/Caja</th>
                                                                            <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>Total Kilos</th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {productList.map((product, idx) => (
                                                                            <tr key={idx} style={{ borderBottom: idx === productList.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                                                                                <td style={{ padding: '8px 12px' }}>{product.nombre}</td>
                                                                                <td style={{ padding: '8px 12px' }}>{product.calibre}</td>
                                                                                <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                                                                    <span style={{ color: product.totalCajas < product.totalCajasSolicitadas ? '#d97706' : '#16a34a', fontWeight: 'bold' }}>
                                                                                        {product.totalCajas}
                                                                                    </span> / {product.totalCajasSolicitadas}
                                                                                </td>
                                                                                <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(product.totalCajas > 0 ? (product.totalKilos / product.totalCajas) : 0).toFixed(2)}</td>
                                                                                <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '500' }}>{product.totalKilos.toFixed(2)}</td>
                                                                            </tr>
                                                                        ))}
                                                                    </tbody>
                                                                </table>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Despachos;
