import { useState, useEffect, useMemo, useRef, Fragment } from 'react';
import Swal from 'sweetalert2';
import { useAuth } from '../context/AuthContext';
import axios from '../services/root.service.js';
import { format as formatTempo } from "@formkit/tempo";
import '../styles/users.css';
import '../styles/pedidos.css';
import { deleteManyProduccion } from '../services/envasado.service';
import { getClientes, getProductos } from '../services/catalogos.service.js';
import { deleteDataAlert, showSuccessAlert, showErrorAlert, showToastSuccess, showToastError, showToastWarning } from '../helpers/sweetAlert';

// Componentes refactorizados
import StockTable from '../components/pedidos/StockTable';
import PedidosPendientesTable from '../components/pedidos/PedidosPendientesTable';
import ProgressiveForm from '../components/pedidos/ProgressiveForm';
import CartPanel from '../components/pedidos/CartPanel';
import Despachos from './Despachos';

const Pedidos = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('stock');
    const [availableStock, setAvailableStock] = useState([]);
    const [cart, setCart] = useState([]);
    const [orderHistory, setOrderHistory] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [expandedRows, setExpandedRows] = useState({});

    // Filtros Stock
    const [filters, setFilters] = useState({ lote: '', producto: '', ubicacion: '' });

    // Filtros Historial (ahora delegados a Despachos, pero si se usan localmente los dejamos)
    const [historialFilters, setHistorialFilters] = useState({ cliente: '', fecha_desde: '', fecha_hasta: '', numero_guia: '' });

    const [clientesList, setClientesList] = useState([]);
    const [header, setHeader] = useState({ cliente: '', tipo_documento: 'Guía de Despacho', numero_documento: '' });
    const isAddingToCartRef = useRef(false);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        if (activeTab === 'stock') {
            fetchHistory();
            getProductos().then(data => {
                const formatted = (data || []).map((item) => ({
                    ...item,
                    id: String(item.id),
                    calibresList: Array.isArray(item.calibres) ? item.calibres : (typeof item.calibres === 'string' ? item.calibres.split(',').map(c => c.trim()).filter(c => c !== '') : [])
                }));
                setAvailableStock(formatted);
            }).catch(console.error);
            if (clientesList.length === 0) {
                getClientes().then(data => setClientesList(data || []));
            }
        } else {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchHistory = async () => {
        try {
            const url = '/pedidos';
            const response = await axios.get(url);
            const rawData = response.data.data?.data || response.data.data;
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
                totalItems: v.detalles?.reduce((acc, curr) => acc + Number(curr.cantidad_bultos || 0), 0) || 0,
                totalKilos: v.detalles?.reduce((acc, curr) => acc + Number(curr.kilos_totales), 0).toFixed(2),
                details: (v.detalles || []).map(d => ({
                    ...d,
                    productoNombre: d.definicion_producto?.nombre || d.producto?.definicion?.nombre || 'N/A',
                    calibre: d.tipo_formato || d.producto?.calibre || 'N/A'
                })),
                cajasFisicas: v.cajasAsignadas || []
            }));
            setOrderHistory(data);
        } catch (error) {
            console.error("Error fetching history", error);
        }
    };

    const toggleRow = (id) => {
        setExpandedRows(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
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
                setSelectedIds([]);
            } else {
                showErrorAlert('Error', response.message || 'No se pudo eliminar.');
            }
        }
    };

    const handleLiberarCaja = async (pedidoId, cajaId) => {
        const result = await Swal.fire({
            title: '¿Liberar Caja?',
            text: `Esta caja volverá a Stock y se restará del pedido. ¿Continuar?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Sí, liberar'
        });
        
        if (result.isConfirmed) {
            try {
                const response = await axios.post(`/pedidos/${pedidoId}/liberar-caja`, { cajaId });
                if (response.data.status === 'Success') {
                    showSuccessAlert('Liberada', 'Caja devuelta a stock.');
                    fetchHistory();
                } else {
                    showErrorAlert('Error', response.data.message || 'No se pudo liberar la caja.');
                }
            } catch (error) {
                console.error("Error liberando caja:", error);
                showErrorAlert('Error', error.response?.data?.message || 'Error al liberar la caja');
            }
        }
    };

    const handleDeletePedido = async (pedidoId) => {
        const result = await deleteDataAlert();
        if (result.isConfirmed) {
            try {
                const response = await axios.delete('/pedidos/' + pedidoId);
                if (response.data.status === 'Success') {
                    showSuccessAlert('Eliminado', 'Pedido eliminado y stock restablecido correctamente.');
                    fetchHistory();
                } else {
                    showErrorAlert('Error', response.data.message || 'No se pudo eliminar el pedido.');
                }
            } catch (error) {
                console.error("Error deleting pedido:", error);
                showErrorAlert('Error', error.response?.data?.message || 'Error al eliminar el pedido');
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
            } else {
                showErrorAlert('Error', response.message || 'No se pudo eliminar el registro.');
            }
        }
    };

    const handleAddToCart = (item, calibre, qtyBultos, pesoCajaInput) => {
        if (!qtyBultos || parseInt(qtyBultos) <= 0) return;
        
        if (isAddingToCartRef.current) return;
        isAddingToCartRef.current = true;

        const qtyToAdd = parseInt(qtyBultos);
        const pCaja = parseFloat(pesoCajaInput || item.pesoCaja || 0); // Si viene de Progressive, usamos pesoCajaInput
        const uniqueCartId = `${item.id}-${calibre}-${Date.now()}`;

        setCart(prev => {
            showToastSuccess(`Agregado a pedido: ${qtyToAdd} cajas`);
            return [...prev, {
                ...item,
                calibreSeleccionado: calibre,
                cantidadBultos: qtyToAdd,
                pesoCaja: pCaja,
                subtotalKilos: (pCaja * qtyToAdd).toFixed(2),
                uniqueCartId: uniqueCartId
            }];
        });

        setTimeout(() => {
            isAddingToCartRef.current = false;
            setIsCartOpen(true);
        }, 100);
    };

    const handleRemoveFromCart = (uid) => setCart(prev => prev.filter(c => c.uniqueCartId !== uid));

    const handleConfirmPedido = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return showToastWarning("El carrito está vacío");
        if (!header.cliente || !header.numero_documento) return showToastWarning("Complete Cliente y N° Documento");
        try {
            const payload = {
                cliente: header.cliente,
                numero_guia: `${header.tipo_documento}: ${header.numero_documento}`,
                fecha: new Date(),
                items: cart.map(c => ({
                    definicionProductoId: parseInt(c.id),
                    tipo_formato: c.calibreSeleccionado,
                    peso_caja: parseFloat(c.pesoCaja),
                    cantidad_bultos: c.cantidadBultos
                }))
            };
            await axios.post('/pedidos', payload);
            showToastSuccess("Pedido registrado exitosamente!");
            setCart([]);
            setHeader({ ...header, numero_guia: '', cliente: '' });
            fetchHistory();
            setIsCartOpen(false);
            setActiveTab('history');
        } catch (error) {
            console.error(error);
            showToastError("Error al registrar: " + (error.response?.data?.message || error.message));
        }
    };

    const filteredStock = useMemo(() => {
        return availableStock.filter(item => {
            return (item.nombre || '').toLowerCase().includes(filters.producto.toLowerCase());
        });
    }, [availableStock, filters]);

    const totalBultosGlobal = cart.reduce((acc, curr) => acc + parseInt(curr.cantidadBultos), 0);
    const totalKilosGlobal = cart.reduce((acc, curr) => acc + parseFloat(curr.subtotalKilos || 0), 0).toFixed(2);

    return (
        <div className="main-container" style={{ position: 'relative' }}>
            <div className="table-wrapper">
                <div className="top-table" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                    <h1 className="title-table" style={{ margin: 0 }}>Gestión de Pedidos</h1>
                    <div className="action-buttons" style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                        <button
                            onClick={() => setActiveTab('stock')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: activeTab === 'stock' ? '#003366' : '#e2e8f0',
                                color: activeTab === 'stock' ? '#ffffff' : '#334155',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>+</span> Nuevo Pedido
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: activeTab === 'history' ? '#003366' : '#e2e8f0',
                                color: activeTab === 'history' ? '#ffffff' : '#334155',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Historial
                        </button>
                    </div>
                </div>

                {activeTab === 'stock' ? (
                    <>
                        <PedidosPendientesTable 
                            orderHistory={orderHistory} 
                            expandedRows={expandedRows} 
                            toggleRow={toggleRow} 
                            handleDeletePedido={handleDeletePedido} 
                            handleLiberarCaja={handleLiberarCaja}
                        />

                        <div style={{ display: 'grid', gridTemplateColumns: isCartOpen ? '1.2fr 0.8fr' : '1fr', gap: '20px', marginTop: '20px', transition: 'grid-template-columns 0.3s ease' }}>
                            
                            <ProgressiveForm 
                                availableStock={availableStock} 
                                onAddToCart={(prod, calibre, pCaja, cBultos) => handleAddToCart(prod, calibre, cBultos, pCaja)} 
                            />

                            <CartPanel 
                                cart={cart}
                                header={header}
                                setHeader={setHeader}
                                clientesList={clientesList}
                                handleRemoveFromCart={handleRemoveFromCart}
                                handleConfirmPedido={handleConfirmPedido}
                                isCartOpen={isCartOpen}
                                setIsCartOpen={setIsCartOpen}
                                totalBultosGlobal={totalBultosGlobal}
                                totalKilosGlobal={totalKilosGlobal}
                            />
                        </div>
                    </>
                ) : (
                    <div style={{ marginTop: '20px' }}>
                        <Despachos isEmbedded={true} />
                    </div>
                )}
            </div>

            {activeTab === 'stock' && !isCartOpen && (
                <button onClick={() => setIsCartOpen(true)} className="floating-cart-btn">
                    🛒 Ver Pedido <span style={{ background: 'rgba(255,255,255,0.2)', padding: '2px 8px', borderRadius: '12px' }}>{totalBultosGlobal}</span>
                </button>
            )}
        </div>
    );
};

export default Pedidos;
