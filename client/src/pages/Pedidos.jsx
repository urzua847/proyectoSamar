import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../services/root.service.js';
import Table from '../components/Table';
import { format as formatTempo } from "@formkit/tempo";
import '../styles/users.css';
import '../styles/pedidos.css';
import { deleteManyProduccion } from '../services/envasado.service';
import { getClientes } from '../services/catalogos.service';
import { deleteDataAlert, showSuccessAlert, showErrorAlert, showToastSuccess, showToastError, showToastWarning } from '../helpers/sweetAlert';

const Pedidos = () => {
    // ... (Hooks y estados se mantienen igual) ...
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('stock');
    const [availableStock, setAvailableStock] = useState([]);
    const [cart, setCart] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);
    const [itemToAdd, setItemToAdd] = useState(null);
    const [isCartOpen, setIsCartOpen] = useState(false);

    // Filtros Stock
    const [filters, setFilters] = useState({
        lote: '',
        producto: '',
        ubicacion: ''
    });

    // Filtros Historial
    const [historialFilters, setHistorialFilters] = useState({
        cliente: '',
        fecha_desde: '',
        fecha_hasta: '',
        numero_guia: ''
    });

    // Clientes List
    const [clientesList, setClientesList] = useState([]);

    // Formulario Cabecera
    const [header, setHeader] = useState({
        cliente: '',
        numero_guia: ''
    });

    // Ref para prevenir doble clic en agregar al carrito
    const isAddingToCartRef = useRef(false);

    useEffect(() => {
        if (activeTab === 'stock') {
            fetchContenedorStock();
            if (clientesList.length === 0) {
                getClientes().then(data => setClientesList(data || []));
            }
        } else {
            fetchHistory();
        }
    }, [activeTab]);

    const [selectedIds, setSelectedIds] = useState([]);

    const fetchContenedorStock = async () => {
        try {
            const response = await axios.get('/envasado/stock/contenedores');
            const data = response.data.data || [];

            const formatted = data
                .filter(item => Number(item.totalKilos) > 0)
                .map((item, index) => ({
                    ...item,
                    id: `${item.loteCodigo}-${item.definicionProductoId}-${item.calibre || 'null'}-${index}`
                }));

            setAvailableStock(formatted);
        } catch (error) {
            console.error("Error fetching stock contenedores", error);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const rows = availableStock.filter(item => selectedIds.includes(item.id));
        const allIdsToDelete = rows.flatMap(r => r.ids || []);

        if (allIdsToDelete.length === 0) return;

        const result = await deleteDataAlert();
        if (result.isConfirmed) {
            const response = await deleteManyProduccion(allIdsToDelete);
            if (response.status === 'Success') {
                showSuccessAlert('Eliminado', 'Registros eliminados correctamente.');
                fetchContenedorStock();
                setSelectedIds([]);
            } else {
                showErrorAlert('Error', response.message || 'No se pudo eliminar.');
            }
        }
    };

    const handleDeleteRow = async (row) => {
        const idsToDelete = row.ids || [row.id];

        const result = await deleteDataAlert();
        if (result.isConfirmed) {
            const response = await deleteManyProduccion(idsToDelete);
            if (response.status === 'Success') {
                showSuccessAlert('Eliminado', 'Registro eliminado correctamente.');
                fetchContenedorStock();
            } else {
                showErrorAlert('Error', response.message || 'No se pudo eliminar el registro.');
            }
        }
    };

    const columnsStock = [
        { header: "Lote", accessor: "loteCodigo" },
        { header: "Especie", accessor: "especieNombre" },
        { header: "Producto", accessor: "productoNombre" },
        { header: "Calibre", accessor: "calibre" },
        { header: "Cajas Disp.", accessor: "totalCantidad", width: "100px", render: r => <div style={{ textAlign: 'center', fontWeight: 'bold' }}>{r.totalCantidad}</div> },
        { header: "Kg/Caja", render: r => <div style={{ textAlign: 'center' }}>{(Number(r.totalKilos) / (Number(r.totalCantidad) || 1)).toFixed(2)}</div> },
        { header: "Kilos Totales", accessor: "totalKilos", width: "120px", render: r => <div style={{ textAlign: 'right' }}>{r.totalKilos}</div> },
        { header: "Ubicación", accessor: "ubicacionNombre" },
        {
            header: "Acción",
            width: "140px",
            render: (row) => (
                <div onClick={e => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <StockActionCell item={row} onAdd={(qty) => handleAddToCart(row, qty)} />
                    {user?.rol === 'administrador' && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteRow(row);
                            }}
                            className="btn-icon-circle btn-icon-delete"
                            title="Eliminar"
                        >
                            🗑
                        </button>
                    )}
                </div>
            )
        }
    ];

    const fetchHistory = async () => {
        try {
            // Construir query params con filtros
            const params = new URLSearchParams();
            if (historialFilters.cliente) params.append('cliente', historialFilters.cliente);
            if (historialFilters.fecha_desde) params.append('fecha_desde', historialFilters.fecha_desde);
            if (historialFilters.fecha_hasta) params.append('fecha_hasta', historialFilters.fecha_hasta);
            if (historialFilters.numero_guia) params.append('numero_guia', historialFilters.numero_guia);

            const url = `/pedidos${params.toString() ? '?' + params.toString() : ''}`;
            const response = await axios.get(url);
            const responseData = response.data.data;
            const rawData = responseData.data || responseData;

            if (!Array.isArray(rawData)) {
                setOrderHistory([]);
                return;
            }
            const data = rawData.map(v => ({
                id: v.id,
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

    // Función para aplicar filtros
    const handleApplyFilters = () => {
        fetchHistory();
    };

    // Función para limpiar filtros
    const handleClearFilters = () => {
        setHistorialFilters({
            cliente: '',
            fecha_desde: '',
            fecha_hasta: '',
            numero_guia: ''
        });
        // Forzar refetch sin filtros
        setTimeout(() => fetchHistory(), 100);
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

    const handleAddToCart = (item, qtyBultos) => {
        // Prevenir doble clic
        if (isAddingToCartRef.current) {
            console.log('⚠️  Doble clic en agregar al carrito detectado y prevenido');
            return;
        }

        isAddingToCartRef.current = true;

        const pesoTotal = Number(item.totalKilos) || 0;
        const cajasTotal = Number(item.totalCantidad) || 1;
        const pesoPorCaja = pesoTotal / cajasTotal;
        const qtyToAdd = parseInt(qtyBultos);

        setCart(prev => {
            const existingItemIndex = prev.findIndex(c => c.id === item.id);
            if (existingItemIndex >= 0) {
                const currentQty = prev[existingItemIndex].cantidadBultos;
                const newQty = currentQty + qtyToAdd;
                if (item.totalCantidad && newQty > item.totalCantidad) {
                    showToastWarning(`Stock insuficiente. Total intentado: ${newQty}, Disponible: ${item.totalCantidad} bultos.`);
                    return prev;
                }
                const newCart = [...prev];
                updatedItem = { ...newCart[existingItemIndex] };
                updatedItem.cantidadBultos = newQty;
                updatedItem.subtotalKilos = (newQty * pesoPorCaja).toFixed(2);
                newCart[existingItemIndex] = updatedItem;
                showToastSuccess(`Actualizado pedido de ${item.productoNombre}`);
                return newCart;
            } else {
                if (item.totalCantidad && qtyToAdd > item.totalCantidad) {
                    showToastWarning(`Stock insuficiente. Disponible: ${item.totalCantidad} bultos.`);
                    return prev;
                }
                const kilosEstimados = (qtyToAdd * pesoPorCaja).toFixed(2);
                showToastSuccess(`Agregado a pedido: ${qtyToAdd} bultos`);
                return [...prev, {
                    ...item,
                    cantidadBultos: qtyToAdd,
                    subtotalKilos: kilosEstimados,
                    uniqueId: Date.now()
                }];
            }
        });

        // Reset del flag después de un delay
        setTimeout(() => {
            isAddingToCartRef.current = false;
        }, 300);
    };

    const handleRemoveFromCart = (uid) => setCart(prev => prev.filter(c => c.uniqueId !== uid));

    const handleConfirmPedido = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return showToastWarning("El carrito está vacío");
        if (!header.cliente || !header.numero_guia) return showToastWarning("Complete Cliente y N° Guía");
        try {
            const payload = {
                ...header,
                fecha: new Date(),
                items: cart.map(c => ({
                    productoId: !String(c.id).includes('-') ? c.id : undefined,
                    productoIds: c.ids || [],
                    cantidad_bultos: c.cantidadBultos
                }))
            };
            await axios.post('/pedidos', payload);
            showToastSuccess("Pedido registrado exitosamente!");
            setCart([]);
            setHeader({ ...header, numero_guia: '', cliente: '' });
            fetchContenedorStock();
            setIsCartOpen(false);
        } catch (error) {
            console.error(error);
            showToastError("Error al registrar: " + (error.response?.data?.message || error.message));
        }
    };

    const filteredStock = useMemo(() => {
        return availableStock.filter(item => {
            return (
                (item.loteCodigo || '').toLowerCase().includes(filters.lote.toLowerCase()) &&
                (item.productoNombre || '').toLowerCase().includes(filters.producto.toLowerCase()) &&
                (item.ubicacionNombre || '').toLowerCase().includes(filters.ubicacion.toLowerCase())
            );
        });
    }, [availableStock, filters]);

    const totalKilosGlobal = cart.reduce((acc, curr) => acc + parseFloat(curr.subtotalKilos), 0).toFixed(2);
    const totalBultosGlobal = cart.reduce((acc, curr) => acc + parseInt(curr.cantidadBultos), 0);

    const historyColumns = [
        { header: "ID", accessor: "id", width: "60px" },
        { header: "Fecha", accessor: "fecha", width: "120px" },
        { header: "Cliente", accessor: "cliente", width: "150px" },
        { header: "Guía", accessor: "guia", width: "100px" },
        {
            header: "Productos",
            width: "200px",
            render: (row) => {
                const products = row.details || [];
                if (products.length === 0) return <span style={{ color: '#94a3b8' }}>Sin productos</span>;

                // Agrupar por producto + calibre único
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

                return (
                    <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                        {productList.map((p, idx) => (
                            <div key={idx} style={{ marginBottom: idx < productList.length - 1 ? '4px' : '0' }}>
                                {p.nombre} - {p.totalCajas} - {p.totalKilos.toFixed(2)}
                            </div>
                        ))}
                    </div>
                );
            }
        },
        {
            header: "Calibre",
            width: "120px",
            render: (row) => {
                const products = row.details || [];
                if (products.length === 0) return <span style={{ color: '#94a3b8' }}>-</span>;

                // Agrupar por producto + calibre único (mismo orden que columna productos)
                const groupedProducts = products.reduce((acc, p) => {
                    const nombre = p.producto?.definicion?.nombre || 'N/A';
                    const calibre = p.tipo_formato || 'N/A';
                    const key = `${nombre}_${calibre}`;

                    if (!acc[key]) {
                        acc[key] = {
                            calibre
                        };
                    }
                    return acc;
                }, {});

                const calibreList = Object.values(groupedProducts);

                return (
                    <div style={{ fontSize: '0.85rem', lineHeight: '1.6' }}>
                        {calibreList.map((p, idx) => (
                            <div key={idx} style={{ marginBottom: idx < calibreList.length - 1 ? '4px' : '0' }}>
                                {p.calibre}
                            </div>
                        ))}
                    </div>
                );
            }
        },
        { header: "Total Cajas", accessor: "totalItems", width: "100px" },
        { header: "Total Kilos", accessor: "totalKilos", width: "100px" },
        { header: "Estado", accessor: "estado", width: "100px" }
    ];

    return (
        <div className="main-container" style={{ position: 'relative' }}>
            <div className="table-wrapper">
                <div className="top-table" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <h1 className="title-table" style={{ margin: 0 }}>Gestión de Contenedores</h1>
                        <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setActiveTab('stock')}
                                className={`tab-button ${activeTab === 'stock' ? 'tab-button--active' : 'tab-button--inactive'}`}
                            >
                                <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>+</span> Nuevo Pedido
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`tab-button ${activeTab === 'history' ? 'tab-button--active' : 'tab-button--inactive'}`}
                            >
                                Historial
                            </button>
                        </div>
                    </div>

                    {activeTab === 'stock' && selectedIds.length > 0 && user?.rol === 'administrador' && (
                        <button
                            onClick={handleBulkDelete}
                            className="btn-delete"
                            style={{ alignSelf: 'flex-end', backgroundColor: '#eab308' }}
                            title="Devuelve los bultos seleccionados a la Cámara origen"
                        >
                            Devolver a Cámara ({selectedIds.length})
                        </button>
                    )}
                </div>

                {activeTab === 'stock' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: isCartOpen ? '1.2fr 0.8fr' : '1fr', gap: '20px', marginTop: '20px', transition: 'grid-template-columns 0.3s ease' }}>
                        <div className="stock-section">
                            <h3 style={{ color: '#003366', marginTop: '15px', marginBottom: '10px', fontSize: '1.1rem' }}>Inventario Disponble</h3>
                            <div className="table-container-box">
                                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                                    <input
                                        placeholder="Filtrar Lote..."
                                        value={filters.lote}
                                        onChange={e => setFilters({ ...filters, lote: e.target.value })}
                                        className="search-input"
                                    />
                                    <input
                                        placeholder="Filtrar Producto..."
                                        value={filters.producto}
                                        onChange={e => setFilters({ ...filters, producto: e.target.value })}
                                        className="search-input"
                                    />
                                    <select
                                        value={filters.ubicacion}
                                        onChange={e => setFilters({ ...filters, ubicacion: e.target.value })}
                                        className="search-input"
                                    >
                                        <option value="">Todas las ubicaciones...</option>
                                        {[...new Set(availableStock.map(i => i.ubicacionNombre).filter(Boolean))].sort().map(u => (
                                            <option key={u} value={u}>{u}</option>
                                        ))}
                                    </select>
                                    <button
                                        onClick={() => setFilters({ lote: '', producto: '', ubicacion: '' })}
                                        className="btn-cancel"
                                        style={{ padding: '6px 14px', whiteSpace: 'nowrap' }}
                                    >
                                        Limpiar
                                    </button>
                                </div>

                                <Table
                                    columns={columnsStock}
                                    data={filteredStock}
                                    multiSelect={true}
                                    selectedIds={selectedIds}
                                    onSelectionChange={setSelectedIds}
                                />
                            </div>
                        </div>

                        {isCartOpen && (
                            <div className="order-panel">
                                <div className="order-panel__header">
                                    <h3>🛒 Detalle del Pedido</h3>
                                    <button onClick={() => setIsCartOpen(false)} className="btn-close-x">&times;</button>
                                </div>

                                <div className="order-items-container">
                                    <table className="samar-table">
                                        <thead>
                                            <tr>
                                                <th>Item</th>
                                                <th>Cajas</th>
                                                <th>Kg</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {cart.map(c => (
                                                <tr key={c.uniqueId}>
                                                    <td>
                                                        <span style={{ fontWeight: 600 }}>{c.productoNombre}</span> <span style={{ color: '#64748b' }}>({c.calibre})</span>
                                                        <br />
                                                        <small style={{ color: '#94a3b8' }}>{c.loteCodigo}</small>
                                                    </td>
                                                    <td style={{ textAlign: 'center' }}>{c.cantidadBultos}</td>
                                                    <td style={{ textAlign: 'center' }}>{c.subtotalKilos}</td>
                                                    <td style={{ textAlign: 'center' }}>
                                                        <button onClick={() => handleRemoveFromCart(c.uniqueId)} className="btn-remove-small" title="Quitar">
                                                            ✕
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {cart.length === 0 && (
                                                <tr>
                                                    <td colSpan="4" style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                                                        No hay items seleccionados
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div>
                                    <div className="order-summary__totals">
                                        <span>Total Cajas: {totalBultosGlobal}</span>
                                        <span>Total Kg: {totalKilosGlobal}</span>
                                    </div>

                                    <form onSubmit={handleConfirmPedido} style={{ display: 'grid', gap: '15px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 600 }}>Cliente</label>
                                            <select
                                                required
                                                value={header.cliente}
                                                onChange={e => setHeader({ ...header, cliente: e.target.value })}
                                                className="search-input"
                                                style={{ width: '100%', padding: '10px' }}
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {clientesList.map(c => (
                                                    <option key={c.id} value={c.nombre}>{c.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 600 }}>N° Guía Despacho</label>
                                            <input
                                                required
                                                placeholder="Ej: 123456"
                                                value={header.numero_guia}
                                                onChange={e => setHeader({ ...header, numero_guia: e.target.value })}
                                                className="search-input"
                                                style={{ width: '100%', padding: '10px' }}
                                            />
                                        </div>

                                        <button type="submit" disabled={cart.length === 0} className="btn-save" style={{ marginTop: '10px', padding: '12px' }}>
                                            Confirmar Pedido
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
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
                            />
                            <input
                                type="date"
                                value={historialFilters.fecha_hasta}
                                onChange={e => setHistorialFilters({ ...historialFilters, fecha_hasta: e.target.value })}
                                className="search-input"
                                title="Fecha hasta"
                            />
                            <input
                                type="text"
                                placeholder="N° Guía..."
                                value={historialFilters.numero_guia}
                                onChange={e => setHistorialFilters({ ...historialFilters, numero_guia: e.target.value })}
                                className="search-input"
                            />
                            <button onClick={handleApplyFilters} className="btn-new" style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
                                Buscar
                            </button>
                            <button onClick={handleClearFilters} className="btn-cancel" style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
                                Limpiar
                            </button>
                            <button onClick={handleExportExcel} className="btn-new" style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
                                Exportar Excel
                            </button>
                            <button onClick={handleExportPDF} className="btn-delete" style={{ padding: '8px 16px', whiteSpace: 'nowrap' }}>
                                Exportar PDF
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
                                    {orderHistory.map((pedido) => {
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
                )}
            </div>

            {activeTab === 'stock' && !isCartOpen && (
                <button
                    onClick={() => setIsCartOpen(true)}
                    className="floating-cart-btn"
                >
                    🛒 Ver Pedido <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px' }}>{totalBultosGlobal}</span>
                </button>
            )}

            {itemToAdd && (
                <AddCartPopup
                    item={itemToAdd}
                    onClose={() => setItemToAdd(null)}
                    onConfirm={(qty) => {
                        handleAddToCart(itemToAdd, qty);
                        setItemToAdd(null);
                        setIsCartOpen(true);
                    }}
                />
            )}
        </div>
    );
};

const StockActionCell = ({ item, onAdd }) => {
    const [qty, setQty] = useState('');

    const handleAdd = () => {
        if (!qty || Number(qty) <= 0) return showToastWarning("Ingrese cantidad válida");
        if (Number(qty) > Number(item.totalCantidad)) return showToastWarning("Cantidad excede stock disponible");
        onAdd(Number(qty));
        setQty('');
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
                className="input-qty-stock"
                onClick={(e) => e.stopPropagation()}
            />
            <button
                onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                className="btn-add-stock"
                title="Agregar al pedido"
            >
                +
            </button>
        </div>
    );
};

const AddCartPopup = ({ item, onClose, onConfirm }) => {
    const [qty, setQty] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!qty || Number(qty) <= 0) return showToastWarning("Ingrese cantidad válida");
        if (Number(qty) > Number(item.totalCantidad)) return showToastWarning("Cantidad excede stock disponible");
        onConfirm(Number(qty));
    };

    return (
        <div className="bg">
            <div className="popup" style={{ width: '400px', border: '2px solid #003366' }}>
                <button className='btn-close-x' onClick={onClose}>&times;</button>
                <h3 style={{ color: '#003366' }}>Agregar al Pedido</h3>
                <div style={{ margin: '20px 0' }}>
                    <p><strong>Producto:</strong> {item.productoNombre}</p>
                    <p><strong>Lote:</strong> {item.loteCodigo}</p>
                    <p><strong>Disponibles:</strong> {item.totalCantidad} cajas</p>

                    <form onSubmit={handleSubmit} style={{ marginTop: '15px' }}>
                        <label style={{ display: 'block', marginBottom: '5px' }}>Cantidad a agregar:</label>
                        <input
                            type="number"
                            autoFocus
                            value={qty}
                            onChange={e => setQty(e.target.value)}
                            className="form-control"
                            placeholder="Ej: 10"
                            style={{ width: '100%', padding: '10px', fontSize: '1.1rem' }}
                        />
                        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={onClose} className="btn-cancel">Cancelar</button>
                            <button type="submit" className="btn-save">Confirmar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};



export default Pedidos;
