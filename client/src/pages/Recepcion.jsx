import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../components/Table';
import useGetRecepciones from '../hooks/recepcion/useGetRecepciones';
import useEditRecepcion from '../hooks/recepcion/useEditRecepcion';
import useRecepcion from '../hooks/recepcion/useRecepcion';
import PopupRecepcion from '../components/PopupRecepcion';
import PopupNuevaProduccion from '../components/produccion/PopupNuevaProduccion';
import PopupEditarProduccion from '../components/produccion/PopupEditarProduccion';
import { updateLote } from '../services/recepcion.service';
import { getProductos } from '../services/catalogos.service';
import { showSuccessAlert, showErrorAlert, confirmStrictDelete, showToastSuccess, showToastError, showToastWarning, confirmActionAlert } from '../helpers/sweetAlert';
import TouchButton from '../components/TouchButton';
import Badge from '../components/Badge';
import ActionButton from '../components/ActionButton';
import '../styles/users.css';

const Recepcion = () => {
    const navigate = useNavigate();
    const { lotes, fetchLotes, setLotes } = useGetRecepciones();
    const { handleCreateLote } = useRecepcion();

    const {
        dataLote, setDataLote,
        isPopupOpen, setIsPopupOpen,
        handleEditClick, handleUpdate, handleDelete
    } = useEditRecepcion(setLotes, fetchLotes);

    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [isInputKilosOpen, setIsInputKilosOpen] = useState(false);
    const [isEditProduccionOpen, setIsEditProduccionOpen] = useState(false);

    const [selectedLote, setSelectedLote] = useState(null);
    const [activeTab, setActiveTab] = useState('Todas');
    const [productosCatalogo, setProductosCatalogo] = useState([]);

    useEffect(() => {
        getProductos().then(res => setProductosCatalogo(res || []));
    }, []);

    // Estado de Filtros
    const [filters, setFilters] = useState({
        codigo: '',
        proveedorNombre: '',
        materiaPrimaNombre: '',
        fechaFormateada: '',
        estadoTexto: ''
    });
    const [sortOrder, setSortOrder] = useState('desc');

    const user = JSON.parse(sessionStorage.getItem('usuario'));
    const isAdmin = user?.rol === 'administrador';

    const handleToggleEstado = async (lote) => {
        if (!lote) return;

        const nuevoEstado = !lote.estado;
        const accion = nuevoEstado ? "Reabrir" : "Cerrar";

        // Operario solo puede cerrar, no reabrir
        if (!isAdmin && nuevoEstado === true) {
            showToastError('Solo un administrador puede reabrir un lote.');
            return;
        }

        const confirm = await confirmActionAlert(
            `Lote ${lote.codigo}`,
            `¿Seguro que deseas ${accion.toLowerCase()} este lote?`,
            `Sí, ${accion}`,
            nuevoEstado ? "#10b981" : "#f59e0b",
            "warning"
        );
        if (!confirm.isConfirmed) return;

        try {
            const response = await updateLote(lote.id, { estado: nuevoEstado });

            if (response.status === 'Success') {
                showToastSuccess(`El lote ${lote.codigo} ha sido ${nuevoEstado ? 'abierto' : 'cerrado'}.`);
                fetchLotes();
            } else {
                showToastError(response.message || "No se pudo cambiar el estado.");
            }
        } catch (error) {
            console.error(error);
            showToastError("Ocurrió un error inesperado al actualizar estado.");
        }
    };

    const handleOpenEdit = (row) => {
        setDataLote(row);
        setIsPopupOpen(true);
    };

    const handleRowClick = (row) => {
        if (selectedLote && selectedLote.id === row.id) {
            setSelectedLote(null);
        } else {
            setSelectedLote(row);
        }
    };

    const getProduccionTotalByNombre = (row, nombre) => {
        if (!row.producciones || row.producciones.length === 0) return "0.00";
        let total = 0;
        row.producciones.forEach(prod => {
            if (prod.detalles && Array.isArray(prod.detalles)) {
                prod.detalles.forEach(d => {
                    if (d.nombre.toLowerCase().includes(nombre.toLowerCase())) {
                        total += Number(d.peso);
                    }
                });
            }
        });
        return total > 0 ? total.toFixed(2) : "0.00";
    };

    const columns = useMemo(() => {
        const baseCols = [
            {
                header: "Lote",
                render: (row) => (
                    <span
                        onClick={(e) => { e.stopPropagation(); navigate(`/recepcion/${row.id}`); }}
                        style={{
                            color: '#1a6bbf',
                            textDecoration: 'underline',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            whiteSpace: 'nowrap'
                        }}
                        title="Ver detalle del lote"
                    >
                        {row.codigo}
                    </span>
                )
            },
            { header: "Recepción", accessor: "fechaFormateada" },
            { header: "Proveedor", accessor: "proveedorNombre" },
            { header: "Especie", accessor: "materiaPrimaNombre" },
            { header: "Peso Total", accessor: "peso_bruto_kg" },
            { header: "Bandejas", accessor: "numero_bandejas" }
        ];

        let dynamicCols = [];
        if (activeTab !== 'Todas') {
            const primaryProducts = productosCatalogo.filter(p => 
                p.materiaPrima?.nombre?.toLowerCase() === activeTab.toLowerCase() && 
                p.tipo === 'primario'
            );
            
            dynamicCols = primaryProducts.map(prod => ({
                header: `${prod.nombre} (Kg)`,
                render: (row) => getProduccionTotalByNombre(row, prod.nombre)
            }));
        }

        const endCols = [
            {
                header: "Kilos Totales",
                render: (row) => row.peso_total_producido ? Number(row.peso_total_producido).toFixed(2) : "0.00"
            },
            { header: "Observación", accessor: "observacion_produccion" },
            {
                header: "Estado Lote",
                accessor: "estadoTexto",
                render: (row) => (
                    <Badge status={row.estado ? 'success' : 'danger'} variant="solid">
                        {row.estadoTexto}
                    </Badge>
                )
            },
            {
                header: "Acciones",
                render: (row) => (
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                        {/* EDIT - Solo admin */}
                        {isAdmin && (
                            <ActionButton
                                variant="edit"
                                title="Editar Lote"
                                onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
                            />
                        )}

                        {/* TOGGLE STATE */}
                        {(isAdmin || row.estado) && (
                            <ActionButton
                                variant={row.estado ? "transfer" : "custom"}
                                title={row.estado ? (isAdmin ? "Cerrar Lote" : "Bloquear Lote") : "Reabrir Lote (admin)"}
                                onClick={(e) => { e.stopPropagation(); handleToggleEstado(row); }}
                                disabled={!isAdmin && !row.estado}
                                icon={row.estado ? "🔒" : "🔓"}
                            />
                        )}

                        {/* DELETE - Solo admin */}
                        {isAdmin && (
                            <ActionButton
                                variant="delete"
                                title="Eliminar Lote"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setDataLote(row);
                                    handleDelete();
                                }}
                            />
                        )}
                    </div>
                )
            }
        ];

        return [...baseCols, ...dynamicCols, ...endCols];
    }, [activeTab, isAdmin, handleToggleEstado, handleOpenEdit, handleDelete, navigate, productosCatalogo]);


    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredLotes = useMemo(() => {
        if (!lotes) return [];
        let filtered = lotes.filter(item => {
            if (activeTab !== 'Todas' && item.materiaPrimaNombre && !item.materiaPrimaNombre.toLowerCase().includes(activeTab.toLowerCase())) {
                return false;
            }
            return Object.keys(filters).every(key => {
                if (!filters[key]) return true;
                
                let filterValue = filters[key].toLowerCase();
                // Si el filtro es de fecha y viene en formato YYYY-MM-DD (del input type date), lo convertimos a DD-MM-YYYY
                if (key === 'fechaFormateada' && filterValue.includes('-') && filterValue.split('-')[0].length === 4) {
                     const [year, month, day] = filterValue.split('-');
                     filterValue = `${day}-${month}-${year}`;
                }

                const itemValue = String(item[key] || '').toLowerCase();
                return itemValue.includes(filterValue);
            });
        });

        filtered.sort((a, b) => {
            const valA = a.id || 0;
            const valB = b.id || 0;
            return sortOrder === 'desc' ? valB - valA : valA - valB;
        });

        return filtered;
    }, [lotes, filters, sortOrder, activeTab]);

    const handleCreateSubmit = async (data) => {
        const success = await handleCreateLote(data);
        if (success) {
            fetchLotes();
            setIsCreateOpen(false);
        }
    };

    return (
        <div className='main-container'>
            <div className='table-wrapper'>

                {/* Tabs de Especie */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                    <button 
                        className={`tab-button ${activeTab === 'Todas' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('Todas')}
                        style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: activeTab === 'Todas' ? '#1a6bbf' : '#fff', color: activeTab === 'Todas' ? '#fff' : '#333', cursor: 'pointer' }}
                    >Todas</button>
                    <button 
                        className={`tab-button ${activeTab === 'Jaiba' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('Jaiba')}
                        style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: activeTab === 'Jaiba' ? '#1a6bbf' : '#fff', color: activeTab === 'Jaiba' ? '#fff' : '#333', cursor: 'pointer' }}
                    >Jaiba</button>
                    <button 
                        className={`tab-button ${activeTab === 'Pulpo' ? 'active' : ''}`} 
                        onClick={() => setActiveTab('Pulpo')}
                        style={{ padding: '8px 16px', borderRadius: '4px', border: '1px solid #ccc', background: activeTab === 'Pulpo' ? '#1a6bbf' : '#fff', color: activeTab === 'Pulpo' ? '#fff' : '#333', cursor: 'pointer' }}
                    >Pulpo</button>
                </div>

                <div className='top-table' style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <h1 className='title-table' style={{ margin: 0, fontSize: '1.5rem' }}>Recepción de Materia Prima</h1>

                        <div className='action-buttons' style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <TouchButton
                                onClick={() => setIsCreateOpen(true)}
                                variant="success"
                                size="medium"
                            >
                                + Nuevo Ingreso
                            </TouchButton>

                            <button
                                onClick={() => {
                                    if (selectedLote) {
                                        if (Number(selectedLote.peso_total_producido) > 0 || Number(selectedLote.peso_carne_blanca) > 0) {
                                            showToastWarning("Este lote ya tiene producción registrada.");
                                            return;
                                        }
                                        setIsInputKilosOpen(true);
                                    }
                                    else showToastWarning("Selecciona un lote de la tabla primero.");
                                }}
                                className="btn-new"
                                disabled={!selectedLote}
                            >
                                Ingresar Producción
                            </button>
                        </div>

                        {/* Botón Corregir Producción - solo si el lote tiene un registro real en producciones */}
                        {selectedLote && selectedLote.en_proceso_produccion === true && (
                            <button
                                onClick={() => setIsEditProduccionOpen(true)}
                                className="btn-new"
                                style={{ padding: '10px 18px' }}
                                title="Corregir los kilos de producción (solo una vez permitido)"
                            >
                                ✏️ Corregir Producción
                            </button>
                        )}
                    </div>
                </div>

                <div className="table-container-box">
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <input
                            name="codigo"
                            placeholder="Código..."
                            value={filters.codigo}
                            onChange={handleFilterChange}
                            className="search-input"
                            style={{ height: '38px', padding: '0 12px', borderRadius: '6px' }}
                        />
                        <input
                            name="proveedorNombre"
                            placeholder="Proveedor..."
                            value={filters.proveedorNombre}
                            onChange={handleFilterChange}
                            className="search-input"
                            style={{ height: '38px', padding: '0 12px', borderRadius: '6px' }}
                        />
                        <input
                            name="materiaPrimaNombre"
                            placeholder="Especie / Producto..."
                            value={filters.materiaPrimaNombre}
                            onChange={handleFilterChange}
                            className="search-input"
                            style={{ height: '38px', padding: '0 12px', borderRadius: '6px' }}
                        />
                        <input
                            type="date"
                            name="fechaFormateada"
                            placeholder="Fecha..."
                            value={filters.fechaFormateada}
                            onChange={handleFilterChange}
                            className="search-input"
                            style={{ height: '38px', padding: '0 12px', borderRadius: '6px' }}
                        />
                        <select
                            name="estadoTexto"
                            value={filters.estadoTexto}
                            onChange={handleFilterChange}
                            className="search-input"
                            style={{ height: '38px', padding: '0 12px', borderRadius: '6px' }}
                        >
                            <option value="">-- Todos los Estados --</option>
                            <option value="Abierto">Abierto</option>
                            <option value="Cerrado">Cerrado</option>
                        </select>
                        <select
                            value={sortOrder}
                            onChange={e => setSortOrder(e.target.value)}
                            className="search-input"
                            style={{ height: '38px', padding: '0 12px', borderRadius: '6px' }}
                        >
                            <option value="desc">Más recientes</option>
                            <option value="asc">Más antiguos</option>
                        </select>
                        <button
                            onClick={() => setFilters({ codigo: '', proveedorNombre: '', materiaPrimaNombre: '', fechaFormateada: '', estadoTexto: '' })}
                            className="btn-cancel"
                            style={{ height: '38px', padding: '0 14px', whiteSpace: 'nowrap' }}
                        >
                            Limpiar
                        </button>
                    </div>

                    <Table
                        columns={columns}
                        data={filteredLotes}
                        onRowClick={handleRowClick}
                        selectedId={selectedLote?.id}
                    />
                </div>
            </div>

            <PopupRecepcion show={isCreateOpen} setShow={setIsCreateOpen} action={handleCreateSubmit} />
            <PopupRecepcion show={isPopupOpen} setShow={setIsPopupOpen} dataToEdit={dataLote} action={handleUpdate} />

            <PopupNuevaProduccion
                show={isInputKilosOpen}
                setShow={setIsInputKilosOpen}
                selectedLote={selectedLote}
                onSuccess={() => {
                    fetchLotes();
                    setSelectedLote(null);
                }}
            />

            <PopupEditarProduccion
                show={isEditProduccionOpen}
                setShow={setIsEditProduccionOpen}
                selectedLote={selectedLote}
                onSuccess={() => {
                    fetchLotes();
                    setSelectedLote(null);
                }}
            />
        </div>
    );

};

export default Recepcion;