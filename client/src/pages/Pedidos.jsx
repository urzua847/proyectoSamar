import { useState, useEffect, useMemo } from 'react';
import axios from '../services/root.service.js';
import Table from '../components/Table';
import { format as formatTempo } from "@formkit/tempo";
import '../styles/users.css';
import '../styles/table.css';
import '../styles/popup.css';

const Pedidos = () => {
    // Estado Principal
    const [activeTab, setActiveTab] = useState('stock'); // 'stock' | 'history'
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

    // Formulario Cabecera
    const [header, setHeader] = useState({
        cliente: '',
        numero_guia: ''
    });

    useEffect(() => {
        if (activeTab === 'stock') {
            fetchContenedorStock();
        } else {
            fetchHistory();
        }
    }, [activeTab]);

    const fetchContenedorStock = async () => {
        try {

            const response = await axios.get('/produccion/stock/contenedores');
            const data = response.data.data || [];


            // Filtro local > 0 kilos
            setAvailableStock(data.filter(item => Number(item.totalKilos) > 0));
        } catch (error) {
            console.error("Error fetching stock contenedores", error);
        }
    };

    const fetchHistory = async () => {
        try {
            const response = await axios.get('/pedidos');
            const rawData = response.data.data;
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
                // Sumar kilos de detalles
                totalKilos: v.detalles?.reduce((acc, curr) => acc + Number(curr.kilos_totales), 0).toFixed(2),
                details: v.detalles
            }));
            setOrderHistory(data);
        } catch (error) {
            console.error("Error fetching history", error);
        }
    };

    // --- LÓGICA DE NEGOCIO CLIENTE --- //
    const parseWeightFromFormat = (format) => {
        if (!format) return 0;
        const match = format.match(/(\d+(?:\.\d+)?)\s*(kg|grs)/i);
        if (match) {
            const val = parseFloat(match[1]);
            const unit = match[2].toLowerCase();
            return unit === 'grs' ? val / 1000 : val;
        }
        return 0;
    };

    const handleAddToCart = (item, qtyBultos) => {


        // Calcular kilos reales (Peso Promedio por Caja)
        const pesoTotal = Number(item.totalKilos) || 0;
        const cajasTotal = Number(item.totalCantidad) || 1;
        const pesoPorCaja = pesoTotal / cajasTotal;
        const kilosEstimados = (qtyBultos * pesoPorCaja).toFixed(2);

        // Validar Stock (aprox por kilos o bultos si tenemos el dato)
        // item.totalCantidad = bultos disponibles?
        if (item.totalCantidad && qtyBultos > item.totalCantidad) {
            return alert(`Stock insuficiente. Disponible: ${item.totalCantidad} bultos.`);
        }

        // Agregar
        setCart(prev => [...prev, {
            ...item, // contiene definicionProductoId, loteCodigo, etc
            cantidadBultos: parseInt(qtyBultos),
            subtotalKilos: kilosEstimados,
            uniqueId: Date.now()
        }]);
    };

    const handleRemoveFromCart = (uid) => {
        setCart(prev => prev.filter(c => c.uniqueId !== uid));
    };

    const handleConfirmPedido = async (e) => {
        e.preventDefault();
        if (cart.length === 0) return alert("El carrito está vacío");
        if (!header.cliente || !header.numero_guia) return alert("Complete Cliente y N° Guía");

        try {
            const payload = {
                ...header,
                fecha: new Date(),
                items: cart.map(c => ({
                    productoId: c.id || (c.ids && c.ids[0]), // Legacy/Fallback
                    productoIds: c.ids || (c.id ? [c.id] : []), // New: List of IDs
                    cantidad_bultos: c.cantidadBultos
                }))
            };

            await axios.post('/pedidos', payload);
            alert("Pedido registrado exitosamente!");
            setCart([]);
            setHeader({ ...header, numero_guia: '', cliente: '' });
            fetchContenedorStock();
            setIsCartOpen(false); // Close cart on success
        } catch (error) {
            console.error(error);
            alert("Error al registrar: " + (error.response?.data?.message || error.message));
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
        { header: "ID", accessor: "id" },
        { header: "Fecha", accessor: "fecha" },
        { header: "Cliente", accessor: "cliente" },
        { header: "Guía", accessor: "guia" },
        { header: "Cajas", accessor: "totalItems" }, // Approximate if 1 item = 1 row? No, details count.
        { header: "Kilos", accessor: "totalKilos" },
        { header: "Estado", accessor: "estado" }
    ];

    return (
        <div className="main-container" style={{ position: 'relative' }}>
            <div className="table-wrapper">
                <div className="top-table">
                    <h1 className="title-table">Gestión de Pedidos</h1>
                    <div className="action-buttons">
                        <button
                            className="btn-new"
                            style={{ background: activeTab === 'stock' ? '#003366' : '#ccc' }}
                            onClick={() => setActiveTab('stock')}
                        >
                            Nuevo Pedido (Contenedores)
                        </button>
                        <button
                            className="btn-new"
                            style={{ background: activeTab === 'history' ? '#003366' : '#ccc' }}
                            onClick={() => setActiveTab('history')}
                        >
                            Historial
                        </button>
                    </div>
                </div>

                {activeTab === 'stock' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: isCartOpen ? '1.2fr 0.8fr' : '1fr', gap: '20px', marginTop: '20px', transition: 'grid-template-columns 0.3s ease' }}>

                        {/* LEFT: STOCK */}
                        <div className="panel" style={{ background: 'white', padding: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#003366', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Inventario en Contenedores</h3>

                            {/* Filtros */}
                            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                                <input placeholder="Lote..." value={filters.lote} onChange={e => setFilters({ ...filters, lote: e.target.value })} className="search-input" />
                                <input placeholder="Producto..." value={filters.producto} onChange={e => setFilters({ ...filters, producto: e.target.value })} className="search-input" />
                            </div>

                            <div className="table-container-native">
                                <table className="samar-table">
                                    <thead>
                                        <tr>
                                            <th>Lote</th>
                                            <th>Producto</th>
                                            <th>Formato</th>
                                            <th style={{ textAlign: 'center' }}>Cajas Disp.</th>
                                            <th style={{ textAlign: 'center' }}>Kg/Caja</th>
                                            <th style={{ textAlign: 'right' }}>Kilos Totales</th>
                                            <th>Ubicación</th>
                                            <th>Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredStock.map((item, i) => (
                                            <StockRow
                                                key={i}
                                                item={item}
                                                onAdd={(qty) => handleAddToCart(item, qty)}
                                            />
                                        ))}
                                        {filteredStock.length === 0 && <tr><td colSpan="8" className="no-data">No hay stock en contenedores.</td></tr>}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* RIGHT: CART (Conditional Render) */}
                        {isCartOpen && (
                            <div className="panel" style={{ background: '#f9f9f9', padding: '15px', display: 'flex', flexDirection: 'column', height: 'fit-content', borderLeft: '4px solid #003366' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h3 style={{ color: '#003366', margin: 0 }}>Detalle Pedido</h3>
                                    <button onClick={() => setIsCartOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✖</button>
                                </div>

                                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
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
                                                    <td>{c.productoNombre} ({c.calibre})<br /><small>{c.loteCodigo}</small></td>
                                                    <td style={{ textAlign: 'center' }}>{c.cantidadBultos}</td>
                                                    <td style={{ textAlign: 'center' }}>{c.subtotalKilos}</td>
                                                    <td><button onClick={() => handleRemoveFromCart(c.uniqueId)} style={{ color: 'red', border: 'none', background: 'none' }}>X</button></td>
                                                </tr>
                                            ))}
                                            {cart.length === 0 && <tr><td colSpan="4" style={{ textAlign: 'center', fontStyle: 'italic', padding: '20px' }}>Carrito vacío</td></tr>}
                                        </tbody>
                                    </table>
                                </div>

                                <div style={{ borderTop: '2px solid #ddd', paddingTop: '15px', marginTop: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '1.1rem' }}>
                                        <span>Total Cajas: {totalBultosGlobal}</span>
                                        <span>Total Kg: {totalKilosGlobal}</span>
                                    </div>

                                    <form onSubmit={handleConfirmPedido} style={{ marginTop: '15px', display: 'grid', gap: '10px' }}>
                                        <input required placeholder="Nombre Cliente" value={header.cliente} onChange={e => setHeader({ ...header, cliente: e.target.value })} style={{ padding: '8px' }} />
                                        <input required placeholder="N° Guía Despacho" value={header.numero_guia} onChange={e => setHeader({ ...header, numero_guia: e.target.value })} style={{ padding: '8px' }} />

                                        <button type="submit" disabled={cart.length === 0} className="btn-new" style={{ width: '100%', background: cart.length ? '#003366' : '#ccc', color: 'white' }}>
                                            Confirmar Pedido
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ marginTop: '20px' }}>
                        <Table columns={historyColumns} data={orderHistory} />
                    </div>
                )}
            </div>

            {/* FLOATING CART TOGGLE BUTTON (If tab is stock) */}
            {activeTab === 'stock' && !isCartOpen && (
                <button
                    onClick={() => setIsCartOpen(true)}
                    style={{
                        position: 'fixed',
                        bottom: '30px',
                        right: '30px',
                        backgroundColor: '#003366',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50px',
                        padding: '15px 25px',
                        boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        fontSize: '1.1rem',
                        zIndex: 900
                    }}
                >
                    🛒 Ver Pedido ({totalBultosGlobal}) | {totalKilosGlobal}kg
                </button>
            )}

            {/* POPUP AGREGAR AL CARRITO */}
            {itemToAdd && (
                <AddCartPopup
                    item={itemToAdd}
                    onClose={() => setItemToAdd(null)}
                    onConfirm={(qty) => {
                        handleAddToCart(itemToAdd, qty);
                        setItemToAdd(null);
                        setIsCartOpen(true); // Open cart automatically when adding
                    }}
                />
            )}
        </div>
    );
};

const StockRow = ({ item, onAdd }) => {
    const [qty, setQty] = useState('');

    const handleAdd = () => {
        if (!qty || Number(qty) <= 0) return alert("Ingrese cantidad válida");
        if (Number(qty) > Number(item.totalCantidad)) return alert("Cantidad excede stock disponible");
        onAdd(qty);
        setQty('');
    };

    // Calcular Kilos Por Caja (Promedio)
    const count = Number(item.totalCantidad) || 1;
    const weight = Number(item.totalKilos) || 0;
    const avgWeight = (weight / count).toFixed(2);

    return (
        <tr className="hover-row">
            <td>{item.loteCodigo}</td>
            <td>{item.productoNombre}</td>
            <td>{item.calibre}</td>
            <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{item.totalCantidad}</td>
            <td style={{ textAlign: 'center' }}>{avgWeight}</td>
            <td style={{ textAlign: 'right' }}>{item.totalKilos}</td>
            <td>{item.ubicacionNombre}</td>
            <td style={{ textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                    <input
                        type="number"
                        min="1"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                        placeholder="0"
                        style={{ width: '60px', padding: '5px', textAlign: 'center' }}
                        onClick={(e) => e.stopPropagation()}
                    />
                    <button
                        onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#0056b3',
                            fontSize: '1.5rem',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            padding: '0 5px',
                            lineHeight: '1'
                        }}
                        title="Agregar"
                    >
                        +
                    </button>
                </div>
            </td>
        </tr>
    );
};

const AddCartPopup = ({ item, onClose, onConfirm }) => {
    const [qty, setQty] = useState('');

    // Auto-focus logic or simplistic
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!qty || Number(qty) <= 0) return alert("Ingrese cantidad válida");
        if (Number(qty) > Number(item.totalCantidad)) return alert("Cantidad excede stock disponible");
        onConfirm(qty);
    };

    return (
        <div className="bg">
            <div className="popup" style={{ width: '400px' }}>
                <button className='close' onClick={onClose}>X</button>
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
                            <button type="button" onClick={onClose} className="btn-edit" style={{ background: '#ccc', color: '#333' }}>Cancelar</button>
                            <button type="submit" className="btn-new">Confirmar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};



export default Pedidos;
