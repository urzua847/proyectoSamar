import { useForm } from 'react-hook-form';
import useProduccion from '../hooks/produccion/useProduccion'; // Tu hook de lógica de formulario
import '../styles/popup.css';
import '../styles/table.css';

export default function PopupProduccion({ show, setShow, onSuccess }) {
    const {
        lotes, productosCatalogo, ubicaciones,
        loteSeleccionado, setLoteSeleccionado,
        planilla, handleInputChange, handleGuardarTodo
    } = useProduccion();

    // Envolvemos el guardar para cerrar el popup al terminar
    const onGuardar = async () => {
        // Asumimos que handleGuardarTodo devuelve true si tuvo éxito (necesitarás ajustar el hook si no lo hace)
        // Por ahora, llamamos a la función original.
        await handleGuardarTodo(); 
        // Si quieres cerrar automático, deberías retornar éxito desde el hook.
        // Por simplicidad, recargamos la tabla padre:
        if (onSuccess) onSuccess();
        // Opcional: setShow(false); si quieres cerrar tras guardar.
    };

    if (!show) return null;

    return (
        <div className="bg">
            <div className="popup" style={{ width: '1100px', maxWidth: '98%' }}>
                <button className='close' onClick={() => setShow(false)}>X</button>
                <h2 style={{ color: '#003366', marginBottom: '20px' }}>Nueva Producción Masiva</h2>
                
                {/* 1. SELECCIÓN DE LOTE */}
                <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <label style={{display:'block', marginBottom:'5px', fontWeight:'bold', color:'#003366'}}>
                        Lote de Origen (Materia Prima)
                    </label>
                    <select 
                        value={loteSeleccionado} 
                        onChange={(e) => setLoteSeleccionado(e.target.value)}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius:'4px', border:'1px solid #ccc' }}
                    >
                        <option value="">-- Seleccione Lote Abierto --</option>
                        {lotes.map(l => (
                            <option key={l.id} value={l.id}>
                                {l.codigo} | {l.materiaPrimaNombre} ({l.proveedorNombre})
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. PLANILLA */}
                {loteSeleccionado && (
                    <div className="table-container-native" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        <table className="samar-table">
                            <thead>
                                <tr>
                                    <th style={{width:'30%'}}>Producto</th>
                                    <th style={{width:'20%'}}>Calibre</th>
                                    <th style={{width:'25%'}}>Destino</th>
                                    <th style={{width:'15%'}}>Peso (Kg)</th>
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
                                                {calibres.length > 0 ? (
                                                    <select
                                                        value={planilla[prod.id]?.calibre || ""}
                                                        onChange={(e) => handleInputChange(prod.id, 'calibre', e.target.value)}
                                                        style={{width:'100%', padding:'5px'}}
                                                    >
                                                        <option value="">-</option>
                                                        {calibres.map((c, i) => <option key={i} value={c.trim()}>{c.trim()}</option>)}
                                                    </select>
                                                ) : <span style={{color:'#999', fontSize:'0.8em'}}>N/A</span>}
                                            </td>
                                            <td>
                                                <select
                                                    value={planilla[prod.id]?.ubicacion || ""}
                                                    onChange={(e) => handleInputChange(prod.id, 'ubicacion', e.target.value)}
                                                    style={{width:'100%', padding:'5px'}}
                                                >
                                                    <option value="">-</option>
                                                    {ubicaciones.map(u => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                                                </select>
                                            </td>
                                            <td>
                                                <input
                                                    type="number" step="0.1" placeholder="0.0"
                                                    value={planilla[prod.id]?.peso || ""}
                                                    onChange={(e) => handleInputChange(prod.id, 'peso', e.target.value)}
                                                    style={{width:'100%', textAlign:'center', fontWeight:'bold'}}
                                                />
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