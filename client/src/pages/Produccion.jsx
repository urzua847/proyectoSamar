import { useState, useMemo } from 'react';
import Table from '../components/Table';
import useGetProducciones from '../hooks/produccion/useGetProducciones';
import PopupProduccion from '../components/PopupProduccion';
import PopupTraslado from '../components/produccion/PopupTraslado';
import '../styles/users.css';

const Produccion = () => {
    const { producciones, fetchProducciones } = useGetProducciones();
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isTrasladoOpen, setIsTrasladoOpen] = useState(false);

    const [filters, setFilters] = useState({
        loteCodigo: '',
        proveedorNombre: '',
        materiaPrimaNombre: '',
        productoFinalNombre: '',
        ubicacionNombre: ''
    });

    // Columnas según tu orden específico
    const columns = [
        { header: "Lote", accessor: "loteCodigo" },
        { header: "Recepción", accessor: "fechaRecepcion" },
        { header: "Proveedor", accessor: "proveedorNombre" },
        { header: "Producto (MP)", accessor: "materiaPrimaNombre" },
        { header: "Producto Final", accessor: "productoFinalNombre" },
        { header: "Peso (Kg)", accessor: "peso_neto_kg" },
        { header: "Calibre", accessor: "calibre" },
        {
            header: "Estado Lote",
            accessor: "estadoLote",
            render: (row) => (
                <span style={{
                    color: row.estadoLote === 'Abierto' ? '#28a745' : '#dc3545',
                    fontWeight: 'bold'
                }}>
                    {row.estadoLote}
                </span>
            )
        },
        { header: "Cámara", accessor: "ubicacionNombre" }
    ];

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const filteredData = useMemo(() => {
        if (!producciones) return [];
        return producciones.filter(item => {
            return Object.keys(filters).every(key => {
                if (!filters[key]) return true;
                const itemValue = String(item[key] || '').toLowerCase();
                const filterValue = filters[key].toLowerCase();
                return itemValue.includes(filterValue);
            });
        });
    }, [producciones, filters]);

    return (
        <div className="main-container">
            <div className="table-wrapper">
                <div className="top-table">
                    <h1 className="title-table">Historial de Producción</h1>
                    <div className="action-buttons" style={{ display: 'flex', gap: '10px' }}>
                        <button onClick={() => setIsCreateOpen(true)} className="btn-new">
                            Ingresar Producción
                        </button>
                        <button onClick={() => setIsTrasladoOpen(true)} className="btn-new" style={{ backgroundColor: '#ffc107', color: '#000' }}>
                            Traslado a Contenedor
                        </button>
                    </div>
                </div>

                <div className="filter-section">
                    {/* Fila 1: Origen */}
                    <div className="filter-row-3">
                        <div className="filter-group">
                            <label>Lote</label>
                            <input name="loteCodigo" placeholder="Ej: 1204..." value={filters.loteCodigo} onChange={handleFilterChange} />
                        </div>
                        <div className="filter-group">
                            <label>Proveedor</label>
                            <input name="proveedorNombre" placeholder="Nombre..." value={filters.proveedorNombre} onChange={handleFilterChange} />
                        </div>
                        <div className="filter-group">
                            <label>Materia Prima</label>
                            <input name="materiaPrimaNombre" placeholder="Ej: Jaiba" value={filters.materiaPrimaNombre} onChange={handleFilterChange} />
                        </div>
                    </div>
                    {/* Fila 2: Resultado */}
                    <div className="filter-row-2">
                        <div className="filter-group">
                            <label>Producto Final</label>
                            <input name="productoFinalNombre" placeholder="Ej: Carne Codo" value={filters.productoFinalNombre} onChange={handleFilterChange} />
                        </div>
                        <div className="filter-group">
                            <label>Cámara</label>
                            <input name="ubicacionNombre" placeholder="Ej: Cámara 1" value={filters.ubicacionNombre} onChange={handleFilterChange} />
                        </div>
                    </div>
                </div>

                <Table
                    columns={columns}
                    data={filteredData}
                />
            </div>

            <PopupProduccion
                show={isCreateOpen}
                setShow={setIsCreateOpen}
                onSuccess={fetchProducciones}
            />
            <PopupTraslado
                isOpen={isTrasladoOpen}
                onClose={() => setIsTrasladoOpen(false)}
                onTrasladoSuccess={fetchProducciones}
            />
        </div>
    );
};

export default Produccion;