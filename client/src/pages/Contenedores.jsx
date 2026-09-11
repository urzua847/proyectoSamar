import { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../services/root.service.js';
import Table from '../components/Table';
import '../styles/users.css';
import '../styles/pedidos.css';
import { deleteManyProduccion } from '../services/envasado.service';
import { getClientes } from '../services/catalogos.service';
import { deleteDataAlert, showSuccessAlert, showErrorAlert, showToastWarning, showToastSuccess, showToastError, confirmActionAlert } from '../helpers/sweetAlert';

const Contenedores = () => {
    const { user } = useAuth();
    const [availableStock, setAvailableStock] = useState([]);
    const [cart, setCart] = useState([]);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

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

    // Ref para prevenir doble clic en agregar al carrito
    const isAddingToCartRef = useRef(false);

    useEffect(() => {
        fetchContenedorStock();
        if (clientesList.length === 0) {
            getClientes().then(data => setClientesList(data || []));
        }
    }, []);

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

        const result = await confirmActionAlert(
            "¿Devolver a Cámara?",
            "Esta acción retirará los bultos seleccionados del contenedor y los devolverá a la cámara original.",
            "Sí, Devolver",
            "#eab308"
        );
        if (result.isConfirmed) {
            const response = await deleteManyProduccion(allIdsToDelete);
            if (response.status === 'Success') {
                showSuccessAlert('Devuelto', 'Registros devueltos a la cámara correctamente.');
                fetchContenedorStock();
                setSelectedIds([]);
            } else {
                showErrorAlert('Error', response.message || 'No se pudo eliminar.');
            }
        }
    };

    const handleDeleteRow = async (row) => {
        const idsToDelete = row.ids || [row.id];

        const result = await confirmActionAlert(
            "¿Devolver a Cámara?",
            "Esta acción retirará los bultos del contenedor y los devolverá a la cámara original.",
            "Sí, Devolver",
            "#eab308"
        );
        if (result.isConfirmed) {
            const response = await deleteManyProduccion(idsToDelete);
            if (response.status === 'Success') {
                showSuccessAlert('Devuelto', 'Registro devuelto a la cámara correctamente.');
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
                            className="btn-icon-circle"
                            style={{ backgroundColor: '#eab308', color: 'white', border: 'none', background: 'transparent' }}
                            title="Devolver a Cámara"
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M3 9l4-4m-4 4l4 4M3 9h14a5 5 0 0 1 0 10h-4"/>
                            </svg>
                        </button>
                    )}
                </div>
            )
        }
    ];

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
                const updatedItem = { ...newCart[existingItemIndex] };
                updatedItem.cantidadBultos = newQty;
                updatedItem.subtotalKilos = (newQty * pesoPorCaja).toFixed(2);
                newCart[existingItemIndex] = updatedItem;
                showToastSuccess(`Actualizada cantidad de ${item.productoNombre}`);
                return newCart;
            } else {
                if (item.totalCantidad && qtyToAdd > item.totalCantidad) {
                    showToastWarning(`Stock insuficiente. Disponible: ${item.totalCantidad} bultos.`);
                    return prev;
                }
                const kilosEstimados = (qtyToAdd * pesoPorCaja).toFixed(2);
                showToastSuccess(`Agregado a pedido: ${qtyToAdd} bultos de ${item.productoNombre}`);
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

    return (
        <div className="main-container" style={{ position: 'relative' }}>
            <div className="table-wrapper">
                <div className="top-table" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <h1 className="title-table" style={{ margin: 0 }}>Gestión de Contenedores</h1>
                    </div>

                    {selectedIds.length > 0 && user?.rol === 'administrador' && (
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

                <div style={{ display: 'grid', gridTemplateColumns: isCartOpen ? '1.2fr 0.8fr' : '1fr', gap: '20px', marginTop: '20px', transition: 'grid-template-columns 0.3s ease' }}>
                    <div className="stock-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', marginBottom: '10px' }}>
                            <h3 style={{ color: '#003366', margin: 0, fontSize: '1.1rem' }}>Inventario Disponible</h3>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                {!isCartOpen && (
                                    <button
                                        onClick={() => setIsCartOpen(true)}
                                        className="btn-new"
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                                    >
                                        🛒 Ver Pedido
                                        <span style={{ background: 'rgba(255,255,255,0.3)', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                                            {totalBultosGlobal}
                                        </span>
                                    </button>
                                )}
                                {isCartOpen && (
                                    <button
                                        onClick={() => setIsCartOpen(false)}
                                        className="btn-cancel"
                                    >
                                        Ocultar Pedido
                                    </button>
                                )}
                            </div>
                        </div>
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
                                <input
                                    placeholder="Filtrar Contenedor..."
                                    value={filters.ubicacion}
                                    onChange={e => setFilters({ ...filters, ubicacion: e.target.value })}
                                    className="search-input"
                                    list="ubicaciones-list"
                                />
                                <datalist id="ubicaciones-list">
                                    {[...new Set(availableStock.map(i => i.ubicacionNombre).filter(Boolean))].sort().map(u => (
                                        <option key={u} value={u} />
                                    ))}
                                </datalist>
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
            </div>

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

export default Contenedores;
