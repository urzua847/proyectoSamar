import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEntidades, createEntidad, updateEntidad, deleteEntidad } from '../services/entidad.service';
import { showSuccessAlert, showErrorAlert, deleteDataAlert } from '../helpers/sweetAlert';
import Table from '../components/Table';
import Search from '../components/Search';
import '../styles/users.css';
import '../styles/popup.css';

const MantenedorEntidades = () => {
    const navigate = useNavigate();
    const [entidades, setEntidades] = useState([]);
    const [filterType, setFilterType] = useState('todos');
    const [filterName, setFilterName] = useState('');
    const [loading, setLoading] = useState(false);

    const [selectedEntidad, setSelectedEntidad] = useState(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const initialForm = { id: null, nombre: '', rut: '', direccion: '', telefono: '', email: '', giro: '', tipo: 'cliente' };
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
        const matchesType = filterType === 'todos' ? true : e.tipo === filterType;
        const matchesName = e.nombre.toLowerCase().includes(filterName.toLowerCase());
        return matchesType && matchesName;
    });



    const columns = [
        { header: "Nombre", accessor: "nombre" },
        { header: "RUT", accessor: "rut" },
        { header: "Dirección", accessor: "direccion" },
        {
            header: "Tipo",
            accessor: "tipo",
            render: (row) => (
                <span style={{
                    backgroundColor: '#f1f5f9',
                    color: '#475569',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                }}>
                    {row.tipo}
                </span>
            )
        },
        { header: "Teléfono", accessor: "telefono" },
        { header: "Email", accessor: "email" }
    ];

    return (
        <div className="main-container">
            <div className='table-wrapper'>
                <div className="top-table">
                    <h1 className='title-table'>Gestión de Entidades</h1>

                    <div className='action-buttons'>
                        <button onClick={handleOpenCreate} className="btn-new">
                            <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>+</span> Nueva Entidad
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

                <div className="table-container-box">
                    <div style={{ marginBottom: '15px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <Search
                            value={filterName}
                            onChange={(e) => setFilterName(e.target.value)}
                            placeholder="Buscar por nombre..."
                        />
                        <div style={{ display: 'flex', gap: '5px' }}>
                            {['todos', 'cliente', 'proveedor'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    style={{
                                        padding: '8px 15px',
                                        border: 'none',
                                        borderBottom: filterType === type ? `3px solid ${type === 'proveedor' ? '#28a745' : '#003366'}` : '3px solid transparent',
                                        background: 'transparent',
                                        fontWeight: filterType === type ? 'bold' : 'normal',
                                        cursor: 'pointer',
                                        fontSize: '0.95rem',
                                        textTransform: 'capitalize',
                                        color: filterType === type ? '#000' : '#666'
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
                            onRowDoubleClick={(row) => {
                                if (row && row.id) {
                                    navigate(`/entidades/${row.id}`);
                                }
                            }}
                            selectedId={selectedEntidad?.id}
                        />
                    )}
                </div>

                {isModalOpen && (
                    <div className="bg">
                        <div className="popup" style={{ maxWidth: '620px', width: '95%', padding: '0', overflow: 'hidden' }}>
                            {/* Header bar */}
                            <div style={{
                                background: 'linear-gradient(135deg, #003366 0%, #00509e 100%)',
                                padding: '20px 28px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <h2 style={{ color: '#fff', margin: 0, fontSize: '1.3rem', fontWeight: '700', letterSpacing: '0.3px' }}>
                                    {isEditMode ? 'Editar Entidad' : 'Nueva Entidad'}
                                </h2>
                                <button className="close" onClick={() => setIsModalOpen(false)} style={{
                                    position: 'static',
                                    background: 'rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>✕</button>
                            </div>
                            {/* Body */}
                            <div style={{ padding: '28px 32px 32px' }}>
                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#444' }}>Nombre *</label>
                                            <input className="form-control" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} required style={{ padding: '10px 12px' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#444' }}>Tipo *</label>
                                            <select className="form-control" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} disabled={isEditMode} style={{ padding: '10px 12px' }}>
                                                <option value="cliente">Cliente</option>
                                                <option value="proveedor">Proveedor</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#444' }}>RUT</label>
                                            <input className="form-control" value={form.rut} onChange={e => setForm({ ...form, rut: e.target.value })} style={{ padding: '10px 12px' }} />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#444' }}>Teléfono</label>
                                            <input className="form-control" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} style={{ padding: '10px 12px' }} />
                                        </div>
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#444' }}>Email</label>
                                        <input type="email" className="form-control" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} style={{ padding: '10px 12px' }} />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#444' }}>Dirección</label>
                                        <input className="form-control" value={form.direccion || ''} onChange={e => setForm({ ...form, direccion: e.target.value })} style={{ padding: '10px 12px' }} />
                                    </div>

                                    <div>
                                        <label style={{ display: 'block', marginBottom: '6px', fontWeight: '600', fontSize: '0.9rem', color: '#444' }}>Giro</label>
                                        <input className="form-control" value={form.giro || ''} onChange={e => setForm({ ...form, giro: e.target.value })} style={{ padding: '10px 12px' }} />
                                    </div>

                                    <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '20px', marginTop: '4px' }}>
                                        <button type="submit" className="btn-new" style={{ width: '100%', padding: '12px', fontSize: '1rem' }}>Guardar</button>
                                    </div>
                                </form>
                            </div>{/* /Body */}
                        </div>{/* /popup */}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MantenedorEntidades;
