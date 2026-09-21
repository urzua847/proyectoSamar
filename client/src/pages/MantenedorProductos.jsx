import { useState, useEffect } from 'react';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../services/producto.service';
import { getMateriasPrimas, createMateriaPrima, updateMateriaPrima, deleteMateriaPrima } from '../services/materiaPrima.service';
import { showToastSuccess, showToastError, confirmStrictDelete } from '../helpers/sweetAlert';
import Badge from '../components/Badge';
import ProductItem from '../components/mantenedorProductos/ProductItem';
import ModalCrearMP from '../components/mantenedorProductos/ModalCrearMP';
import ModalEditarMP from '../components/mantenedorProductos/ModalEditarMP';
import ModalCrearProducto from '../components/mantenedorProductos/ModalCrearProducto';

import ActionButton from '../components/ActionButton';
import EmptyState from '../components/EmptyState';
import '../styles/users.css';
import '../styles/popup.css';
import '../styles/mantenedorProductos.css';

const MantenedorProductos = () => {
    const [materiasPrimas, setMateriasPrimas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filterType, setFilterType] = useState('todas'); // 'todas', 'Jaiba', 'Pulpo'

    const [expandedProd, setExpandedProd] = useState([]);

    const [isCreateMPOpen, setIsCreateMPOpen] = useState(false);
    const [isCreateProdOpen, setIsCreateProdOpen] = useState(false);

    const [newMPName, setNewMPName] = useState('');
    const [newMPRendimiento, setNewMPRendimiento] = useState('');

    const [isEditMPOpen, setIsEditMPOpen] = useState(false);
    const [editMPForm, setEditMPForm] = useState({ id: null, nombre: '', rendimiento_teorico_global: '' });

    const [prodForm, setProdForm] = useState({
        nombre: '', materiaPrimaId: '', tipo: 'elaborado', origen: '', calibresStr: '', parentId: null
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mpsRes, prodsRes] = await Promise.all([getMateriasPrimas(), getProductos()]);
            if (mpsRes.status === 'Success') setMateriasPrimas(mpsRes.data);
            if (prodsRes.status === 'Success') setProductos(prodsRes.data);
            else if (prodsRes.data) setProductos(prodsRes.data);
        } catch (error) {
            console.error(error);
            showToastError('Error cargando catálogo de productos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const handleCreateMP = async (e) => {
        e.preventDefault();
        if (!newMPName.trim()) return;
        const payload = {
            nombre: newMPName.trim(),
            rendimiento_teorico_global: newMPRendimiento !== '' ? Number(newMPRendimiento) : null
        };
        const res = await createMateriaPrima(payload);
        if (res.status === 'Success') {
            showToastSuccess('Materia Prima creada exitosamente');
            setNewMPName(''); setNewMPRendimiento('');
            setIsCreateMPOpen(false);
            fetchData();
        } else {
            showToastError(res.message || 'Error al crear Materia Prima');
        }
    };

    const openEditMP = (mp) => {
        setEditMPForm({
            id: mp.id, nombre: mp.nombre || '',
            rendimiento_teorico_global: mp.rendimiento_teorico_global !== null && mp.rendimiento_teorico_global !== undefined ? String(mp.rendimiento_teorico_global) : ''
        });
        setIsEditMPOpen(true);
    };

    const handleUpdateMP = async (e) => {
        e.preventDefault();
        if (!editMPForm.nombre.trim()) return;
        const payload = {
            nombre: editMPForm.nombre.trim(),
            rendimiento_teorico_global: editMPForm.rendimiento_teorico_global !== '' ? Number(editMPForm.rendimiento_teorico_global) : null
        };
        const res = await updateMateriaPrima(editMPForm.id, payload);
        if (res.status === 'Success') {
            showToastSuccess('Materia Prima actualizada');
            setIsEditMPOpen(false); fetchData();
        } else {
            showToastError(res.message || 'Error al actualizar Materia Prima');
        }
    };

    const handleDeleteMP = async (mp) => {
        const confirm = await confirmStrictDelete(mp.nombre, 'Se eliminarán también las asociaciones de sus productos si no tienen stock activo.');
        if (confirm.isConfirmed) {
            const res = await deleteMateriaPrima(mp.id);
            if (res.status === 'Success' || res.data) {
                showToastSuccess(`Materia Prima "${mp.nombre}" eliminada`);
                fetchData();
            } else {
                showToastError(res.message || 'No se puede eliminar si tiene productos vinculados');
            }
        }
    };

    const openCreateProduct = (mpId = null) => {
        setProdForm({ ...prodForm, materiaPrimaId: mpId || '', parentId: mpId || '', nombre: '', calibresStr: '', origen: '' });
        setIsCreateProdOpen(true);
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        const payload = {
            nombre: prodForm.nombre, materiaPrimaId: prodForm.materiaPrimaId,
            tipo: prodForm.tipo, origen: prodForm.origen, calibres: prodForm.calibresStr
        };
        const res = await createProducto(payload);
        if (res.status === 'Success') {
            showToastSuccess('Producto derivado creado exitosamente');
            setIsCreateProdOpen(false); fetchData();
        } else {
            showToastError(res.message || 'Error al crear producto');
        }
    };

    const handleDeleteProduct = async (prod) => {
        const confirm = await confirmStrictDelete(prod.nombre);
        if (confirm.isConfirmed) {
            const res = await deleteProducto(prod.id);
            if (res.status === 'Success') {
                showToastSuccess(`Producto "${prod.nombre}" eliminado`);
                fetchData();
            } else {
                showToastError(res.message || 'Error al eliminar producto');
            }
        }
    };

    const handleAddCalibre = async (prod, val) => {
        if (!val.trim()) return;
        const current = prod.calibres || [];
        if (current.includes(val.trim())) { showToastError('El calibre ya existe para este producto'); return; }
        const updated = [...current, val.trim()];
        const res = await updateProducto(prod.id, { calibres: updated });
        if (res.status === 'Success') {
            showToastSuccess(`Calibre "${val.trim()}" agregado`);
            setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, calibres: updated } : p));
        } else {
            showToastError('Error al actualizar calibres');
        }
    };

    const handleRemoveCalibre = async (prod, val) => {
        const updated = (prod.calibres || []).filter(c => c !== val);
        const res = await updateProducto(prod.id, { calibres: updated });
        if (res.status === 'Success') {
            showToastSuccess(`Calibre "${val}" eliminado`);
            setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, calibres: updated } : p));
        } else {
            showToastError('Error al eliminar calibre');
        }
    };

    const toggleProd = (id) => setExpandedProd(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    const mpsFiltered = materiasPrimas.filter(mp => filterType === 'todas' || mp.nombre === filterType);

    return (
        <div className="main-container">
            <div className="table-wrapper">
                <div className="top-table" style={{ marginBottom: '24px', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <h1 className="title-table" style={{ fontSize: '1.8rem', margin: 0, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
                            Catálogo de Productos
                        </h1>
                        <div className="action-buttons">
                            <button 
                                className="btn-new" 
                                onClick={() => openCreateProduct()}
                                style={{ background: '#475569', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: '10px' }}
                            >
                                + Nuevo Producto
                            </button>
                            <button 
                                className="btn-new" 
                                onClick={() => setIsCreateMPOpen(true)}
                                style={{ background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#ffffff', border: 'none', padding: '10px 20px', borderRadius: '10px' }}
                            >
                                + Nueva Materia Prima
                            </button>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
                        <button
                            onClick={() => setFilterType('todas')}
                            style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: filterType === 'todas' ? '#1e293b' : '#e2e8f0', color: filterType === 'todas' ? '#fff' : '#475569', fontWeight: 600 }}
                        >Todas</button>
                        <button
                            onClick={() => setFilterType('Jaiba')}
                            style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: filterType === 'Jaiba' ? '#1e293b' : '#e2e8f0', color: filterType === 'Jaiba' ? '#fff' : '#475569', fontWeight: 600 }}
                        >Jaiba</button>
                        <button
                            onClick={() => setFilterType('Pulpo')}
                            style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', background: filterType === 'Pulpo' ? '#1e293b' : '#e2e8f0', color: filterType === 'Pulpo' ? '#fff' : '#475569', fontWeight: 600 }}
                        >Pulpo</button>
                    </div>
                </div>

                {loading ? (
                    <p style={{ padding: '20px', color: '#666' }}>Cargando catálogo...</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                        {mpsFiltered.map(mp => {
                            const mpProds = productos.filter(p => String(p.materiaPrima?.id || p.materiaPrimaId) === String(mp.id));
                            const primarios = mpProds.filter(p => p.tipo === 'primario');
                            const elaborados = mpProds.filter(p => p.tipo === 'elaborado');

                            return (
                                <div key={mp.id} style={{ background: '#f8fafc', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a', fontWeight: 800 }}>{mp.nombre}</h2>
                                            {mp.rendimiento_teorico_global && (
                                                <Badge status="success" variant="solid" size="medium">
                                                    Meta Rendimiento: {Number(mp.rendimiento_teorico_global).toFixed(1)}%
                                                </Badge>
                                            )}
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <ActionButton variant="edit" title="Editar Materia Prima" onClick={() => openEditMP(mp)} />
                                            <ActionButton variant="delete" title="Eliminar Materia Prima" onClick={() => handleDeleteMP(mp)} />
                                        </div>
                                    </div>

                                    {mpProds.length === 0 ? (
                                        <p style={{ color: '#64748b', fontStyle: 'italic' }}>No hay productos asociados a esta materia prima.</p>
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            {primarios.length > 0 && (
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid rgba(226, 232, 240, 0.8)' }}>
                                                        <div style={{ width: '8px', height: '24px', borderRadius: '4px', background: 'linear-gradient(180deg, #38bdf8, #0284c7)' }}></div>
                                                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>Productos Primarios</h3>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {primarios.map(prod => (
                                                            <ProductItem
                                                                key={prod.id} prod={prod} expandedProd={expandedProd} toggleProd={toggleProd}
                                                                handleDeleteProduct={handleDeleteProduct} handleRemoveCalibre={handleRemoveCalibre} handleAddCalibre={handleAddCalibre}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {elaborados.length > 0 && (
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '2px solid rgba(226, 232, 240, 0.8)' }}>
                                                        <div style={{ width: '8px', height: '24px', borderRadius: '4px', background: 'linear-gradient(180deg, #4ade80, #16a34a)' }}></div>
                                                        <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: '800', color: '#0f172a' }}>Productos Elaborados</h3>
                                                    </div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {elaborados.map(prod => (
                                                            <ProductItem
                                                                key={prod.id} prod={prod} expandedProd={expandedProd} toggleProd={toggleProd}
                                                                handleDeleteProduct={handleDeleteProduct} handleRemoveCalibre={handleRemoveCalibre} handleAddCalibre={handleAddCalibre}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {mpsFiltered.length === 0 && <p style={{ color: '#666', textAlign: 'center', padding: '40px' }}>No hay materias primas con ese filtro.</p>}
                    </div>
                )}
            </div>
            
            <ModalCrearMP isOpen={isCreateMPOpen} onClose={() => setIsCreateMPOpen(false)} newMPName={newMPName} setNewMPName={setNewMPName} newMPRendimiento={newMPRendimiento} setNewMPRendimiento={setNewMPRendimiento} handleCreateMP={handleCreateMP} />
            <ModalEditarMP isOpen={isEditMPOpen} onClose={() => setIsEditMPOpen(false)} editMPForm={editMPForm} setEditMPForm={setEditMPForm} handleUpdateMP={handleUpdateMP} />
            <ModalCrearProducto isOpen={isCreateProdOpen} onClose={() => setIsCreateProdOpen(false)} materiasPrimas={materiasPrimas} productos={productos} prodForm={prodForm} setProdForm={setProdForm} handleCreateProduct={handleCreateProduct} />
        </div>
    );
};
export default MantenedorProductos;
