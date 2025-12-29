import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../services/root.service.js';
import Table from '../components/Table';
import { format as formatTempo } from "@formkit/tempo";
import '../styles/users.css';
import '../styles/table.css';
import '../styles/popup.css';
import { deleteManyProduccion } from '../services/envasado.service';
import { getClientes } from '../services/catalogos.service';
import { deleteDataAlert, showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';



const Pedidos = () => {
    // Estado Principal
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

    // Clientes List
    const [clientesList, setClientesList] = useState([]);

    // Formulario Cabecera
    const [header, setHeader] = useState({
        cliente: '',
        numero_guia: ''
    });

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
                            className="btn-delete"
                            title="Eliminar"
                            style={{
                                padding: '0', borderRadius: '50%', width: '30px', height: '30px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                backgroundColor: '#dc3545', border: 'none', color: 'white', fontSize: '1rem',
                                cursor: 'pointer'
                            }}
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


        const pesoTotal = Number(item.totalKilos) || 0;
        const cajasTotal = Number(item.totalCantidad) || 1;
        const pesoPorCaja = pesoTotal / cajasTotal;
        const kilosEstimados = (qtyBultos * pesoPorCaja).toFixed(2);

        if (item.totalCantidad && qtyBultos > item.totalCantidad) {
            return alert(`Stock insuficiente. Disponible: ${item.totalCantidad} bultos.`);
        }

        setCart(prev => [...prev, {
            ...item,
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
                items: cart.map(c => {
                    const isComposite = String(c.id).includes('-');
                    return {
                        productoId: !isComposite ? c.id : undefined,
                        productoIds: c.ids || [],
                        cantidad_bultos: c.cantidadBultos
                    };
                })
            };

            await axios.post('/pedidos', payload);
            alert("Pedido registrado exitosamente!");
            setCart([]);
            setHeader({ ...header, numero_guia: '', cliente: '' });
            fetchContenedorStock();
            setIsCartOpen(false);
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
        { header: "Cajas", accessor: "totalItems" },
        { header: "Kilos", accessor: "totalKilos" },
        { header: "Estado", accessor: "estado" }
    ];

    return (
        <div className="main-container" style={{ position: 'relative' }}>
            <div className="table-wrapper">
                <div className="top-table">

                    <h1 className="title-table">Gestión de Contenedores</h1>
                    <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setActiveTab('stock')}
                            className={activeTab === 'stock' ? 'btn-new' : ''}
                            style={activeTab !== 'stock' ? { backgroundColor: '#ccc' } : {}}
                        >
                            <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>+</span> Nuevo Pedido
                        </button>
                        <button
                            onClick={() => setActiveTab('history')}
                            className={activeTab === 'history' ? 'btn-edit' : ''}
                            style={activeTab !== 'history' ? { backgroundColor: '#ccc' } : {}}
                        >
                            📋 Historial
                        </button>
                    </div>

                    {activeTab === 'stock' && selectedIds.length > 0 && user?.rol === 'administrador' && (
                        <button
                            onClick={handleBulkDelete}
                            className="btn-delete"
                        >
                            Eliminar ({selectedIds.length})
                        </button>
                    )}
                </div>

                {activeTab === 'stock' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: isCartOpen ? '1.2fr 0.8fr' : '1fr', gap: '20px', marginTop: '20px', transition: 'grid-template-columns 0.3s ease' }}>

                        <div className="panel" style={{ background: 'white', padding: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ color: '#003366', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>Inventario en Contenedores</h3>

                            <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
                                <input placeholder="Lote..." value={filters.lote} onChange={e => setFilters({ ...filters, lote: e.target.value })} className="search-input" />
                                <input placeholder="Producto..." value={filters.producto} onChange={e => setFilters({ ...filters, producto: e.target.value })} className="search-input" />
                            </div>

                            <div style={{ marginTop: '10px' }}>
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
                                        <select
                                            required
                                            value={header.cliente}
                                            onChange={e => setHeader({ ...header, cliente: e.target.value })}
                                            className="form-control"
                                            style={{ padding: '8px', fontSize: '1rem' }}
                                        >
                                            <option value="">-- Seleccionar Cliente --</option>
                                            {clientesList.map(c => (
                                                <option key={c.id} value={c.nombre}>{c.nombre}</option>
                                            ))}
                                        </select>
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
        if (!qty || Number(qty) <= 0) return alert("Ingrese cantidad válida");
        if (Number(qty) > Number(item.totalCantidad)) return alert("Cantidad excede stock disponible");
        onAdd(qty);
        setQty('');
    };

    return (
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
    );
};

const AddCartPopup = ({ item, onClose, onConfirm }) => {
    const [qty, setQty] = useState('');

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
