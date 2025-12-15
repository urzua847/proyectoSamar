import { useState, useMemo } from 'react';
import Table from '../components/Table';
import useGetRecepciones from '../hooks/recepcion/useGetRecepciones';
import useEditRecepcion from '../hooks/recepcion/useEditRecepcion';
import useRecepcion from '../hooks/recepcion/useRecepcion';
import PopupRecepcion from '../components/PopupRecepcion';
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

    const handleToggleEstado = async () => {
        if (!dataLote) return;

        const nuevoEstado = !dataLote.estado;
        const accion = nuevoEstado ? "Reabrir" : "Cerrar";

        if (!window.confirm(`¿Seguro que deseas ${accion} el lote ${dataLote.codigo}?`)) return;

        try {
            const response = await updateLote(dataLote.id, { estado: nuevoEstado });

            if (response.status === 'Success') {
                showSuccessAlert('¡Estado Actualizado!', `El lote ha sido ${nuevoEstado ? 'abierto' : 'cerrado'} correctamente.`);
                fetchLotes();
                setDataLote(null);
            } else {
                showErrorAlert('Error', response.message || "No se pudo cambiar el estado.");
            }
        } catch (error) {
            console.error(error);
            showErrorAlert('Error', "Ocurrió un error inesperado.");
        }
    };

    const columns = [
        { header: "Lote", accessor: "codigo" },
        { header: "Recepción", accessor: "fechaFormateada" },
        { header: "Proveedor", accessor: "proveedorNombre" },
        { header: "Especie", accessor: "materiaPrimaNombre" },
        { header: "Peso Total", accessor: "peso_bruto_kg" },
        { header: "Bandejas", accessor: "numero_bandejas" },
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
        }
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

                    <div className='action-buttons'>
                        <button onClick={() => setIsCreateOpen(true)} className="btn-new">
                            + Nuevo Ingreso
                        </button>

                        <button onClick={handleEditClick} disabled={!dataLote} className="btn-edit">
                            Editar
                        </button>

                        {/* --- BOTÓN RECUPERADO --- */}
                        <button
                            onClick={handleToggleEstado}
                            disabled={!dataLote}
                            style={{
                                backgroundColor: dataLote?.estado ? '#ffc107' : '#17a2b8',
                                color: dataLote?.estado ? '#000' : '#fff',
                                borderColor: 'transparent'
                            }}
                            className="btn-edit"
                        >
                            {dataLote?.estado ? "Cerrar Lote" : "Reabrir Lote"}
                        </button>
                        {/* ------------------------ */}

                        {isAdmin && (
                            <button onClick={handleDelete} disabled={!dataLote} className="btn-delete">
                                Eliminar
                            </button>
                        )}
                    </div>
                </div>

                <div className="filter-section">
                    <div className="filter-row-3">
                        <div className="filter-group">
                            <label>Código</label>
                            <input name="codigo" placeholder="Ej: 1225-01" value={filters.codigo} onChange={handleFilterChange} />
                        </div>
                        <div className="filter-group">
                            <label>Proveedor</label>
                            <input name="proveedorNombre" placeholder="Ej: Pedro..." value={filters.proveedorNombre} onChange={handleFilterChange} />
                        </div>
                        <div className="filter-group">
                            <label>Producto</label>
                            <input name="materiaPrimaNombre" placeholder="Ej: Jaiba..." value={filters.materiaPrimaNombre} onChange={handleFilterChange} />
                        </div>
                    </div>

                    <div className="filter-row-2">
                        <div className="filter-group">
                            <label>Fecha</label>
                            <input name="fechaFormateada" placeholder="Ej: 21-11-2025" value={filters.fechaFormateada} onChange={handleFilterChange} />
                        </div>
                        <div className="filter-group">
                            <label>Estado</label>
                            <select name="estadoTexto" value={filters.estadoTexto} onChange={handleFilterChange}>
                                <option value="">Todos</option>
                                <option value="Abierto">Abierto</option>
                                <option value="Cerrado">Cerrado</option>
                            </select>
                        </div>
                    </div>
                </div>

                <Table
                    columns={columns}
                    data={filteredLotes}
                    onRowClick={(row) => setDataLote(row)}
                    selectedId={dataLote?.id}
                />
            </div>

            <PopupRecepcion show={isCreateOpen} setShow={setIsCreateOpen} action={handleCreateSubmit} />
            <PopupRecepcion show={isPopupOpen} setShow={setIsPopupOpen} dataToEdit={dataLote} action={handleUpdate} />
        </div>
    );
};

export default Recepcion;