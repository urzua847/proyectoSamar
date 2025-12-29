import { useState, useMemo } from 'react';
import Table from '../components/Table';
import useGetRecepciones from '../hooks/recepcion/useGetRecepciones';
import useEditRecepcion from '../hooks/recepcion/useEditRecepcion';
import useRecepcion from '../hooks/recepcion/useRecepcion';
import PopupRecepcion from '../components/PopupRecepcion';
import PopupNuevaProduccion from '../components/produccion/PopupNuevaProduccion';
import { updateLote } from '../services/recepcion.service';
import { showSuccessAlert, showErrorAlert } from '../helpers/sweetAlert';
import '../styles/users.css';

const Recepcion = () => {
    const { lotes, fetchLotes, setLotes } = useGetRecepciones();
    const { handleCreateLote } = useRecepcion();

    const {
        dataLote, setDataLote,
        isPopupOpen, setIsPopupOpen,
        handleEditClick, handleUpdate, handleDelete
    } = useEditRecepcion(setLotes, fetchLotes);

    const [isCreateOpen, setIsCreateOpen] = useState(false);

    const [isInputKilosOpen, setIsInputKilosOpen] = useState(false);

    const [selectedLote, setSelectedLote] = useState(null);

    // Estado de Filtros
    const [filters, setFilters] = useState({
        codigo: '',
        proveedorNombre: '',
        materiaPrimaNombre: '',
        fechaFormateada: '',
        estadoTexto: ''
    });

    const user = JSON.parse(sessionStorage.getItem('usuario'));
    const isAdmin = user?.rol === 'administrador';

    const handleToggleEstado = async (lote) => {
        if (!lote) return;
        if (!isAdmin) return;

        const nuevoEstado = !lote.estado;
        const accion = nuevoEstado ? "Reabrir" : "Cerrar";

        if (!window.confirm(`¿Seguro que deseas ${accion} el lote ${lote.codigo}?`)) return;

        try {
            const response = await updateLote(lote.id, { estado: nuevoEstado });

            if (response.status === 'Success') {
                showSuccessAlert('¡Estado Actualizado!', `El lote ha sido ${nuevoEstado ? 'abierto' : 'cerrado'} correctamente.`);
                fetchLotes();
            } else {
                showErrorAlert('Error', response.message || "No se pudo cambiar el estado.");
            }
        } catch (error) {
            console.error(error);
            showErrorAlert('Error', "Ocurrió un error inesperado.");
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

    const columns = [
        { header: "Lote", accessor: "codigo" },
        { header: "Recepción", accessor: "fechaFormateada" },
        { header: "Proveedor", accessor: "proveedorNombre" },
        { header: "Especie", accessor: "materiaPrimaNombre" },
        { header: "Peso Total", accessor: "peso_bruto_kg" },
        { header: "Bandejas", accessor: "numero_bandejas" },
        { header: "Carne Blanca (Kg)", accessor: "peso_carne_blanca" },
        { header: "Pinzas (Kg)", accessor: "peso_pinzas" },
        {
            header: "Kilos Totales",
            render: (row) => row.peso_total_producido || (Number(row.peso_carne_blanca || 0) + Number(row.peso_pinzas || 0)).toFixed(2)
        },
        { header: "Observación", accessor: "observacion_produccion" },
        {
            header: "Estado Lote",
            accessor: "estadoTexto",
            render: (row) => (
                <span style={{
                    color: row.estado ? '#155724' : '#721c24',
                    backgroundColor: row.estado ? '#d4edda' : '#f8d7da',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontWeight: 'bold',
                    fontSize: '0.85rem'
                }}>
                    {row.estadoTexto}
                </span>
            )
        },
        ...(isAdmin ? [{
            header: "Acciones",
            render: (row) => (
                <div style={{ display: 'flex', gap: '5px' }}>
                    {/* EDIT */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}
                        className='btn-edit'
                        title="Editar"
                        style={{
                            padding: '0', borderRadius: '50%', width: '30px', height: '30px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: '#003366', border: 'none', color: 'white', fontSize: '0.9rem'
                        }}
                    >
                        ✎
                    </button>

                    {/* TOGGLE STATE */}
                    <button
                        onClick={(e) => { e.stopPropagation(); handleToggleEstado(row); }}
                        title={row.estado ? "Cerrar Lote" : "Reabrir Lote"}
                        style={{
                            padding: '0', borderRadius: '50%', width: '30px', height: '30px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: row.estado ? '#ffc107' : '#17a2b8',
                            border: 'none', color: row.estado ? '#000' : '#fff', fontSize: '0.9rem'
                        }}
                    >
                        {row.estado ? "🔒" : "🔓"}
                    </button>

                    {/* DELETE */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setDataLote(row);
                            handleDelete();
                        }}
                        className='btn-delete'
                        title="Eliminar"
                        style={{
                            padding: '0', borderRadius: '50%', width: '30px', height: '30px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            backgroundColor: '#dc3545', border: 'none', color: 'white', fontSize: '1rem'
                        }}
                    >
                        🗑
                    </button>
                </div>
            )
        }] : [])
    ];

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredLotes = useMemo(() => {
        if (!lotes) return [];
        return lotes.filter(item => {
            return Object.keys(filters).every(key => {
                if (!filters[key]) return true;
                const itemValue = String(item[key] || '').toLowerCase();
                const filterValue = filters[key].toLowerCase();
                return itemValue.includes(filterValue);
            });
        });
    }, [lotes, filters]);

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

                <div className='top-table'>
                    <h1 className='title-table'>Recepción de Materia Prima</h1>

                    <div className='action-buttons' style={{ display: 'flex', gap: '10px' }}>
                        <button
                            onClick={() => setIsCreateOpen(true)}
                            style={{
                                backgroundColor: '#4caf50',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>+</span> Nuevo Ingreso
                        </button>

                        {/* New Production Button */}
                        <button
                            onClick={() => {
                                if (selectedLote) {
                                    if (Number(selectedLote.peso_total_producido) > 0 || Number(selectedLote.peso_carne_blanca) > 0) {
                                        showErrorAlert("Aviso", "Este lote ya tiene producción registrada.");
                                        return;
                                    }
                                    setIsInputKilosOpen(true);
                                }
                                else showErrorAlert("Atención", "Selecciona un lote de la tabla primero.");
                            }}
                            className="btn-new"
                            disabled={!selectedLote}
                            style={{
                                backgroundColor: selectedLote ? '#003366' : '#ccc',
                                color: 'white',
                                border: 'none',
                                padding: '10px 20px',
                                borderRadius: '4px',
                                cursor: selectedLote ? 'pointer' : 'not-allowed',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '5px'
                            }}
                        >
                            Nueva Producción
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
                    <input
                        name="codigo"
                        placeholder="Código..."
                        value={filters.codigo}
                        onChange={handleFilterChange}
                        className="search-input"
                    />
                    <input
                        name="proveedorNombre"
                        placeholder="Proveedor..."
                        value={filters.proveedorNombre}
                        onChange={handleFilterChange}
                        className="search-input"
                    />
                    <input
                        name="materiaPrimaNombre"
                        placeholder="Producto..."
                        value={filters.materiaPrimaNombre}
                        onChange={handleFilterChange}
                        className="search-input"
                    />
                    <input
                        name="fechaFormateada"
                        placeholder="Fecha (dd-mm-yyyy)..."
                        value={filters.fechaFormateada}
                        onChange={handleFilterChange}
                        className="search-input"
                    />
                    <select
                        name="estadoTexto"
                        value={filters.estadoTexto}
                        onChange={handleFilterChange}
                        className="search-input"
                        style={{ width: 'auto' }}
                    >
                        <option value="">Todos</option>
                        <option value="Abierto">Abierto</option>
                        <option value="Cerrado">Cerrado</option>
                    </select>
                </div>

                <Table
                    columns={columns}
                    data={filteredLotes}
                    onRowClick={handleRowClick}
                    selectedId={selectedLote?.id}
                />
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
        </div>
    );

};

export default Recepcion;