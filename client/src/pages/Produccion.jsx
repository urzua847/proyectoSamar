import { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../services/root.service.js';
import Table from '../components/Table';
import useGetProducciones from '../hooks/produccion/useGetProducciones';
import PopupEnvasado from '../components/produccion/PopupEnvasado';
import PopupTraslado from '../components/produccion/PopupTraslado';
import ModalPrintQR from '../components/produccion/ModalPrintQR';
import { deleteManyProduccion, deleteProduccion } from '../services/envasado.service';
import usePolling from '../hooks/usePolling';
import { deleteDataAlert, showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';
import { getColumnsGranel, getColumnsTransito } from '../components/produccion/produccionColumns';
import StockFilters from '../components/produccion/StockFilters';
import Swal from 'sweetalert2';
import '../styles/users.css';

const Produccion = () => {
    // Componente principal para Gestión de Producción
    const { producciones, fetchAll } = useGetProducciones();
    const { user } = useAuth();

    const [activeTab, setActiveTab] = useState('granel');
    const [transitoStock, setTransitoStock] = useState([]);

    const [isEnvasadoOpen, setIsEnvasadoOpen] = useState(false);
    const [isTrasladoOpen, setIsTrasladoOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const [isPrintQROpen, setIsPrintQROpen] = useState(false);
    const [qrRow, setQrRow] = useState(null);

    const handlePrintQR = (row) => {
        setQrRow(row);
        setIsPrintQROpen(true);
    };

    const fetchTransito = async () => {
        try {
            const response = await axios.get('/envasado/stock/transito');
            const data = response.data.data || [];
            const formatted = data.map((item, index) => ({
                ...item,
                id: `${item.loteCodigo}-${item.definicionProductoId}-${item.calibre || 'null'}-${index}`,
                cantidad: item.totalCantidad,
                peso_neto_kg: item.totalKilos
            }));
            setTransitoStock(formatted);
        } catch (error) {
            console.error("Error fetching transito stock", error);
        }
    };

    const actualizarTodo = async () => {
        await fetchAll();
        await fetchTransito();
    };

    const handleDeleteRow = async (row) => {
        const target = row || selectedRow;
        if (!target) return;

        const isTransito = activeTab === 'transito' || (target.ids && target.ids.length > 0);
        
        if (isTransito) {
            const idsToDelete = target.ids || [target.id];
            const maxQty = idsToDelete.length;

            const { value: qty } = await Swal.fire({
                title: '¿Cuántas cajas desea desarmar?',
                text: `Máximo disponible: ${maxQty}. Los kilos regresarán al inventario a granel.`,
                input: 'number',
                inputAttributes: {
                    min: 1,
                    max: maxQty,
                    step: 1
                },
                inputValue: maxQty,
                showCancelButton: true,
                confirmButtonText: 'Sí, Desarmar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#dc2626'
            });

            if (qty) {
                const quantity = parseInt(qty);
                if (quantity > 0 && quantity <= maxQty) {
                    const selectedIds = idsToDelete.slice(0, quantity);
                    const response = await deleteManyProduccion(selectedIds);
                    if (response.status === 'Success') {
                        showSuccessAlert('Cajas Desarmadas', `Se han desarmado ${quantity} caja(s) y los kilos regresaron a granel.`);
                        actualizarTodo();
                        setSelectedRow(null);
                    } else {
                        showErrorAlert('Error', response.message || 'No se pudo desarmar.');
                    }
                } else {
                    showErrorAlert('Error', 'Cantidad inválida.');
                }
            }
        } else {
            const result = await deleteDataAlert("¿Estás seguro?", "No podrás revertir esta acción.", "Sí, Eliminar");
            if (result.isConfirmed) {
                const response = await deleteProduccion(target.id);
                if (response.status === 'Success') {
                    showSuccessAlert('Eliminado', 'Registros eliminados correctamente.');
                    actualizarTodo();
                    setSelectedRow(null);
                } else {
                    showErrorAlert('Error', response.message || 'No se pudo eliminar.');
                }
            }
        }
    };

    const [selectedIds, setSelectedIds] = useState([]);

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        const currentData = activeTab === 'granel' ? producciones : transitoStock;
        const rows = currentData.filter(p => selectedIds.includes(p.id));
        const allIdsToDelete = rows.flatMap(r => r.ids || [r.id]);

        if (allIdsToDelete.length === 0) return;

        const isTransito = activeTab === 'transito';
        const title = isTransito ? "¿Desarmar múltiples cajas?" : "¿Estás seguro?";
        const text = isTransito ? "Los kilos de estas cajas regresarán al inventario a granel." : "No podrás revertir esta acción.";
        const btnText = isTransito ? "Sí, Desarmar Todo" : "Sí, Eliminar Todo";

        const result = await deleteDataAlert(title, text, btnText);
        if (result.isConfirmed) {
            const response = await deleteManyProduccion(allIdsToDelete);
            if (response.status === 'Success') {
                showSuccessAlert(isTransito ? 'Cajas Desarmadas' : 'Eliminado', 
                                 isTransito ? 'Las cajas seleccionadas fueron desarmadas exitosamente.' : 'Registros eliminados correctamente.');
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
        const currentData = activeTab === 'granel' ? producciones : transitoStock;
        const rows = currentData.filter(p => selectedIds.includes(p.id));

        rows.forEach(row => {
            newSelection[row.id] = { qty: row.cantidad, row: row };
        });

        setTransferSelection(newSelection);
        setIsTrasladoOpen(true);
    };

    const [transferSelection, setTransferSelection] = useState({});

    useEffect(() => {
        actualizarTodo();
    }, []);

    usePolling(() => {
        if (!isEnvasadoOpen && !isTrasladoOpen && selectedIds.length === 0) {
            actualizarTodo();
        }
    }, 30000);

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

    

    const currentDataset = activeTab === 'granel' ? producciones : transitoStock;
    const currentColumns = activeTab === 'granel' ? getColumnsGranel(handleDeleteRow, user) : getColumnsTransito(handleDeleteRow, user, handlePrintQR);

    const { uniqueLotes, uniqueProductos, uniqueUbicaciones } = useMemo(() => {
        if (!currentDataset) return { uniqueLotes: [], uniqueProductos: [], uniqueUbicaciones: [] };
        const lotes = [...new Set(currentDataset.map(p => p.loteCodigo).filter(Boolean))].sort();
        const productos = [...new Set(currentDataset.map(p => p.productoFinalNombre || p.productoNombre).filter(Boolean))].sort();
        const ubicaciones = [...new Set(currentDataset.map(p => p.ubicacionNombre).filter(Boolean))].sort();
        return { uniqueLotes: lotes, uniqueProductos: productos, uniqueUbicaciones: ubicaciones };
    }, [currentDataset]);

    const filteredData = useMemo(() => {
        if (!currentDataset) return [];
        let filtered = currentDataset.filter(item => {
            const matchLote = (item.loteCodigo || '').toLowerCase().includes(filtersStock.loteCodigo.toLowerCase());
            const matchProducto = (item.productoFinalNombre || item.productoNombre || '').toLowerCase().includes(filtersStock.producto.toLowerCase());
            const matchCalibre = (item.calibre || '').toLowerCase().includes(filtersStock.calibre.toLowerCase());
            const matchUbicacion = (item.ubicacionNombre || '').toLowerCase().includes(filtersStock.ubicacion.toLowerCase());
            return matchLote && matchProducto && matchCalibre && matchUbicacion;
        });

        if (activeTab === 'granel') {
            filtered.sort((a, b) => {
                if (filtersStock.orderHora === 'asc') return a.id - b.id;
                else return b.id - a.id;
            });
        }
        return filtered;
    }, [currentDataset, filtersStock, activeTab]);

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setSelectedIds([]);
        setSelectedRow(null);
    };

    return (
        <div className="main-container">
            <div className="table-wrapper">
                <div className="top-table" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <h1 className="title-table" style={{ margin: 0 }}>Gestión de Producción</h1>

                        <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
                            {activeTab === 'granel' && (
                                <>
                                    <button
                                        onClick={() => setIsEnvasadoOpen(true)}
                                        className="btn-new"
                                    >
                                        <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>+</span> Ingresar Productos
                                    </button>

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
                                                Trasladar a Contenedor ({selectedIds.length})
                                            </button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <h3 style={{ color: '#003366', marginTop: '15px', marginBottom: '10px' }}>Inventario en Cámaras</h3>
                
                {/* TABS */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                    <button 
                        onClick={() => handleTabChange('granel')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: activeTab === 'granel' ? '#003366' : '#e2e8f0',
                            color: activeTab === 'granel' ? '#ffffff' : '#334155',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        A Granel
                    </button>
                    <button 
                        onClick={() => handleTabChange('transito')}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: activeTab === 'transito' ? '#003366' : '#e2e8f0',
                            color: activeTab === 'transito' ? '#ffffff' : '#334155',
                            border: 'none',
                            borderRadius: '4px',
                            fontWeight: 'bold',
                            cursor: 'pointer'
                        }}
                    >
                        En Tránsito
                    </button>
                </div>

                <div className="table-container-box">
                    <StockFilters 
                        filtersStock={filtersStock} 
                        handleFilterStockChange={handleFilterStockChange} 
                        uniqueLotes={uniqueLotes} 
                        uniqueProductos={uniqueProductos} 
                        uniqueUbicaciones={uniqueUbicaciones} 
                        activeTab={activeTab} 
                        setFiltersStock={setFiltersStock} 
                    />

                    <Table
                        columns={currentColumns}
                        data={filteredData}
                        onRowClick={(row) => {
                            if (selectedRow && selectedRow.id === row.id) {
                                setSelectedRow(null);
                            } else {
                                setSelectedRow(row);
                            }
                        }}
                        selectedId={selectedRow?.id}
                        multiSelect={activeTab === 'granel'}

                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                    />
                </div>
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
                    setTransferSelection({});
                    setSelectedIds([]);
                }}
                initialSelection={Object.values(transferSelection).map(x => x.row ? { ...x.row, cantidadTransfer: x.qty } : null).filter(Boolean)}
            />
            <ModalPrintQR 
                isOpen={isPrintQROpen}
                onClose={() => setIsPrintQROpen(false)}
                selectedRow={qrRow}
            />
        </div>
    );
};

export default Produccion;
