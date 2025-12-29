import { useState, useEffect } from 'react';
import { getEntidades, createEntidad, updateEntidad, deleteEntidad } from '../services/entidad.service';
import { showSuccessAlert, showErrorAlert, deleteDataAlert } from '../helpers/sweetAlert';
import Table from '../components/Table';
import '../styles/users.css';
import '../styles/popup.css';

const MantenedorEntidades = () => {
    const [entidades, setEntidades] = useState([]);
    const [filterType, setFilterType] = useState('todos');
    const [loading, setLoading] = useState(false);

    const [selectedEntidad, setSelectedEntidad] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const initialForm = { id: null, nombre: '', rut: '', direccion: '', telefono: '', email: '', tipo: 'cliente' };
    const [form, setForm] = useState(initialForm);

    const fetchData = async () => {
        setLoading(true);
        const res = await getEntidades();
        if (res.status === 'Success') {
            setEntidades(res.data);
            setSelectedEntidad(null);
        } else {
            if (res.message === 'No se encontraron entidades') setEntidades([]);
            else console.error(res.message);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleRowClick = (row) => {
        if (selectedEntidad && selectedEntidad.id === row.id) {
            setSelectedEntidad(null);
        } else {
            setSelectedEntidad(row);
        }
    };

    const handleOpenCreate = () => {
        setForm(initialForm);
        setIsEditMode(false);
        setIsModalOpen(true);
    };

    const handleOpenEdit = () => {
        if (!selectedEntidad) return;
        setForm(selectedEntidad);
        setIsEditMode(true);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let res;
        if (isEditMode) {
            res = await updateEntidad(form.id, form);
        } else {
            res = await createEntidad(form);
        }

        if (res.status === 'Success') {
            showSuccessAlert('Éxito', isEditMode ? 'Entidad actualizada' : 'Entidad creada');
            setIsModalOpen(false);
            fetchData();
        } else {
            showErrorAlert('Error', res.message);
        }
    };

    const handleDelete = async () => {
        if (!selectedEntidad) return;

        const confirm = await deleteDataAlert();
        if (confirm.isConfirmed) {
            const res = await deleteEntidad(selectedEntidad.id);
            if (res.status === 'Success') {
                showSuccessAlert('Eliminado', 'Entidad eliminada');
                fetchData();
            } else {
                showErrorAlert('Error', res.message);
            }
        }
    };

    const filteredEntidades = entidades.filter(e => {
        if (filterType === 'todos') return true;
        return e.tipo === filterType;
    });

    const getBadgeColor = (tipo) => tipo === 'cliente' ? '#17a2b8' : '#28a745';

    const columns = [
        { header: "Nombre", accessor: "nombre" },
        { header: "RUT", accessor: "rut", render: (row) => row.rut || '-' },
        {
            header: "Tipo",
            accessor: "tipo",
            render: (row) => (
                <span style={{
                    backgroundColor: getBadgeColor(row.tipo),
                    color: 'white',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase'
                }}>
                    {row.tipo}
                </span>
            )
        },
        {
            header: "Teléfono / Email",
            accessor: "telefono",
            render: (row) => (
                <div style={{ fontSize: '0.85rem' }}>
                    <div>{row.telefono || ''}</div>
                    <div style={{ color: '#666' }}>{row.email || ''}</div>
                </div>
            )
        }
    ];

    return (
        <div className="main-container" style={{ marginTop: '60px', padding: '20px' }}>
            <div className='table-wrapper'>
                <div className='top-table' style={{
                    marginBottom: '20px',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: '15px'
                }}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 className='title-table'>Gestión de Entidades</h1>
                            <p className='subtitle-table' style={{ margin: '5px 0 0 0', color: '#666' }}>
                                Administra Clientes y Proveedores
                            </p>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginRight: '20px' }}>
                            <button onClick={handleOpenCreate} className="btn-new">
                                + Nueva Entidad
                            </button>

                            <button
                                onClick={handleOpenEdit}
                                disabled={!selectedEntidad}
                                className='btn-edit'
                            >
                                Editar
                            </button>

                            <button
                                className='btn-delete'
                                disabled={!selectedEntidad}
                                onClick={handleDelete}
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '5px', width: '100%', borderBottom: '1px solid #ddd', paddingBottom: '0' }}>
                        {['todos', 'cliente', 'proveedor'].map(type => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                style={{
                                    padding: '8px 20px',
                                    border: 'none',
                                    borderBottom: filterType === type ? `3px solid ${type === 'proveedor' ? '#28a745' : '#003366'}` : '3px solid transparent',
                                    background: 'transparent',
                                    fontWeight: filterType === type ? 'bold' : 'normal',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    textTransform: 'capitalize',
                                    color: filterType === type ? '#000' : '#666',
                                    marginBottom: '-1px'
                                }}
                            >
                                {type}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? <p>Cargando...</p> : (
                    <Table
                        columns={columns}
                        data={filteredEntidades}
                        onRowClick={handleRowClick}
                        selectedId={selectedEntidad?.id}
                    />
                )}
            </div>

            {isModalOpen && (
                <div className="bg">
                    <div className="popup" style={{ maxWidth: '600px' }}>
                        <button className="close" onClick={() => setIsModalOpen(false)}>X</button>
                        <h2>{isEditMode ? 'Editar Entidad' : 'Nueva Entidad'}</h2>
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label>Nombre *</label>
                                <input className="form-control" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required />
                            </div>

                            <div>
                                <label>RUT</label>
                                <input className="form-control" value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })} />
                            </div>

                            <div>
                                <label>Tipo *</label>
                                <select className="form-control" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} disabled={isEditMode}>
                                    <option value="cliente">Cliente</option>
                                    <option value="proveedor">Proveedor</option>
                                </select>
                                {isEditMode && <small style={{ color: '#888' }}>El tipo no se puede cambiar.</small>}
                            </div>

                            <div style={{ gridColumn: 'span 2' }}>
                                <label>Dirección</label>
                                <input className="form-control" value={form.direccion} onChange={e => setForm({ ...form, direccion: e.target.value })} />
                            </div>

                            <div>
                                <label>Teléfono</label>
                                <input className="form-control" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} />
                            </div>

                            <div>
                                <label>Email</label>
                                <input type="email" className="form-control" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                            </div>

                            <div style={{ gridColumn: 'span 2', marginTop: '10px' }}>
                                <button type="submit" className="btn-save" style={{ width: '100%' }}>Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MantenedorEntidades;
