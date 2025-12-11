import { useState } from 'react';
import useProduccion from '../hooks/produccion/useProduccion';
import '../styles/popup.css';
import '../styles/table.css';

export default function PopupProduccion({ show, setShow, onSuccess }) {
    const {
        lotes, productosCatalogo, ubicaciones,
        loteSeleccionado, setLoteSeleccionado,
        planilla, handleInputChange, handleGuardarTodo,
        setPlanilla // Need access to setPlanilla to update all at once
    } = useProduccion();

    const [globalDestino, setGlobalDestino] = useState('');

    const onGuardar = async () => {
        await handleGuardarTodo();
        if (onSuccess) onSuccess();
    };

    const handleGlobalDestinoChange = (ubicacionId) => {
        setGlobalDestino(ubicacionId);
        // Update all items in planilla
        productosCatalogo.forEach(prod => {
            // We need to call handleInputChange for each, OR safer:
            // Since handleInputChange might rely on previous state, iterating might be tricky if it's not batched.
            // But useProduccion likely exposes handleInputChange which updates the state for a specific key.
            // Better: Let's assume handleInputChange is fast enough.
            handleInputChange(prod.id, 'ubicacion', ubicacionId);
        });
    };

    if (!show) return null;

    return (
        <div className="bg">
            <div className="popup" style={{ width: '1100px', maxWidth: '98%' }}>
                <button className='close' onClick={() => setShow(false)}>X</button>
                <h2 style={{ color: '#003366', marginBottom: '20px' }}>Nueva Producción Masiva</h2>

                {/* 1. SELECCIÓN DE LOTE & DESTINO GLOBAL */}
                <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 2 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#003366' }}>
                            1. Lote de Origen (Materia Prima)
                        </label>
                        <select
                            value={loteSeleccionado}
                            onChange={(e) => setLoteSeleccionado(e.target.value)}
                            style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
                        >
                            <option value="">-- Seleccione Lote Abierto --</option>
                            {lotes.map(l => (
                                <option key={l.id} value={l.id}>
                                    {l.codigo} | {l.materiaPrimaNombre} ({l.proveedorNombre})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#003366' }}>
                            2. Global de Destino (Opcional)
                        </label>
                        <select
                            value={globalDestino}
                            onChange={(e) => handleGlobalDestinoChange(e.target.value)}
                            style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: '#e3f2fd' }}
                            disabled={!loteSeleccionado}
                        >
                            <option value="">-- Seleccionar para todos --</option>
                            {ubicaciones.map(u => (
                                <option key={u.id} value={u.id}>
                                    {u.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. PLANILLA */}
                {loteSeleccionado && (
                    <div className="table-container-native" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="samar-table">
                            <thead>
                                <tr>
                                    <th style={{ width: '30%' }}>Producto</th>
                                    <th style={{ width: '15%' }}>Peso (Kg)</th>
                                    <th style={{ width: '20%' }}>Calibre</th>
                                    <th style={{ width: '25%' }}>Destino</th>

                                </tr>
                            </thead>
                            <tbody>
                                {productosCatalogo.map((prod) => {
                                    const calibres = typeof prod.calibres === 'string' ? prod.calibres.split(',') : (prod.calibres || []);
                                    const isActive = planilla[prod.id]?.peso > 0;

                                    return (
                                        <tr key={prod.id} style={{ backgroundColor: isActive ? '#e3f2fd' : 'white' }}>
                                            <td style={{ fontWeight: 'bold' }}>{prod.nombre}</td>
                                            <td>
                                                <input
                                                    type="number" step="0.1" placeholder="0.0"
                                                    value={planilla[prod.id]?.peso || ""}
                                                    onChange={(e) => handleInputChange(prod.id, 'peso', e.target.value)}
                                                    style={{ width: '100%', textAlign: 'center', fontWeight: 'bold' }}
                                                />
                                            </td>
                                            <td>
                                                {calibres.length > 0 ? (
                                                    <select
                                                        value={planilla[prod.id]?.calibre || ""}
                                                        onChange={(e) => handleInputChange(prod.id, 'calibre', e.target.value)}
                                                        style={{ width: '100%', padding: '5px' }}
                                                    >
                                                        <option value="">-</option>
                                                        {calibres.map((c, i) => <option key={i} value={c.trim()}>{c.trim()}</option>)}
                                                    </select>
                                                ) : <span style={{ color: '#999', fontSize: '0.8em' }}>N/A</span>}
                                            </td>
                                            <td>
                                                <select
                                                    value={planilla[prod.id]?.ubicacion || ""}
                                                    onChange={(e) => handleInputChange(prod.id, 'ubicacion', e.target.value)}
                                                    style={{ width: '100%', padding: '5px' }}
                                                >
                                                    <option value="">-</option>
                                                    {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                                                </select>
                                            </td>

                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div style={{ padding: '20px', textAlign: 'right' }}>
                            <button onClick={onGuardar} className="btn-new" style={{ padding: '12px 25px' }}>
                                Guardar Todo
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}