import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Table from '../components/Table';
import useGetProducciones from '../hooks/produccion/useGetProducciones';
import PopupEnvasado from '../components/produccion/PopupEnvasado';
import PopupTraslado from '../components/produccion/PopupTraslado';
import { deleteManyProduccion, deleteProduccion } from '../services/envasado.service';
import { deleteDataAlert, showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';
import '../styles/users.css';

const Produccion = () => {
    const { producciones, fetchAll } = useGetProducciones();
    const { user } = useAuth();

    const [isEnvasadoOpen, setIsEnvasadoOpen] = useState(false);
    const [isTrasladoOpen, setIsTrasladoOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const actualizarTodo = async () => {
        await fetchAll();
    };

    const handleDeleteRow = async (row) => {
        const target = row || selectedRow;
        if (!target) return;

        const result = await deleteDataAlert();
        if (result.isConfirmed) {
            let response;
            if (target.ids && target.ids.length > 0) {
                response = await deleteManyProduccion(target.ids);
            } else {
                response = await deleteProduccion(target.id);
            }
            if (response.status === 'Success') {
                showSuccessAlert('Eliminado', 'Registros eliminados correctamente.');
                actualizarTodo();
                setSelectedRow(null);
            } else {
                showErrorAlert('Error', response.message || 'No se pudo eliminar.');
            }
        }
    };

    const handleDelete = () => handleDeleteRow(selectedRow);

    const [selectedIds, setSelectedIds] = useState([]);

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const rows = producciones.filter(p => selectedIds.includes(p.id));
        const allIdsToDelete = rows.flatMap(r => r.ids || [r.id]);

        if (allIdsToDelete.length === 0) return;

        const result = await deleteDataAlert();
        if (result.isConfirmed) {
            const response = await deleteManyProduccion(allIdsToDelete);
            if (response.status === 'Success') {
                showSuccessAlert('Eliminado', 'Registros eliminados correctamente.');
                actualizarTodo();
                setSelectedIds([]);
            } else {
                showErrorAlert('Error', response.message || 'No se pudo eliminar todos los registros.');
            }
        }
    };

    const handleBulkTransfer = () => {
        if (selectedIds.length === 0) return;

        const newSelection = {};

        const rows = producciones.filter(p => selectedIds.includes(p.id));

        rows.forEach(row => {
            newSelection[row.id] = { qty: row.cantidad, row: row };
        });

        setTransferSelection(newSelection);
        setIsTrasladoOpen(true);
    };

    useEffect(() => {
        actualizarTodo();
    }, []);

    const [filtersStock, setFiltersStock] = useState({
        loteCodigo: '',
        orderHora: 'desc',
        producto: '',
        calibre: '',
        ubicacion: ''
    });

    const handleFilterStockChange = (e) => {
        const { name, value } = e.target;
        setFiltersStock(prev => ({ ...prev, [name]: value }));
    };

    const [isTransferMode, setIsTransferMode] = useState(false);
    const [transferSelection, setTransferSelection] = useState({});

    const handleTransferModeToggle = () => {
        setIsTransferMode(!isTransferMode);
        setTransferSelection({});
    };

    const handleTransferChange = (row, qty) => {
        const val = parseInt(qty);
        if (isNaN(val) || val < 0) return;
        if (val > row.cantidad) return;

        setTransferSelection(prev => {
            const copy = { ...prev };
            if (val === 0) {
                delete copy[row.id];
            } else {
                copy[row.id] = { qty: val, row: row };
            }
            return copy;
        });
    };

    const handleOpenTransferPopup = () => {
        if (Object.keys(transferSelection).length === 0) {
            return showErrorAlert('Error', 'Seleccione al menos un ítem para trasladar');
        }
        setIsTrasladoOpen(true);
    };

    const columnsProduccion = [
        { header: "Lote", accessor: "loteCodigo" },
        { header: "Especie", accessor: "materiaPrimaNombre" },
        { header: "Producto", accessor: "productoFinalNombre" },
        { header: "Calibre", accessor: "calibre" },
        { header: "Cantidad", accessor: "cantidad" },
        { header: "Kilos Totales", accessor: "peso_neto_kg" },
        { header: "Cámara", accessor: "ubicacionNombre" },
        { header: "Hora Ingreso", accessor: "horaIngreso" },
        ...(isTransferMode ? [{
            header: "Traslado (Cant.)",
            width: "140px",
            render: (row) => (
                <div onClick={(e) => e.stopPropagation()}>
                    <input
                        type="number"
                        min="0"
                        max={row.cantidad}
                        placeholder="0"
                        style={{
                            width: "80px",
                            padding: "5px",
                            border: transferSelection[row.id] ? "2px solid #ffc107" : "1px solid #ccc",
                            fontWeight: transferSelection[row.id] ? "bold" : "normal"
                        }}
                        onChange={(e) => handleTransferChange(row, e.target.value)}
                    />
                </div>
            )
        }] : []),
        {
            header: "Acciones",
            render: (row) => (
                <div style={{ display: 'flex', justifyContent: 'center' }}>
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

    const { uniqueLotes, uniqueProductos, uniqueUbicaciones } = useMemo(() => {
        if (!producciones) return { uniqueLotes: [], uniqueProductos: [], uniqueUbicaciones: [] };
        const lotes = [...new Set(producciones.map(p => p.loteCodigo).filter(Boolean))].sort();
        const productos = [...new Set(producciones.map(p => p.productoFinalNombre).filter(Boolean))].sort();
        const ubicaciones = [...new Set(producciones.map(p => p.ubicacionNombre).filter(Boolean))].sort();
        return { uniqueLotes: lotes, uniqueProductos: productos, uniqueUbicaciones: ubicaciones };
    }, [producciones]);

    const filteredProducciones = useMemo(() => {
        if (!producciones) return [];
        let filtered = producciones.filter(item => {
            const matchLote = (item.loteCodigo || '').toLowerCase().includes(filtersStock.loteCodigo.toLowerCase());
            const matchProducto = (item.productoFinalNombre || '').toLowerCase().includes(filtersStock.producto.toLowerCase());
            const matchCalibre = (item.calibre || '').toLowerCase().includes(filtersStock.calibre.toLowerCase());
            const matchUbicacion = (item.ubicacionNombre || '').toLowerCase().includes(filtersStock.ubicacion.toLowerCase());
            return matchLote && matchProducto && matchCalibre && matchUbicacion;
        });

        filtered.sort((a, b) => {
            if (filtersStock.orderHora === 'asc') return a.id - b.id;
            else return b.id - a.id;
        });
        return filtered;
    }, [producciones, filtersStock]);

    return (
        <div className="main-container">
            <div className="table-wrapper">
                <div className="top-table" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <h1 className="title-table" style={{ margin: 0 }}>Gestión de Producción</h1>

                        {/* ACTION BUTTONS (TOP RIGHT) */}
                        <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
                            <button
                                onClick={() => setIsEnvasadoOpen(true)}
                                className="btn-new"
                            >
                                <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>+</span> Ingresar Productos
                            </button>

                            {/* BULK ACTIONS */}
                            {selectedIds.length > 0 && (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    {user?.rol === 'administrador' && (
                                        <button
                                            onClick={handleBulkDelete}
                                            className="btn-delete"
                                            style={{
                                                padding: '10px 20px', borderRadius: '4px',
                                                border: 'none', fontWeight: 'bold'
                                            }}
                                        >
                                            Eliminar ({selectedIds.length})
                                        </button>
                                    )}
                                    <button
                                        onClick={handleBulkTransfer}
                                        className="btn-new"
                                        style={{
                                            backgroundColor: '#ffc107', color: '#000',
                                            padding: '10px 20px', borderRadius: '4px',
                                            border: 'none', fontWeight: 'bold'
                                        }}
                                    >
                                        Trasladar ({selectedIds.length})
                                    </button>
                                </div>
                            )}

                            {!isTransferMode && selectedIds.length === 0 && (
                                <button
                                    onClick={handleTransferModeToggle}
                                    className="btn-new"
                                    title="Modo Manual de Traslado (Cantidades parciales)"
                                    style={{
                                        backgroundColor: '#e0a800', color: '#000',
                                        padding: '10px 20px', borderRadius: '4px',
                                        border: 'none', fontWeight: 'bold'
                                    }}
                                >
                                    Traslado Manual
                                </button>
                            )}
                            {isTransferMode && (
                                <div style={{ display: 'flex', gap: '5px' }}>
                                    <button
                                        onClick={handleTransferModeToggle}
                                        className="btn-edit"
                                        style={{
                                            backgroundColor: '#6c757d', color: 'white',
                                            padding: '10px 20px', borderRadius: '4px',
                                            border: 'none', fontWeight: 'bold'
                                        }}
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleOpenTransferPopup}
                                        className="btn-new"
                                        style={{
                                            backgroundColor: '#ffc107', color: '#000',
                                            padding: '10px 20px', borderRadius: '4px',
                                            border: 'none', fontWeight: 'bold'
                                        }}
                                    >
                                        Confirmar
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <h3 style={{ color: '#003366', marginTop: '15px', marginBottom: '10px' }}>Inventario en Cámaras</h3>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <input
                        list="lotes-list"
                        name="loteCodigo"
                        placeholder="Lote..."
                        value={filtersStock.loteCodigo}
                        onChange={handleFilterStockChange}
                        className="search-input"
                    />
                    <datalist id="lotes-list">
                        {uniqueLotes.map(l => <option key={l} value={l} />)}
                    </datalist>

                    <input
                        list="productos-list"
                        name="producto"
                        placeholder="Producto..."
                        value={filtersStock.producto}
                        onChange={handleFilterStockChange}
                        className="search-input"
                    />
                    <datalist id="productos-list">
                        {uniqueProductos.map(p => <option key={p} value={p} />)}
                    </datalist>

                    <input
                        name="calibre"
                        placeholder="Calibre..."
                        value={filtersStock.calibre}
                        onChange={handleFilterStockChange}
                        className="search-input"
                    />

                    <input
                        list="ubicaciones-list"
                        name="ubicacion"
                        placeholder="Cámara..."
                        value={filtersStock.ubicacion}
                        onChange={handleFilterStockChange}
                        className="search-input"
                    />
                    <datalist id="ubicaciones-list">
                        {uniqueUbicaciones.map(u => <option key={u} value={u} />)}
                    </datalist>

                    <select
                        name="orderHora"
                        value={filtersStock.orderHora}
                        onChange={handleFilterStockChange}
                        className="search-input"
                        style={{ width: 'auto' }}
                    >
                        <option value="desc">Más Recientes</option>
                        <option value="asc">Más Antiguos</option>
                    </select>
                </div>

                <Table
                    columns={columnsProduccion}
                    data={filteredProducciones}
                    onRowClick={(row) => {
                        if (selectedRow && selectedRow.id === row.id) {
                            setSelectedRow(null);
                        } else {
                            setSelectedRow(row);
                        }
                    }}
                    selectedId={selectedRow?.id}
                    multiSelect={true}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                />
            </div>

            {/* --- POPUPS --- */}
            <PopupEnvasado
                show={isEnvasadoOpen}
                setShow={setIsEnvasadoOpen}
                onSuccess={actualizarTodo}
            />
            <PopupTraslado
                isOpen={isTrasladoOpen}
                onClose={() => setIsTrasladoOpen(false)}
                onTrasladoSuccess={() => {
                    actualizarTodo();
                    setIsTransferMode(false);
                    setTransferSelection({});
                    setSelectedIds([]);
                }}
                initialSelection={Object.values(transferSelection).map(x => x.row ? { ...x.row, cantidadTransfer: x.qty } : null).filter(Boolean)}
            />
        </div>
    );
};

export default Produccion;
