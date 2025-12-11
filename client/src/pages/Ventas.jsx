import { useState, useEffect } from 'react';
import axios from '../services/root.service.js';
import Table from '../components/Table';
import PopupDetalleVenta from '../components/PopupDetalleVenta';
import PopupDespacho from '../components/PopupDespacho';
import { format as formatTempo } from "@formkit/tempo";
import '../styles/users.css';
import '../styles/table.css';

const Ventas = () => {
    const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'history'
    const [availableStock, setAvailableStock] = useState([]);
    const [cart, setCart] = useState([]);
    const [salesHistory, setSalesHistory] = useState([]);
    const [selectedVenta, setSelectedVenta] = useState(null);
    const [isDetailOpen, setIsDetailOpen] = useState(false);
    const [isDespachoOpen, setIsDespachoOpen] = useState(false);

    useEffect(() => {
        if (activeTab === 'stock') {
            fetchStock();
        } else {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchStock = async () => {
        try {
            const response = await axios.get('/produccion/stock/contenedores');
            // Safe check
            const data = response.data.data;
            setAvailableStock(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error fetching stock", error);
            setAvailableStock([]);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await axios.get('/ventas');
            const rawData = response.data.data;
            if (!Array.isArray(rawData)) {
                console.error("Data received is not an array:", rawData);
                setSalesHistory([]);
                return;
            }
            const data = rawData.map(v => ({
                id: v.id,
                fecha: formatTempo(v.fecha, "DD-MM-YYYY HH:mm"),
                cliente: v.cliente,
                guia: v.n_guia_despacho || '-',
                tipo: v.tipo_venta,
                totalItems: v.productos?.length || 0,
                totalKilos: v.productos?.reduce((acc, curr) => acc + Number(curr.peso_neto_kg), 0).toFixed(2),
                details: v.productos // Guardamos el array original para el popup
            }));
            setSalesHistory(data);
        } catch (error) {
            console.error("Error fetching history", error);
        }
    };

    const handleAddToCart = (item, quantity) => {
        if (!quantity || quantity <= 0) return alert("Ingrese una cantidad válida");
        if (quantity > item.totalKilos) return alert("No hay suficiente stock disponible");

        const existingItemIndex = cart.findIndex(c => c.definicionProductoId === item.definicionProductoId && c.contenedorId === item.contenedorId && c.calibre === item.calibre && c.loteCodigo === item.loteCodigo);

        if (existingItemIndex >= 0) {
            const newCart = [...cart];
            newCart[existingItemIndex].cantidad += Number(quantity);
            setCart(newCart);
        } else {
            setCart([...cart, {
                ...item,
                cantidad: Number(quantity)
            }]);
        }
    };

    const handleRemoveFromCart = (index) => {
        const newCart = [...cart];
        newCart.splice(index, 1);
        setCart(newCart);
    };

    const handleConfirmVenta = async (clientDataFromPopup) => {
        if (cart.length === 0) return alert("El carrito está vacío");

        try {
            const payload = {
                ...clientDataFromPopup,
                items: cart.map(item => ({
                    definicionProductoId: item.definicionProductoId,
                    contenedorId: item.contenedorId,
                    cantidad: item.cantidad,
                    calibre: item.calibre
                }))
            };

            await axios.post('/ventas', payload);
            alert("Venta registrada exitosamente");
            setCart([]);
            setIsDespachoOpen(false); // Close popup
            fetchStock();
        } catch (error) {
            console.error("Error creating venta", error);
            alert("Error al registrar venta: " + (error.response?.data?.message || error.message));
        }
    };

    const handleViewDetails = (row) => {
        setSelectedVenta(row);
        setIsDetailOpen(true);
    };

    const historyColumns = [
        { header: "ID Venta", accessor: "id" },
        { header: "Fecha", accessor: "fecha" },
        { header: "Cliente", accessor: "cliente" },
        { header: "N° Guía", accessor: "guia" },
        { header: "Tipo Venta", accessor: "tipo" },
        { header: "Total Kg", accessor: "totalKilos" },
        {
            header: "Items",
            accessor: "totalItems",
            render: (row) => (
                <button
                    style={{
                        background: 'transparent',
                        border: 'none',
                        padding: '5px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: '#333',
                        fontSize: '0.9rem'
                    }}
                    onClick={(e) => { e.stopPropagation(); handleViewDetails(row); }}
                    title="Ver Detalle"
                >
                    <span style={{ fontWeight: 'bold' }}>{row.totalItems}</span>
                    <span style={{ fontSize: '1.4em' }}>📄</span>
                </button>
            )
        }
    ];

    return (
        <div className="main-container">
            <div className="table-wrapper">
                <div className="top-table">
                    <h1 className="title-table">Ventas y Despacho</h1>

                    <div className="action-buttons">

                        <button
                            className="btn-new"
                            style={{
                                backgroundColor: activeTab === 'stock' ? '#003366' : '#e0e0e0',
                                color: activeTab === 'stock' ? '#fff' : '#333',
                                border: 'none'
                            }}
                            onClick={() => setActiveTab('stock')}
                        >
                            Stock en Contenedores
                        </button>
                        <button
                            className="btn-new"
                            style={{
                                backgroundColor: activeTab === 'history' ? '#003366' : '#e0e0e0',
                                color: activeTab === 'history' ? '#fff' : '#333',
                                border: 'none'
                            }}
                            onClick={() => setActiveTab('history')}
                        >
                            Registro de Ventas/Despachos
                        </button>
                    </div>
                </div>

                {activeTab === 'stock' ? (
                    <div style={{ marginTop: '20px' }}>
                        <h2 style={{ color: '#003366', marginTop: 0, borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Stock en Contenedores</h2>
                        <div className="table-container-native" style={{ cursor: 'default' }}>
                            <table className="samar-table">
                                <thead>
                                    <tr>
                                        <th>Lote</th>
                                        <th>Producto</th>
                                        <th>Calibre</th>
                                        <th style={{ textAlign: 'right' }}>Disp. (Kg)</th>
                                        <th>Contenedor</th>
                                        <th>Acción</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {availableStock.map((item, idx) => (
                                        <StockRow key={idx} item={item} onAdd={handleAddToCart} />
                                    ))}
                                    {availableStock.length === 0 && (
                                        <tr><td colSpan="6" className="no-data">No hay stock disponible.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (
                    /* Vista de Historial */
                    <div style={{ marginTop: '20px' }}>
                        <Table
                            columns={historyColumns}
                            data={salesHistory}
                        />
                    </div>
                )}
            </div>

            <PopupDetalleVenta
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                venta={selectedVenta}
            />

            <PopupDespacho
                isOpen={isDespachoOpen}
                onClose={() => setIsDespachoOpen(false)}
                cart={cart}
                onRemoveItem={handleRemoveFromCart}
                onConfirmVenta={handleConfirmVenta}
            />

            {activeTab === 'stock' && (
                <button
                    onClick={() => setIsDespachoOpen(true)}
                    style={{
                        position: 'fixed',
                        bottom: '30px',
                        right: '30px',
                        backgroundColor: cart.length > 0 ? '#007bff' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '60px',
                        height: '60px',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                        cursor: cart.length > 0 ? 'pointer' : 'default',
                        zIndex: 1000,
                        fontSize: '1.5rem',
                        transition: 'transform 0.2s',
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    disabled={cart.length === 0}
                    title="Ver Planilla"
                >
                    🛒
                    {cart.length > 0 && (
                        <span style={{
                            position: 'absolute',
                            top: '-5px',
                            right: '-5px',
                            backgroundColor: 'red',
                            color: 'white',
                            borderRadius: '50%',
                            padding: '2px 8px',
                            fontSize: '0.8rem',
                            fontWeight: 'bold'
                        }}>
                            {cart.length}
                        </span>
                    )}
                </button>
            )}
        </div>
    );
};

// Subcomponente para fila de stock con input
const StockRow = ({ item, onAdd }) => {
    const [qty, setQty] = useState('');

    const handleAdd = () => {
        if (!qty) return;
        onAdd(item, qty);
        setQty('');
    };

    return (
        <tr className="hover-row">
            <td>{item.loteCodigo}</td>
            <td style={{ fontWeight: '500' }}>{item.productoNombre}</td>
            <td>{item.calibre || '-'}</td>
            <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#155724' }}>{item.totalKilos}</td>
            <td>{item.ubicacionNombre}</td>
            <td style={{ display: 'flex', gap: '5px' }}>
                <input
                    type="number"
                    style={{ width: '80px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                    placeholder="kg"
                    value={qty}
                    onChange={e => setQty(e.target.value)}
                />
                <button
                    onClick={handleAdd}
                    style={{
                        background: 'none',
                        border: 'none',
                        color: '#007bff',
                        fontSize: '1.5rem',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        padding: '0 5px'
                    }}
                    title="Agregar"
                >
                    +
                </button>
            </td>
        </tr>
    );
};

export default Ventas;
