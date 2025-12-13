import { useState, useMemo, useEffect } from 'react';
import Table from '../components/Table';
import useGetProducciones from '../hooks/produccion/useGetProducciones';
import PopupDesconche from '../components/produccion/PopupDesconche';
import PopupEnvasado from '../components/produccion/PopupEnvasado';
import PopupTraslado from '../components/produccion/PopupTraslado';
import { getStockCamaras, deleteProduccion, deleteManyProduccion } from '../services/produccion.service';
import { deleteDataAlert, showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';
import '../styles/users.css';

const Produccion = () => {
    const { producciones, desconches, fetchAll } = useGetProducciones();

    const [isDesconcheOpen, setIsDesconcheOpen] = useState(false);
    const [isEnvasadoOpen, setIsEnvasadoOpen] = useState(false);
    const [isTrasladoOpen, setIsTrasladoOpen] = useState(false);

    const [activeTab, setActiveTab] = useState('desconche');

    const actualizarTodo = async () => {
        await fetchAll();
    };

    const handleDelete = async (row) => {
        const result = await deleteDataAlert();
        if (result.isConfirmed) {
            let response;
            if (row.ids && row.ids.length > 0) {
                response = await deleteManyProduccion(row.ids);
            } else {
                response = await deleteProduccion(row.id);
            }

            if (response.status === 'Success') {
                showSuccessAlert('Eliminado', 'Registros eliminados correctamente.');
                actualizarTodo();
            } else {
                showErrorAlert('Error', response.message || 'No se pudo eliminar.');
            }
        }
    };

    useEffect(() => {
        actualizarTodo();
    }, []);


    const [filtersDesconche, setFiltersDesconche] = useState({
        loteCodigo: '',
        fecha: '',
        observacion: ''
    });

    const [filtersStock, setFiltersStock] = useState({
        loteCodigo: '',
        horaIngreso: '',
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

    const columnsDesconche = [
        { header: "Lote", accessor: "loteCodigo" },
        { header: "Fecha", accessor: "fecha" },
        { header: "Carne Blanca (Kg)", accessor: "peso_carne_blanca" },
        { header: "Pinzas (Kg)", accessor: "peso_pinzas" },
        {
            header: "Kilos Totales",
            render: (row) => row.peso_total ? Number(row.peso_total).toFixed(2) : (Number(row.peso_carne_blanca || 0) + Number(row.peso_pinzas || 0)).toFixed(2)
        },
        { header: "Observación", accessor: "observacion" },
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
                copy[row.id] = {
                    qty: val,
                    row: row // Keep ref to row data for Popup
                };
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
        { header: "Producto", accessor: "productoFinalNombre" },
        { header: "Calibre", accessor: "calibre" },
        { header: "Cantidad", accessor: "cantidad" },
        { header: "Kilos Totales", accessor: "peso_neto_kg" },
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
        }] : [{
            header: "Acción",
            width: "100px",
            render: (row) => (
                <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(row); }}
                    style={{
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '5px 10px',
                        cursor: 'pointer'
                    }}
                >
                    Eliminar
                </button>
            )
        }])
    ];

    const filteredDesconches = useMemo(() => {
        if (!desconches) return [];
        return desconches.filter(item => {
            const matchLote = (item.loteCodigo || '').toLowerCase().includes(filtersDesconche.loteCodigo.toLowerCase());
            const matchFecha = (item.fecha || '').toLowerCase().includes(filtersDesconche.fecha.toLowerCase());
            const matchObs = (item.observacion || '').toLowerCase().includes(filtersDesconche.observacion.toLowerCase());
            return matchLote && matchFecha && matchObs;
        });
    }, [desconches, filtersDesconche]);

    const filteredProducciones = useMemo(() => {
        if (!producciones) return [];
        return producciones.filter(item => {
            const matchLote = (item.loteCodigo || '').toLowerCase().includes(filtersStock.loteCodigo.toLowerCase());
            const matchHora = (item.horaIngreso || '').toLowerCase().includes(filtersStock.horaIngreso.toLowerCase());
            const matchProducto = (item.productoFinalNombre || '').toLowerCase().includes(filtersStock.producto.toLowerCase());
            const matchCalibre = (item.calibre || '').toLowerCase().includes(filtersStock.calibre.toLowerCase());
            const matchUbicacion = (item.ubicacionNombre || '').toLowerCase().includes(filtersStock.ubicacion.toLowerCase());

            return matchLote && matchHora && matchProducto && matchCalibre && matchUbicacion;
        });
    }, [producciones, filtersStock]);

    return (
        <div className="main-container">
            <div className="table-wrapper">
                <div className="top-table">
                    <h1 className="title-table">Gestión de Producción</h1>

                    {/* TABS BUTTONS */}
                    <div className="action-buttons">
                        <button
                            className="btn-new"
                            style={{
                                backgroundColor: activeTab === 'desconche' ? '#003366' : '#e0e0e0', // Azul si activo
                                color: activeTab === 'desconche' ? '#fff' : '#333',
                                border: 'none'
                            }}
                            onClick={() => setActiveTab('desconche')}
                        >
                            Kilos Producidos
                        </button>
                        <button
                            className="btn-new"
                            style={{
                                backgroundColor: activeTab === 'stock' ? '#003366' : '#e0e0e0', // Azul si activo
                                color: activeTab === 'stock' ? '#fff' : '#333',
                                border: 'none'
                            }}
                            onClick={() => setActiveTab('stock')}
                        >
                            Stock Cámaras
                        </button>
                    </div>
                </div>

                {/* --- TAB CONTENT: DESCONCHE --- */}
                {activeTab === 'desconche' && (
                    <>
                        <div className="top-table" style={{ marginTop: '20px' }}>
                            <h2 style={{ fontSize: '1.1rem', color: '#003366', margin: 0 }}>Historial Kilos Producidos</h2>
                            <div className="action-buttons">
                                <button onClick={() => setIsDesconcheOpen(true)} className="btn-new" style={{ backgroundColor: '#28a745' }}>
                                    + Nuevo Proceso
                                </button>
                            </div>
                        </div>

                        <div className="filter-section">
                            <div className="filter-row-3">
                                <div className="filter-group">
                                    <label>Lote</label>
                                    <input name="loteCodigo" placeholder="Ej: 1204..." value={filtersDesconche.loteCodigo} onChange={handleFilterDesconcheChange} />
                                </div>
                                <div className="filter-group">
                                    <label>Fecha</label>
                                    <input name="fecha" placeholder="dd-mm..." value={filtersDesconche.fecha} onChange={handleFilterDesconcheChange} />
                                </div>
                                <div className="filter-group">
                                    <label>Observación</label>
                                    <input name="observacion" placeholder="..." value={filtersDesconche.observacion} onChange={handleFilterDesconcheChange} />
                                </div>
                            </div>
                        </div>

                        <Table columns={columnsDesconche} data={filteredDesconches} />
                    </>
                )}

                {/* --- TAB CONTENT: STOCK CÁMARAS --- */}
                {activeTab === 'stock' && (
                    <>
                        <div className="top-table" style={{ marginTop: '20px' }}>
                            <h2 style={{ fontSize: '1.1rem', color: '#003366', margin: 0 }}>Historial Stock Cámaras</h2>
                            <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => setIsEnvasadoOpen(true)} className="btn-new" style={{ backgroundColor: '#28a745' }}>
                                    + Ingresar Productos
                                </button>
                                {isTransferMode ? (
                                    <>
                                        <button onClick={handleTransferModeToggle} className="btn-edit" style={{ backgroundColor: '#6c757d', marginRight: '10px' }}>
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
                            </div>
                        </div>

                        <div className="filter-section">
                            <div className="filter-row-3">
                                <div className="filter-group">
                                    <label>Lote</label>
                                    <input name="loteCodigo" placeholder="Ej: 1204..." value={filtersStock.loteCodigo} onChange={handleFilterStockChange} />
                                </div>
                                <div className="filter-group">
                                    <label>Hora Ingreso</label>
                                    <input name="horaIngreso" placeholder="HH:mm..." value={filtersStock.horaIngreso} onChange={handleFilterStockChange} />
                                </div>
                                <div className="filter-group">
                                    <label>Cámara</label>
                                    <input name="ubicacion" placeholder="Cámara..." value={filtersStock.ubicacion} onChange={handleFilterStockChange} />
                                </div>
                            </div>
                            <div className="filter-row-2">
                                <div className="filter-group">
                                    <label>Producto</label>
                                    <input name="producto" placeholder="Pinza..." value={filtersStock.producto} onChange={handleFilterStockChange} />
                                </div>
                                <div className="filter-group">
                                    <label>Calibre</label>
                                    <input name="calibre" placeholder="250 grs..." value={filtersStock.calibre} onChange={handleFilterStockChange} />
                                </div>
                            </div>
                        </div>

                        <Table columns={columnsProduccion} data={filteredProducciones} />
                    </>
                )}
            </div>

            {/* --- POPUPS --- */}
            <PopupDesconche
                show={isDesconcheOpen}
                setShow={setIsDesconcheOpen}
                onSuccess={actualizarTodo}
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
