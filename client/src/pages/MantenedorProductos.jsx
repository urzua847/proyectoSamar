
import { useState, useEffect } from 'react';
import { getProductos, createProducto, updateProducto, deleteProducto } from '../services/producto.service';
import { getMateriasPrimas, createMateriaPrima, updateMateriaPrima, deleteMateriaPrima } from '../services/materiaPrima.service';
import { showSuccessAlert, showErrorAlert, deleteDataAlert } from '../helpers/sweetAlert';
import Swal from 'sweetalert2';
import '../styles/users.css';
import '../styles/popup.css';

const MantenedorProductos = () => {

    const [materiasPrimas, setMateriasPrimas] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(false);

    const [expandedMP, setExpandedMP] = useState([]);
    const [expandedProd, setExpandedProd] = useState([]);

    const [isCreateMPOpen, setIsCreateMPOpen] = useState(false);
    const [isCreateProdOpen, setIsCreateProdOpen] = useState(false);

    const [newMPName, setNewMPName] = useState('');
    const [prodForm, setProdForm] = useState({
        nombre: '', materiaPrimaId: '', tipo: 'elaborado', origen: '', calibresStr: '',
        parentId: null
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
            showErrorAlert('Error', 'Error cargando datos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateMP = async (e) => {
        e.preventDefault();
        const res = await createMateriaPrima({ nombre: newMPName });
        if (res.status === 'Success') {
            showSuccessAlert('Creado', 'Materia Prima creada');
            setNewMPName('');
            setIsCreateMPOpen(false);
            fetchData();
        } else {
            showErrorAlert('Error', res.message);
        }
    };

    const handleDeleteMP = async (id) => {
        const confirm = await deleteDataAlert();
        if (confirm.isConfirmed) {
            const res = await deleteMateriaPrima(id);
            if (res.status === 'Success' || res.data) {
                showSuccessAlert('Eliminado', 'Materia Prima eliminada');
                fetchData();
            } else {
                showErrorAlert('Error', res.message || 'No se puede eliminar si tiene productos');
            }
        }
    };

    const openCreateProduct = (mpId) => {
        setProdForm({ ...prodForm, materiaPrimaId: mpId, parentId: mpId, nombre: '', calibresStr: '' });
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
            showSuccessAlert('Creado', 'Producto Sub-derivado creado');
            setIsCreateProdOpen(false);
            fetchData();
        } else {
            showErrorAlert('Error', res.message);
        }
    };

    const handleDeleteProduct = async (id) => {
        const confirm = await deleteDataAlert();
        if (confirm.isConfirmed) {
            const res = await deleteProducto(id);
            if (res.status === 'Success') {
                showSuccessAlert('Eliminado', 'Producto eliminado');
                fetchData();
            } else {
                showErrorAlert('Error', res.message);
            }
        }
    };

    const handleAddCalibre = async (prod, val) => {
        if (!val.trim()) return;
        const current = prod.calibres || [];
        if (current.includes(val.trim())) return;
        const updated = [...current, val.trim()];
        const res = await updateProducto(prod.id, { calibres: updated });
        if (res.status === 'Success') {
            setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, calibres: updated } : p));
        }
    };

    const handleRemoveCalibre = async (prod, val) => {
        const updated = (prod.calibres || []).filter(c => c !== val);
        const res = await updateProducto(prod.id, { calibres: updated });
        if (res.status === 'Success') {
            setProductos(prev => prev.map(p => p.id === prod.id ? { ...p, calibres: updated } : p));
        }
    };

    const toggleMP = (id) => setExpandedMP(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    const toggleProd = (id) => setExpandedProd(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

    return (
        <div className="main-container" style={{ marginTop: '60px', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '20px', flexWrap: 'wrap' }}>
                <h1 style={{ color: '#003366', margin: 0 }}>Gestión de Productos</h1>
                <button className="btn-new" onClick={() => setIsCreateMPOpen(true)}>
                    + Nueva Materia Prima (Origen)
                </button>
            </div>

            {loading ? <p>Cargando...</p> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {materiasPrimas.length === 0 && <p style={{ fontStyle: 'italic', color: '#666' }}>No hay materias primas definidas. Comienza creando una.</p>}

                    {materiasPrimas.map(mp => {
                        const mpProducts = productos.filter(p => {
                            const pMpId = p.materiaPrima?.id || p.materiaPrimaId;
                            return String(pMpId) === String(mp.id);
                        });

                        const primarios = mpProducts.filter(p => p.tipo === 'primario');
                        const elaborados = mpProducts.filter(p => p.tipo === 'elaborado');
                        const isExpanded = expandedMP.includes(mp.id);

                        return (
                            <div key={mp.id} style={{ border: '2px solid #003366', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
                                <div
                                    style={{
                                        padding: '15px', background: '#003366', color: 'white',
                                        display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer'
                                    }}
                                    onClick={() => toggleMP(mp.id)}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{mp.nombre}</span>
                                        <span style={{ fontSize: '0.9rem', opacity: 0.8 }}>({mpProducts.length} items)</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteMP(mp.id); }} style={{ background: 'transparent', border: 'none', color: '#ff6b6b', cursor: 'pointer', fontSize: '1.2rem' }}>🗑</button>
                                        <span>{isExpanded ? '▲' : '▼'}</span>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div style={{ padding: '20px', backgroundColor: 'white' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                            <h3 style={{ margin: 0, color: '#003366' }}>Catálogo de Productos</h3>
                                            <button
                                                onClick={() => openCreateProduct(mp.id)}
                                                className="btn-new"
                                                style={{ padding: '5px 15px', fontSize: '0.9rem' }}
                                            >
                                                + Nuevo Producto
                                            </button>
                                        </div>

                                        {mpProducts.length === 0 && <p style={{ color: '#888' }}>No hay productos definidos.</p>}

                                        {primarios.length > 0 && (
                                            <div style={{ marginBottom: '20px' }}>
                                                <h4 style={{ borderBottom: '2px solid #17a2b8', color: '#17a2b8', paddingBottom: '5px' }}>🔵 Productos Primarios (Origen / Rendimiento)</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {primarios.map(prod => (
                                                        <ProductItem
                                                            key={prod.id} prod={prod}
                                                            expandedProd={expandedProd} toggleProd={toggleProd}
                                                            handleDeleteProduct={handleDeleteProduct}
                                                            handleRemoveCalibre={handleRemoveCalibre}
                                                            handleAddCalibre={handleAddCalibre}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {elaborados.length > 0 && (
                                            <div style={{ marginBottom: '20px' }}>
                                                <h4 style={{ borderBottom: '2px solid #28a745', color: '#28a745', paddingBottom: '5px' }}>🟢 Productos Elaborados (Envasados)</h4>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                                    {elaborados.map(prod => (
                                                        <ProductItem
                                                            key={prod.id} prod={prod}
                                                            expandedProd={expandedProd} toggleProd={toggleProd}
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
                            </div>
                        );
                    })}

                    {productos.filter(p => !p.materiaPrima && !p.materiaPrimaId).length > 0 && (
                        <div style={{ marginTop: '40px', borderTop: '2px dashed #ccc', paddingTop: '20px' }}>
                            <h3 style={{ color: '#d9534f' }}>Productos Sin Clasificar</h3>
                            <p>Estos productos no tienen una Materia Prima asignada. Por favor elimínalos y créalos nuevamente dentro de su categoría.</p>
                            {productos.filter(p => !p.materiaPrima && !p.materiaPrimaId).map(p => (
                                <div key={p.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px', background: '#fff', border: '1px solid #ddd', marginBottom: '5px' }}>
                                    <strong>{p.nombre}</strong>
                                    <button onClick={() => handleDeleteProduct(p.id)} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>🗑 Eliminar</button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {isCreateMPOpen && (
                <div className="bg">
                    <div className="popup">
                        <button className="close" onClick={() => setIsCreateMPOpen(false)}>X</button>
                        <h2>Nueva Materia Prima</h2>
                        <form onSubmit={handleCreateMP}>
                            <input autoFocus placeholder="Nombre (ej: Salmón, Jibia)" className="form-control" value={newMPName} onChange={e => setNewMPName(e.target.value)} required />
                            <button type="submit" className="btn-save" style={{ marginTop: '15px' }}>Guardar</button>
                        </form>
                    </div>
                </div>
            )}

            {isCreateProdOpen && (
                <div className="bg">
                    <div className="popup">
                        <button className="close" onClick={() => setIsCreateProdOpen(false)}>X</button>
                        <h2>Nuevo Producto Derivado</h2>
                        <p style={{ fontSize: '0.9rem', color: '#666' }}>Materia Prima: {materiasPrimas.find(m => m.id === prodForm.materiaPrimaId)?.nombre}</p>
                        <form onSubmit={handleCreateProduct} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <label>Nombre Producto Final</label>
                            <input className="form-control" value={prodForm.nombre} onChange={e => setProdForm({ ...prodForm, nombre: e.target.value })} required />

                            <label>Tipo</label>
                            <select className="form-control" value={prodForm.tipo} onChange={e => setProdForm({ ...prodForm, tipo: e.target.value })}>
                                <option value="elaborado">Elaborado</option>
                                <option value="primario">Primario</option>
                            </select>

                            {prodForm.tipo === 'elaborado' && (
                                <>
                                    <label>Origen (Rendimiento)</label>
                                    <p style={{ fontSize: '0.8rem', color: '#666', margin: 0 }}>
                                        Indica qué saldo descuenta este producto (Carne o Pinzas).
                                    </p>
                                    <select
                                        className="form-control"
                                        value={prodForm.origen}
                                        onChange={e => setProdForm({ ...prodForm, origen: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Seleccione Categoría Rendimiento --</option>
                                        <option value="carne_blanca">Carne Blanca</option>
                                        <option value="pinza">Pinzas</option>
                                    </select>
                                </>
                            )}

                            <label>Calibres Iniciales (separados por coma)</label>
                            <input className="form-control" value={prodForm.calibresStr} onChange={e => setProdForm({ ...prodForm, calibresStr: e.target.value })} placeholder="Ej: 100g, 200g, Standard" />

                            <button type="submit" className="btn-save" style={{ marginTop: '10px' }}>Crear</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


const ProductItem = ({ prod, expandedProd, toggleProd, handleDeleteProduct, handleRemoveCalibre, handleAddCalibre }) => {
    const isProdExpanded = expandedProd.includes(prod.id);
    return (
        <div style={{ border: '1px solid #ddd', borderRadius: '5px' }}>
            <div
                style={{ padding: '10px', background: '#e9ecef', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}
                onClick={() => toggleProd(prod.id)}
            >
                <div>
                    <strong>{prod.nombre}</strong>
                    {prod.origen && prod.tipo === 'elaborado' && <span className="badge" style={{ marginLeft: '10px', background: '#6c757d', color: 'white', padding: '2px 5px', borderRadius: '3px', fontSize: '0.8rem' }}>Origen: {prod.origen}</span>}
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteProduct(prod.id); }} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>🗑</button>
                    <span>{isProdExpanded ? '▲' : '▼'}</span>
                </div>
            </div>

            {isProdExpanded && (
                <div style={{ padding: '15px' }}>
                    <h4 style={{ marginTop: 0, fontSize: '0.9rem', color: '#666' }}>Tabla de Calibres / Variantes</h4>

                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ background: '#f1f1f1', textAlign: 'left' }}>
                                <th style={{ padding: '8px', borderBottom: '2px solid #ddd' }}>Nombre Variedad / Calibre</th>
                                <th style={{ padding: '8px', borderBottom: '2px solid #ddd', width: '100px', textAlign: 'center' }}>Acción</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(prod.calibres || []).map((cal, idx) => (
                                <tr key={idx} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '8px' }}>{cal}</td>
                                    <td style={{ padding: '8px', textAlign: 'center' }}>
                                        <button
                                            onClick={() => handleRemoveCalibre(prod, cal)}
                                            style={{ color: 'red', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {(!prod.calibres || prod.calibres.length === 0) && (
                                <tr>
                                    <td colSpan="2" style={{ padding: '10px', textAlign: 'center', color: '#999' }}>Sin calibres definidos</td>
                                </tr>
                            )}
                            <tr style={{ background: '#fafafa' }}>
                                <td style={{ padding: '5px' }}>
                                    <input
                                        id={`add-cal-${prod.id}`}
                                        placeholder="Nuevo Calibre..."
                                        style={{ width: '100%', padding: '5px', border: '1px solid #ddd', borderRadius: '3px' }}
                                    />
                                </td>
                                <td style={{ padding: '5px', textAlign: 'center' }}>
                                    <button
                                        onClick={() => {
                                            const el = document.getElementById(`add-cal-${prod.id}`);
                                            if (el && el.value) { handleAddCalibre(prod, el.value); el.value = ''; }
                                        }}
                                        style={{ background: '#007bff', color: 'white', border: 'none', padding: '5px 10px', borderRadius: '3px', cursor: 'pointer' }}
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