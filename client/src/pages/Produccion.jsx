import { useState, useMemo, useEffect } from 'react';
import Table from '../components/Table';
import useGetProducciones from '../hooks/produccion/useGetProducciones';
import PopupDesconche from '../components/produccion/PopupDesconche';
import PopupEnvasado from '../components/produccion/PopupEnvasado';
import PopupTraslado from '../components/produccion/PopupTraslado';
import { deleteProduccion, deleteManyProduccion } from '../services/produccion.service';
import { deleteDesconche } from '../services/desconche.service';
import { deleteDataAlert, showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';
import '../styles/users.css';

const Produccion = () => {
    const { producciones, desconches, fetchAll } = useGetProducciones();

    const [isDesconcheOpen, setIsDesconcheOpen] = useState(false);
    const [editingDesconche, setEditingDesconche] = useState(null); // State for editing

    const [isEnvasadoOpen, setIsEnvasadoOpen] = useState(false);
    const [isTrasladoOpen, setIsTrasladoOpen] = useState(false);

    const [activeTab, setActiveTab] = useState('desconche');
    const [selectedRow, setSelectedRow] = useState(null);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSelectedRow(null);
    };

    const actualizarTodo = async () => {
        await fetchAll();
    };

    const handleDelete = async () => {
        if (!selectedRow) return;
        const result = await deleteDataAlert();
        if (result.isConfirmed) {
            let response;
            if (selectedRow.ids && selectedRow.ids.length > 0) {
                response = await deleteManyProduccion(selectedRow.ids);
            } else {
                response = await deleteProduccion(selectedRow.id);
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

    const handleDeleteDesconche = async () => {
        if (!selectedRow) return;
        const result = await deleteDataAlert();
        if (result.isConfirmed) {
            try {
                await deleteDesconche(selectedRow.id);
                showSuccessAlert('Eliminado', 'Desconche eliminado correctamente.');
                actualizarTodo();
                setSelectedRow(null);
            } catch (error) {
                showErrorAlert('Error', error.response?.data?.message || 'No se pudo eliminar.');
            }
        }
    };

    const handleEditDesconche = () => {
        if (!selectedRow) return;
        setEditingDesconche(selectedRow);
        setIsDesconcheOpen(true);
    };

    useEffect(() => {
        actualizarTodo();
    }, []);

    // Filter states...
    const [filtersDesconche, setFiltersDesconche] = useState({
        loteCodigo: '',
        fecha: '',
        observacion: ''
    });

    const [filtersStock, setFiltersStock] = useState({
        loteCodigo: '',
        orderHora: 'desc',
        producto: '',
        calibre: '',
        ubicacion: ''
    });

    const handleFilterDesconcheChange = (e) => {
        const { name, value } = e.target;
        setFiltersDesconche(prev => ({ ...prev, [name]: value }));
    };

    const handleFilterStockChange = (e) => {
        const { name, value } = e.target;
        setFiltersStock(prev => ({ ...prev, [name]: value }));
    };

    // Columns
    const columnsDesconche = [
        { header: "Lote", accessor: "loteCodigo" },
        { header: "Especie", accessor: "materiaPrimaNombre" },
        { header: "Carne Blanca (Kg)", accessor: "peso_carne_blanca" },
        { header: "Pinzas (Kg)", accessor: "peso_pinzas" },
        {
            header: "Kilos Totales",
            render: (row) => row.peso_total ? Number(row.peso_total).toFixed(2) : (Number(row.peso_carne_blanca || 0) + Number(row.peso_pinzas || 0)).toFixed(2)
        },
        { header: "Observación", accessor: "observacion" },
        { header: "Fecha", accessor: "fecha" }
    ];

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
        }] : [])
    ];

    // Filter Logic...
    const filteredDesconches = useMemo(() => {
        if (!desconches) return [];
        return desconches.filter(item => {
            const matchLote = (item.loteCodigo || '').toLowerCase().includes(filtersDesconche.loteCodigo.toLowerCase());
            const matchFecha = (item.fecha || '').toLowerCase().includes(filtersDesconche.fecha.toLowerCase());
            const matchObs = (item.observacion || '').toLowerCase().includes(filtersDesconche.observacion.toLowerCase());
            return matchLote && matchFecha && matchObs;
        });
    }, [desconches, filtersDesconche]);

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
                            {activeTab === 'desconche' ? (
                                <>
                                    <button
                                        onClick={() => { setEditingDesconche(null); setIsDesconcheOpen(true); }}
                                        className="btn-new"
                                        style={{ backgroundColor: '#28a745' }}
                                    >
                                        + Nuevo Proceso
                                    </button>
                                    <button
                                        disabled={!selectedRow}
                                        onClick={handleEditDesconche}
                                        className='btn-edit'
                                        style={{ opacity: selectedRow ? 1 : 0.5 }}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        disabled={!selectedRow}
                                        onClick={handleDeleteDesconche}
                                        className="btn-delete"
                                        style={{ opacity: selectedRow ? 1 : 0.5 }}
                                    >
                                        Eliminar
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setIsEnvasadoOpen(true)} className="btn-new" style={{ backgroundColor: '#28a745' }}>
                                        + Ingresar Productos
                                    </button>
                                    <button
                                        onClick={handleDelete}
                                        disabled={!selectedRow}
                                        className="btn-delete"
                                        style={{ opacity: selectedRow ? 1 : 0.5 }}
                                    >
                                        Eliminar
                                    </button>
                                    {isTransferMode ? (
                                        <>
                                            <button onClick={handleTransferModeToggle} className="btn-edit" style={{ backgroundColor: '#6c757d' }}>
                                                Cancelar
                                            </button>
                                            <button onClick={handleOpenTransferPopup} className="btn-new" style={{ backgroundColor: '#ffc107', color: '#000', borderColor: '#e0a800' }}>
                                                Confirmar Traslado
                                            </button>
                                        </>
                                    ) : (
                                        <button onClick={handleTransferModeToggle} className="btn-new" style={{ backgroundColor: '#ffc107', color: '#000', borderColor: '#e0a800' }}>
                                            Traslado Contenedor
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* TABS (BELOW TITLE) */}
                    <div className="action-buttons" style={{ alignSelf: 'flex-start' }}>
                        <button
                            className="btn-new"
                            style={{
                                backgroundColor: activeTab === 'desconche' ? '#003366' : '#e0e0e0',
                                color: activeTab === 'desconche' ? '#fff' : '#333',
                                border: 'none',
                                borderRadius: '4px 0 0 4px',
                                marginRight: '0'
                            }}
                            onClick={() => handleTabChange('desconche')}
                        >
                            Kilos Producidos
                        </button>
                        <button
                            className="btn-new"
                            style={{
                                backgroundColor: activeTab === 'stock' ? '#003366' : '#e0e0e0',
                                color: activeTab === 'stock' ? '#fff' : '#333',
                                border: 'none',
                                borderRadius: '0 4px 4px 0',
                                marginLeft: '-1px' // Overlap border if any
                            }}
                            onClick={() => handleTabChange('stock')}
                        >
                            Stock Cámaras
                        </button>
                    </div>
                </div>

                {/* --- TAB CONTENT: DESCONCHE --- */}
                {activeTab === 'desconche' && (
                    <>
                        <h3 style={{ color: '#003366', marginTop: '15px', marginBottom: '10px' }}>Materia Prima obtenida post cocción</h3>
                        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
                            <input name="loteCodigo" placeholder="Lote..." value={filtersDesconche.loteCodigo} onChange={handleFilterDesconcheChange} className="search-input" />
                            <input name="fecha" placeholder="Fecha..." value={filtersDesconche.fecha} onChange={handleFilterDesconcheChange} className="search-input" />
                            <input name="observacion" placeholder="Observación..." value={filtersDesconche.observacion} onChange={handleFilterDesconcheChange} className="search-input" style={{ flex: 1 }} />
                        </div>

                        <Table
                            columns={columnsDesconche}
                            data={filteredDesconches}
                            onRowClick={(row) => setSelectedRow(row)}
                            selectedId={selectedRow?.id}
                        />
                    </>
                )}

                {/* --- TAB CONTENT: STOCK CÁMARAS --- */}
                {activeTab === 'stock' && (
                    <>
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
                            onRowClick={(row) => setSelectedRow(row)}
                            selectedId={selectedRow?.id}
                        />
                    </>
                )}
            </div>

            {/* --- POPUPS --- */}
            <PopupDesconche
                show={isDesconcheOpen}
                setShow={setIsDesconcheOpen}
                initialData={editingDesconche}
                onSuccess={() => {
                    actualizarTodo();
                    setIsDesconcheOpen(false);
                }}
            />
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
                    handleTransferModeToggle();
                }}
                initialSelection={Object.values(transferSelection).map(x => x.row ? { ...x.row, cantidadTransfer: x.qty } : null).filter(Boolean)}
            />
        </div>
    );
};

export default Produccion;
