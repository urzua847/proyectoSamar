import { useState, useEffect, useMemo } from 'react';
import axios from '../services/root.service.js';
import { format as formatTempo } from "@formkit/tempo";
import '../styles/users.css';
import '../styles/pedidos.css';
import { showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';

const Despachos = () => {
    const [orderHistory, setOrderHistory] = useState([]);

    // Filtros locales
    const [historialFilters, setHistorialFilters] = useState({
        cliente: '',
        fecha_desde: '',
        fecha_hasta: '',
        numero_guia: ''
    });

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

            const data = rawData.map(v => ({
                id: v.id,
                fechaISO: v.fecha,  // guardamos la fecha original para comparar
                fecha: formatTempo(v.fecha, "DD-MM-YYYY HH:mm"),
                cliente: v.cliente,
                guia: v.numero_guia || '-',
                estado: v.estado,
                totalItems: v.detalles?.length || 0,
                totalKilos: v.detalles?.reduce((acc, curr) => acc + Number(curr.kilos_totales), 0).toFixed(2),
                details: v.detalles
            }));
            setOrderHistory(data);
        } catch (error) {
            console.error("Error fetching history", error);
        }
    };

    // Filtrado local instantáneo con useMemo
    const filteredHistory = useMemo(() => {
        return orderHistory.filter(item => {
            const matchCliente = !historialFilters.cliente ||
                (item.cliente || '').toLowerCase().includes(historialFilters.cliente.toLowerCase());

            const matchGuia = !historialFilters.numero_guia ||
                (item.guia || '').toLowerCase().includes(historialFilters.numero_guia.toLowerCase());

            const itemDate = item.fechaISO ? item.fechaISO.slice(0, 10) : '';
            const matchDesde = !historialFilters.fecha_desde || itemDate >= historialFilters.fecha_desde;
            const matchHasta = !historialFilters.fecha_hasta || itemDate <= historialFilters.fecha_hasta;

            return matchCliente && matchGuia && matchDesde && matchHasta;
        });
    }, [orderHistory, historialFilters]);

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
        <div className="main-container">
            <div className="table-wrapper">
                <div className="top-table" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h1 className="title-table" style={{ margin: 0 }}>Historial de Despachos</h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
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
                        <input
                            type="date"
                            value={historialFilters.fecha_desde}
                            onChange={e => setHistorialFilters({ ...historialFilters, fecha_desde: e.target.value })}
                            className="search-input"
                            title="Fecha desde"
                            placeholder="Desde..."
                        />
                        <input
                            type="date"
                            value={historialFilters.fecha_hasta}
                            onChange={e => setHistorialFilters({ ...historialFilters, fecha_hasta: e.target.value })}
                            className="search-input"
                            title="Fecha hasta"
                            placeholder="Hasta..."
                        />
                        <input
                            type="text"
                            placeholder="N° Guía..."
                            value={historialFilters.numero_guia}
                            onChange={e => setHistorialFilters({ ...historialFilters, numero_guia: e.target.value })}
                            className="search-input"
                        />
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
                                    <th style={{ width: '100px' }}>Guía</th>
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

                                    // Agrupar productos por nombre + calibre
                                    const groupedProducts = products.reduce((acc, p) => {
                                        const nombre = p.producto?.definicion?.nombre || 'N/A';
                                        const calibre = p.tipo_formato || 'N/A';
                                        const key = `${nombre}_${calibre}`;

                                        if (!acc[key]) {
                                            acc[key] = {
                                                nombre,
                                                calibre,
                                                totalCajas: 0,
                                                totalKilos: 0
                                            };
                                        }
                                        acc[key].totalCajas += parseFloat(p.cantidad_bultos) || 0;
                                        acc[key].totalKilos += parseFloat(p.kilos_totales) || 0;
                                        return acc;
                                    }, {});

                                    const productList = Object.values(groupedProducts);
                                    const rowCount = productList.length || 1;

                                    if (productList.length === 0) {
                                        return (
                                            <tr key={pedido.id}>
                                                <td>{pedido.id}</td>
                                                <td>{pedido.fecha}</td>
                                                <td>{pedido.cliente}</td>
                                                <td>{pedido.guia}</td>
                                                <td colSpan={4} style={{ textAlign: 'center', color: '#94a3b8' }}>Sin productos</td>
                                                <td style={{ textAlign: 'center' }}>{pedido.totalKilos}</td>
                                                <td style={{ textAlign: 'center' }}>{pedido.totalItems}</td>
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
                                        );
                                    }

                                    return productList.map((product, idx) => (
                                        <tr key={`${pedido.id}-${idx}`} style={{
                                            borderBottom: idx === productList.length - 1 ? '2px solid #cbd5e1' : 'none'
                                        }}>
                                            {idx === 0 && (
                                                <>
                                                    <td rowSpan={rowCount} style={{ verticalAlign: 'middle', fontWeight: '600' }}>
                                                        {pedido.id}
                                                    </td>
                                                    <td rowSpan={rowCount} style={{ verticalAlign: 'middle' }}>
                                                        {pedido.fecha}
                                                    </td>
                                                    <td rowSpan={rowCount} style={{ verticalAlign: 'middle' }}>
                                                        {pedido.cliente}
                                                    </td>
                                                    <td rowSpan={rowCount} style={{ verticalAlign: 'middle', fontWeight: '600', color: '#3b82f6' }}>
                                                        {pedido.guia}
                                                    </td>
                                                </>
                                            )}
                                            <td>{product.nombre}</td>
                                            <td>{product.calibre}</td>
                                            <td style={{ textAlign: 'center' }}>{product.totalCajas}</td>
                                            <td style={{ textAlign: 'center' }}>{(product.totalKilos / product.totalCajas).toFixed(2)}</td>
                                            <td style={{ textAlign: 'center' }}>{product.totalKilos.toFixed(2)}</td>
                                            {idx === 0 && (
                                                <>
                                                    <td rowSpan={rowCount} style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: '600' }}>
                                                        {pedido.totalKilos}
                                                    </td>
                                                    <td rowSpan={rowCount} style={{ verticalAlign: 'middle', textAlign: 'center', fontWeight: '600' }}>
                                                        {pedido.totalItems}
                                                    </td>
                                                    <td rowSpan={rowCount} style={{ verticalAlign: 'middle', textAlign: 'center' }}>
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
                                                </>
                                            )}
                                        </tr>
                                    ));
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
