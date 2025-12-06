import useProduccion from '../hooks/produccion/useProduccion';
import '../styles/users.css'; // Reutilizamos estilos base
import '../styles/table.css'; // Reutilizamos estilos de tabla

const Produccion = () => {
    const {
        lotes,
        productosCatalogo,
        ubicaciones,
        loteSeleccionado,
        setLoteSeleccionado,
        planilla,
        handleInputChange,
        handleGuardarTodo
    } = useProduccion();

    return (
        <div className="main-container">
            <div className="table-wrapper" style={{ maxWidth: '1000px' }}>
                
                <div className="top-table">
                    <h1 className="title-table">Registro Masivo de Producción</h1>
                </div>

                {/* 1. SELECCIÓN DE LOTE */}
                <div className="filter-section" style={{ alignItems: 'flex-start' }}>
                    <div className="filter-group" style={{ width: '100%' }}>
                        <label>Lote de Origen (Materia Prima)</label>
                        <select 
                            value={loteSeleccionado} 
                            onChange={(e) => setLoteSeleccionado(e.target.value)}
                            style={{ fontSize: '1.1rem', padding: '10px' }}
                        >
                            <option value="">-- Seleccione Lote --</option>
                            {lotes.map(l => (
                                <option key={l.id} value={l.id}>
                                    {l.codigo} | {l.materiaPrimaNombre} ({l.proveedorNombre})
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* 2. PLANILLA DE INGRESO */}
                {loteSeleccionado && (
                    <div className="table-container-native" style={{ marginTop: '20px', overflowX: 'auto' }}>
                        <table className="samar-table">
                            <thead>
                                <tr>
                                    <th style={{width: '30%'}}>Producto</th>
                                    <th style={{width: '20%'}}>Calibre</th>
                                    <th style={{width: '25%'}}>Destino (Cámara)</th>
                                    <th style={{width: '15%'}}>Peso (Kg)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productosCatalogo.map((prod) => {
                                    // Convertir calibres a array si es string
                                    const calibres = typeof prod.calibres === 'string' 
                                        ? prod.calibres.split(',') 
                                        : (prod.calibres || []);

                                    return (
                                        <tr key={prod.id} style={{ backgroundColor: planilla[prod.id]?.peso ? '#f0f9ff' : 'white' }}>
                                            <td style={{ fontWeight: 'bold', color: '#003366' }}>
                                                {prod.nombre}
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
                                                ) : (
                                                    <span style={{ color: '#999', fontSize: '0.8rem' }}>N/A</span>
                                                )}
                                            </td>

                                            <td>
                                                <select
                                                    value={planilla[prod.id]?.ubicacion || ""}
                                                    onChange={(e) => handleInputChange(prod.id, 'ubicacion', e.target.value)}
                                                    style={{ width: '100%', padding: '5px' }}
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    {ubicaciones.map(u => (
                                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                                    ))}
                                                </select>
                                            </td>

                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.1"
                                                    placeholder="0.0"
                                                    value={planilla[prod.id]?.peso || ""}
                                                    onChange={(e) => handleInputChange(prod.id, 'peso', e.target.value)}
                                                    style={{ width: '100%', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div style={{ padding: '20px', textAlign: 'right' }}>
                            <button 
                                onClick={handleGuardarTodo} 
                                className="btn-new" 
                                style={{ padding: '15px 30px', fontSize: '1.1rem' }}
                            >
                                Guardar Producción Completa
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Produccion;