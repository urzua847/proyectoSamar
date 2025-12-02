import { useState, useMemo } from 'react';
import Table from '../components/Table';
import useGetRecepciones from '../hooks/recepcion/useGetRecepciones';
import useEditRecepcion from '../hooks/recepcion/useEditRecepcion';
import useRecepcion from '../hooks/recepcion/useRecepcion';
import PopupRecepcion from '../components/PopupRecepcion';
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
    
    // Estado de filtros
    const [filters, setFilters] = useState({
        codigo: '',
        proveedorNombre: '',
        materiaPrimaNombre: '',
        fechaFormateada: '',
        estadoTexto: ''
    });

    const user = JSON.parse(sessionStorage.getItem('usuario'));
    const isAdmin = user?.rol === 'administrador';

    // Columnas (Incluyendo todas las que pediste: Peso, Bandejas, etc.)
    const columns = [
        { header: "Lote", accessor: "codigo" },
        { header: "Fecha", accessor: "fechaFormateada" },
        { header: "Proveedor", accessor: "proveedorNombre" },
        { header: "Producto", accessor: "materiaPrimaNombre" },
        { header: "Peso Total", accessor: "peso_bruto_kg" },
        { header: "Bandejas", accessor: "numero_bandejas" },
        { 
            header: "Estado", 
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
                        <button 
                            onClick={() => setIsCreateOpen(true)} 
                            className="btn-new"
                        >
                            + Nuevo Ingreso
                        </button>
                        
                        <button 
                            onClick={handleEditClick} 
                            // Se deshabilita si NO hay lote seleccionado O SI tiene producción
                            disabled={!dataLote || dataLote.tieneProduccion} 
                            className="btn-edit"
                            // Opcional: Cambiar el estilo o tooltip para indicar por qué está bloqueado
                            title={dataLote?.tieneProduccion ? "No se puede editar: Tiene producción asociada" : "Editar Lote"}
                        >
                            Editar
                        </button>
                        
                        {isAdmin && (
                            <button 
                                onClick={handleDelete} 
                                disabled={!dataLote} 
                                className="btn-delete"
                            >
                                Eliminar
                            </button>
                        )}
                    </div>
                </div>

                {/* --- 2. PANEL DE FILTROS (Centrado) --- */}
                <div className="filter-section">
                    {/* Fila Superior (3 inputs) */}
                    <div className="filter-row-3">
                        <div className="filter-group">
                            <label>Lote</label>
                            <input name="codigo" placeholder="Ej: 1121-01" value={filters.codigo} onChange={handleFilterChange} />
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

                    {/* Fila Inferior (2 inputs) */}
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
                
                {/* --- 3. TABLA --- */}
                <Table
                    columns={columns}
                    data={filteredLotes}
                    onRowClick={(row) => setDataLote(row)}
                    selectedId={dataLote?.id}
                />
            </div>

            {/* POPUPS */}
            <PopupRecepcion show={isCreateOpen} setShow={setIsCreateOpen} action={handleCreateSubmit} />
            <PopupRecepcion show={isPopupOpen} setShow={setIsPopupOpen} dataToEdit={dataLote} action={handleUpdate} />
        </div>
    );
};

export default Recepcion;
