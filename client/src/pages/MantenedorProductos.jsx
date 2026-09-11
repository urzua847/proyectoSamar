import { useState, useEffect } from 'react';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../services/producto.service';
import { getMateriasPrimas, createMateriaPrima, updateMateriaPrima, deleteMateriaPrima } from '../services/materiaPrima.service';
import { showToastSuccess, showToastError, confirmStrictDelete } from '../helpers/sweetAlert';
import Badge from '../components/Badge';
import ActionButton from '../components/ActionButton';
import EmptyState from '../components/EmptyState';
import '../styles/users.css';
import '../styles/popup.css';
import '../styles/mantenedorProductos.css';

const MantenedorProductos = () => {
    const [materiasPrimas, setMateriasPrimas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedMPId, setSelectedMPId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');

    const [expandedProd, setExpandedProd] = useState([]);

    const [isCreateMPOpen, setIsCreateMPOpen] = useState(false);
    const [isCreateProdOpen, setIsCreateProdOpen] = useState(false);

    const [newMPName, setNewMPName] = useState('');
    const [newMPRendimiento, setNewMPRendimiento] = useState('');

    const [isEditMPOpen, setIsEditMPOpen] = useState(false);
    const [editMPForm, setEditMPForm] = useState({ id: null, nombre: '', rendimiento_teorico_global: '' });

    const [prodForm, setProdForm] = useState({
        nombre: '', materiaPrimaId: '', tipo: 'elaborado', origen: '', calibresStr: '',
        parentId: null
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [mpsRes, prodsRes] = await Promise.all([getMateriasPrimas(), getProductos()]);
            if (mpsRes.status === 'Success') {
                setMateriasPrimas(mpsRes.data);
                if (mpsRes.data.length > 0 && !selectedMPId) {
                    setSelectedMPId(mpsRes.data[0].id);
                }
            }
            if (prodsRes.status === 'Success') setProductos(prodsRes.data);
            else if (prodsRes.data) setProductos(prodsRes.data);
        } catch (error) {
            console.error(error);
            showToastError('Error cargando catálogo de productos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

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
            setNewMPName('');
            setNewMPRendimiento('');
            setIsCreateMPOpen(false);
            if (res.data && res.data.id) setSelectedMPId(res.data.id);
            fetchData();
        } else {
            showToastError(res.message || 'Error al crear Materia Prima');
        }
    };

    const openEditMP = (mp) => {
        setEditMPForm({
            id: mp.id,
            nombre: mp.nombre || '',
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
            setIsEditMPOpen(false);
            fetchData();
        } else {
            showToastError(res.message || 'Error al actualizar Materia Prima');
        }
    };

    const handleDeleteMP = async (mp) => {
        const confirm = await confirmStrictDelete(
            mp.nombre,
            'Se eliminarán también las asociaciones de sus productos si no tienen stock activo.'
        );
        if (confirm.isConfirmed) {
            const res = await deleteMateriaPrima(mp.id);
            if (res.status === 'Success' || res.data) {
                showToastSuccess(`Materia Prima "${mp.nombre}" eliminada`);
                const remaining = materiasPrimas.filter(m => m.id !== mp.id);
                setSelectedMPId(remaining.length > 0 ? remaining[0].id : null);
                fetchData();
            } else {
                showToastError(res.message || 'No se puede eliminar si tiene productos vinculados');
            }
        }
    };

    const openCreateProduct = (mpId) => {
        setProdForm({ ...prodForm, materiaPrimaId: mpId, parentId: mpId, nombre: '', calibresStr: '', origen: '' });
        setIsCreateProdOpen(true);
    };

    const handleCreateProduct = async (e) => {
        e.preventDefault();
        const payload = {
            nombre: prodForm.nombre,
            materiaPrimaId: prodForm.materiaPrimaId,
            tipo: prodForm.tipo,
            origen: prodForm.origen,
            calibres: prodForm.calibresStr
        };
        const res = await createProducto(payload);
        if (res.status === 'Success') {
            showToastSuccess('Producto derivado creado exitosamente');
            setIsCreateProdOpen(false);
            fetchData();
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
        if (current.includes(val.trim())) {
            showToastError('El calibre ya existe para este producto');
            return;
        }
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

    // Filtrado de materias primas por búsqueda
    const filteredMPs = materiasPrimas.filter(mp =>
        mp.nombre.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const selectedMP = materiasPrimas.find(m => String(m.id) === String(selectedMPId));

    const selectedMPProducts = selectedMP ? productos.filter(p => {
        const pMpId = p.materiaPrima?.id || p.materiaPrimaId;
        return String(pMpId) === String(selectedMP.id);
    }) : [];

    const primarios = selectedMPProducts.filter(p => p.tipo === 'primario');
    const elaborados = selectedMPProducts.filter(p => p.tipo === 'elaborado');

    return (
        <div className="main-container">
            <div className="table-wrapper">
                <div className="top-table">
                    <h1 className="title-table" style={{ fontSize: '1.5rem', margin: 0 }}>Gestión de Catálogo de Productos</h1>
                    <div className="action-buttons">
                        <button className="btn-new" onClick={() => setIsCreateMPOpen(true)}>
                            <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>+</span> Nueva Materia Prima
                        </button>
                    </div>
                </div>

                {loading && materiasPrimas.length === 0 ? (
                    <p style={{ padding: '20px', color: '#666' }}>Cargando catálogo...</p>
                ) : (
                    <div className="master-detail-container">
                        {/* Panel Izquierdo: Lista Maestro */}
                        <div className="master-panel">
                            <div className="master-panel__header">
                                <div className="master-panel__title">
                                    <span>Materias Primas</span>
                                    <Badge status="info" variant="subtle">{filteredMPs.length}</Badge>
                                </div>
                                <input
                                    type="text"
                                    className="master-panel__search"
                                    placeholder="Buscar categoría..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="master-panel__list">
                                {filteredMPs.length > 0 ? (
                                    filteredMPs.map(mp => {
                                        const count = productos.filter(p => {
                                            const pMpId = p.materiaPrima?.id || p.materiaPrimaId;
                                            return String(pMpId) === String(mp.id);
                                        }).length;
                                        const isActive = String(mp.id) === String(selectedMPId);

                                        return (
                                            <div
                                                key={mp.id}
                                                className={`master-item ${isActive ? 'master-item--active' : ''}`}
                                                onClick={() => setSelectedMPId(mp.id)}
                                            >
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span className="master-item__name">{mp.nombre}</span>
                                                    <span style={{ fontSize: '0.75rem', color: isActive ? '#e0f2fe' : '#64748b' }}>
                                                        {mp.rendimiento_teorico_global !== null && mp.rendimiento_teorico_global !== undefined && mp.rendimiento_teorico_global !== '' ? (
                                                            <span>Meta: <strong>{Number(mp.rendimiento_teorico_global).toFixed(1)}%</strong></span>
                                                        ) : (
                                                            <span style={{ fontStyle: 'italic', opacity: 0.8 }}>Meta: No definido (-)</span>
                                                        )}
                                                    </span>
                                                </div>
                                                <span className="master-item__count">{count} items</span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div style={{ padding: '20px 10px', textAlign: 'center', color: '#888', fontSize: '0.875rem' }}>
                                        No se encontraron categorías.
                                    </div>
                                )}
                            </div>

                            <div className="master-panel__footer">
                                <button
                                    className="btn-new"
                                    onClick={() => setIsCreateMPOpen(true)}
                                    style={{ width: '100%', justifyContent: 'center' }}
                                >
                                    + Crear Materia Prima
                                </button>
                            </div>
                        </div>

                        {/* Panel Derecho: Detalle y Gestión de Productos */}
                        <div className="detail-panel">
                            {selectedMP ? (
                                <>
                                    <div className="detail-panel__header">
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <h2 className="detail-panel__title" style={{ margin: 0 }}>{selectedMP.nombre}</h2>
                                                {selectedMP.rendimiento_teorico_global !== null && selectedMP.rendimiento_teorico_global !== undefined && selectedMP.rendimiento_teorico_global !== '' ? (
                                                    <Badge status="success" variant="solid" size="medium">
                                                        Meta: {Number(selectedMP.rendimiento_teorico_global).toFixed(1)}%
                                                    </Badge>
                                                ) : (
                                                    <Badge status="neutral" variant="subtle" size="medium">
                                                        No definido (-)
                                                    </Badge>
                                                )}
                                            </div>
                                            <p style={{ margin: '6px 0 0 0', color: '#6b7280', fontSize: '0.875rem' }}>
                                                {selectedMPProducts.length} productos derivados registrados
                                            </p>
                                        </div>

                                        <div className="detail-panel__actions">
                                            <button
                                                className="btn-new"
                                                onClick={() => openCreateProduct(selectedMP.id)}
                                                style={{ padding: '8px 16px', fontSize: '0.875rem' }}
                                            >
                                                + Nuevo Producto
                                            </button>
                                            <ActionButton
                                                variant="edit"
                                                title="Editar Materia Prima"
                                                onClick={() => openEditMP(selectedMP)}
                                            />
                                            <ActionButton
                                                variant="delete"
                                                title="Eliminar Materia Prima"
                                                onClick={() => handleDeleteMP(selectedMP)}
                                            />
                                        </div>
                                    </div>

                                    {selectedMPProducts.length === 0 ? (
                                        <EmptyState
                                            title="Catálogo Vacío"
                                            description={`La Materia Prima "${selectedMP.nombre}" aún no tiene productos derivados.`}
                                            actionLabel="Crear Primer Producto"
                                            onAction={() => openCreateProduct(selectedMP.id)}
                                        />
                                    ) : (
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                            {/* Productos Primarios */}
                                            {primarios.length > 0 && (
                                                <div>
                                                    <h3 style={{
                                                        margin: '0 0 12px 0',
                                                        fontSize: '1rem',
                                                        fontWeight: '700',
                                                        color: '#0284c7',
                                                        borderBottom: '2px solid #bae6fd',
                                                        paddingBottom: '6px'
                                                    }}>
                                                        Productos Primarios (Origen / Rendimiento)
                                                    </h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {primarios.map(prod => (
                                                            <ProductItem
                                                                key={prod.id}
                                                                prod={prod}
                                                                expandedProd={expandedProd}
                                                                toggleProd={toggleProd}
                                                                handleDeleteProduct={handleDeleteProduct}
                                                                handleRemoveCalibre={handleRemoveCalibre}
                                                                handleAddCalibre={handleAddCalibre}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Productos Elaborados */}
                                            {elaborados.length > 0 && (
                                                <div>
                                                    <h3 style={{
                                                        margin: '0 0 12px 0',
                                                        fontSize: '1rem',
                                                        fontWeight: '700',
                                                        color: '#16a34a',
                                                        borderBottom: '2px solid #bbf7d0',
                                                        paddingBottom: '6px'
                                                    }}>
                                                        Productos Elaborados (Envasados)
                                                    </h3>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        {elaborados.map(prod => (
                                                            <ProductItem
                                                                key={prod.id}
                                                                prod={prod}
                                                                expandedProd={expandedProd}
                                                                toggleProd={toggleProd}
                                                                handleDeleteProduct={handleDeleteProduct}
                                                                handleRemoveCalibre={handleRemoveCalibre}
                                                                handleAddCalibre={handleAddCalibre}
                                                            />
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </>
                            ) : (
                                <EmptyState
                                    title="Selecciona una Materia Prima"
                                    description="Haz clic en cualquier materia prima del panel izquierdo para ver y gestionar su catálogo de productos."
                                    actionLabel="Crear Materia Prima"
                                    onAction={() => setIsCreateMPOpen(true)}
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Crear Materia Prima */}
            {isCreateMPOpen && (
                <div className="bg" onClick={() => setIsCreateMPOpen(false)}>
                    <div className="popup" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
                        <button className="btn-close-x" onClick={() => setIsCreateMPOpen(false)}>✕</button>
                        <h2>Nueva Materia Prima</h2>
                        <form onSubmit={handleCreateMP}>
                            <div className="container_inputs">
                                <label>Nombre Categoría</label>
                                <input
                                    autoFocus
                                    placeholder="Ej: Salmón, Jibia, Jaiba, Pulpo"
                                    value={newMPName}
                                    onChange={e => setNewMPName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="container_inputs" style={{ marginTop: '14px' }}>
                                <label>Rendimiento Teórico Esperado (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    placeholder="Ej: 45.00"
                                    value={newMPRendimiento}
                                    onChange={e => setNewMPRendimiento(e.target.value)}
                                />
                                <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginTop: '4px' }}>
                                    Porcentaje meta tras proceso y empaque. Déjalo en blanco si la empresa aún no lo define.
                                </span>
                            </div>
                            <div className="popup-actions" style={{ marginTop: '20px' }}>
                                <button type="button" className="btn-cancel" onClick={() => setIsCreateMPOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-save">Guardar Categoría</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Editar Materia Prima */}
            {isEditMPOpen && (
                <div className="bg" onClick={() => setIsEditMPOpen(false)}>
                    <div className="popup" onClick={e => e.stopPropagation()} style={{ maxWidth: '460px' }}>
                        <button className="btn-close-x" onClick={() => setIsEditMPOpen(false)}>✕</button>
                        <h2>Editar Materia Prima</h2>
                        <form onSubmit={handleUpdateMP}>
                            <div className="container_inputs">
                                <label>Nombre Categoría</label>
                                <input
                                    autoFocus
                                    placeholder="Ej: Salmón, Jibia, Jaiba, Pulpo"
                                    value={editMPForm.nombre}
                                    onChange={e => setEditMPForm({ ...editMPForm, nombre: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="container_inputs" style={{ marginTop: '14px' }}>
                                <label>Rendimiento Teórico Esperado (%)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    placeholder="Ej: 45.00"
                                    value={editMPForm.rendimiento_teorico_global}
                                    onChange={e => setEditMPForm({ ...editMPForm, rendimiento_teorico_global: e.target.value })}
                                />
                                <span style={{ fontSize: '0.8rem', color: '#6b7280', display: 'block', marginTop: '4px' }}>
                                    Porcentaje meta tras proceso y empaque. Déjalo en blanco si la empresa aún no lo define.
                                </span>
                            </div>
                            <div className="popup-actions" style={{ marginTop: '20px' }}>
                                <button type="button" className="btn-cancel" onClick={() => setIsEditMPOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-save">Actualizar Categoría</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Crear Producto */}
            {isCreateProdOpen && (
                <div className="bg" onClick={() => setIsCreateProdOpen(false)}>
                    <div className="popup" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                        <button className="btn-close-x" onClick={() => setIsCreateProdOpen(false)}>✕</button>
                        <h2>Nuevo Producto Derivado</h2>
                        <p className="popup-subtitle">
                            Materia Prima: <strong>{materiasPrimas.find(m => String(m.id) === String(prodForm.materiaPrimaId))?.nombre}</strong>
                        </p>

                        <form onSubmit={handleCreateProduct}>
                            <div className="container_inputs">
                                <label>Nombre del Producto</label>
                                <input
                                    placeholder="Ej: Filete Trim D, Carne Picada"
                                    value={prodForm.nombre}
                                    onChange={e => setProdForm({ ...prodForm, nombre: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="container_inputs">
                                <label>Tipo de Producto</label>
                                <select value={prodForm.tipo} onChange={e => setProdForm({ ...prodForm, tipo: e.target.value })}>
                                    <option value="elaborado">Elaborado (Envasado)</option>
                                    <option value="primario">Primario (Procesado)</option>
                                </select>
                            </div>

                            {prodForm.tipo === 'elaborado' && (
                                <div className="container_inputs">
                                    <label>Origen de Rendimiento</label>
                                    <select
                                        value={prodForm.origen}
                                        onChange={e => setProdForm({ ...prodForm, origen: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Seleccione Rendimiento --</option>
                                        <option value="carne_blanca">Carne Blanca</option>
                                        <option value="pinza">Pinzas</option>
                                    </select>
                                </div>
                            )}

                            <div className="container_inputs">
                                <label>Calibres / Variantes (opcional, separados por coma)</label>
                                <input
                                    value={prodForm.calibresStr}
                                    onChange={e => setProdForm({ ...prodForm, calibresStr: e.target.value })}
                                    placeholder="Ej: 100g, 200g, Standard"
                                />
                            </div>

                            <div className="popup-actions">
                                <button type="button" className="btn-cancel" onClick={() => setIsCreateProdOpen(false)}>Cancelar</button>
                                <button type="submit" className="btn-save">Crear Producto</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

const ProductItem = ({ prod, expandedProd, toggleProd, handleDeleteProduct, handleRemoveCalibre, handleAddCalibre }) => {
    const isProdExpanded = expandedProd.includes(prod.id);
    const [newCalibre, setNewCalibre] = useState('');

    const handleAdd = () => {
        if (newCalibre.trim()) {
            handleAddCalibre(prod, newCalibre.trim());
            setNewCalibre('');
        }
    };

    return (
        <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            overflow: 'hidden',
            backgroundColor: '#ffffff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
            <div
                style={{
                    padding: '12px 16px',
                    background: '#f9fafb',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    userSelect: 'none'
                }}
                onClick={() => toggleProd(prod.id)}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <strong style={{ color: '#1f2937', fontSize: '0.95rem' }}>{prod.nombre}</strong>
                    {prod.origen && prod.tipo === 'elaborado' && (
                        <Badge status="info" variant="subtle">Origen: {prod.origen}</Badge>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={e => e.stopPropagation()}>
                    <ActionButton
                        variant="delete"
                        title="Eliminar Producto"
                        onClick={() => handleDeleteProduct(prod)}
                    />
                    <span style={{ color: '#6b7280', fontSize: '0.8rem', padding: '0 4px', cursor: 'pointer' }} onClick={() => toggleProd(prod.id)}>
                        {isProdExpanded ? '▲' : '▼'}
                    </span>
                </div>
            </div>

            {isProdExpanded && (
                <div style={{ padding: '16px', borderTop: '1px solid #f3f4f6', backgroundColor: '#ffffff' }}>
                    <h4 style={{ margin: '0 0 10px 0', fontSize: '0.85rem', color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Calibres / Variantes Disponibles
                    </h4>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', textAlign: 'left', color: '#475569' }}>
                                <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', fontWeight: 600 }}>Calibre / Nombre</th>
                                <th style={{ padding: '8px 12px', borderBottom: '1px solid #e2e8f0', width: '90px', textAlign: 'center', fontWeight: 600 }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(prod.calibres || []).map((cal, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '8px 12px', color: '#334155' }}>{cal}</td>
                                    <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCalibre(prod, cal)}
                                            style={{
                                                color: '#ef4444',
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '0.8rem',
                                                fontWeight: 600
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}

                            {(!prod.calibres || prod.calibres.length === 0) && (
                                <tr>
                                    <td colSpan="2" style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                        Sin calibres configurados
                                    </td>
                                </tr>
                            )}

                            <tr style={{ background: '#f8fafc' }}>
                                <td style={{ padding: '6px 12px' }}>
                                    <input
                                        placeholder="Agregar nuevo calibre (ej: 100g, Standard)..."
                                        value={newCalibre}
                                        onChange={e => setNewCalibre(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                                        style={{
                                            width: '100%',
                                            padding: '6px 10px',
                                            border: '1px solid #cbd5e1',
                                            borderRadius: '4px',
                                            fontSize: '0.85rem',
                                            outline: 'none'
                                        }}
                                    />
                                </td>
                                <td style={{ padding: '6px 12px', textAlign: 'center' }}>
                                    <button
                                        type="button"
                                        onClick={handleAdd}
                                        style={{
                                            background: '#003366',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '6px 12px',
                                            borderRadius: '4px',
                                            cursor: 'pointer',
                                            fontSize: '0.8rem',
                                            fontWeight: 600
                                        }}
                                    >
                                        Agregar
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default MantenedorProductos;