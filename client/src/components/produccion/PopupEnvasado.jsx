import { useState } from 'react';
import useProduccion from '../../hooks/produccion/useProduccion';
import '../../styles/popup.css';
import '../../styles/table.css';

export default function PopupEnvasado({ show, setShow, onSuccess }) {
    const {
        lotes, productosCatalogo, ubicaciones,
        loteSeleccionado, setLoteSeleccionado,
        planilla, handleInputChange, handleGuardarEnvasado,
        loading
    } = useProduccion();

    const cerrarPopup = () => {
        setShow(false);
        if (onSuccess) onSuccess();
    };

    const catalogoSeguro = productosCatalogo || [];
    const productosElaborados = catalogoSeguro.filter(p => p.tipo === 'elaborado');

    const [camaraGlobal, setCamaraGlobal] = useState('');

    const obtenerGramaje = (textoCalibre) => {
        if (!textoCalibre) return 0;
        const match = textoCalibre.match(/(\d+)\s*grs/i);
        return match ? parseInt(match[1]) : 0;
    };

    const handleCamaraGlobalChange = (val) => {
        setCamaraGlobal(val);
        // Actualizar la ubicación de todos los productos visibles
        productosElaborados.forEach(prod => {
            handleInputChange(prod.id, 'ubicacion', val);
        });
    };

    if (!show) return null;

    return (
        <div className="bg">
            <div className="popup" style={{ width: '1100px', maxWidth: '98%', maxHeight: '90vh', overflowY: 'auto' }}>
                <button className='close' onClick={() => setShow(false)}>X</button>
                <h2 style={{ color: '#003366', marginBottom: '20px' }}>Ingreso a Cámara (Envasado)</h2>

                {loading ? (
                    <div style={{ padding: '30px', textAlign: 'center' }}>Cargando...</div>
                ) : (
                    <>
                        <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                            {/* Selector Lote */}
                            <div style={{ flex: 1, padding: '15px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '5px solid #003366' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#003366' }}>
                                    Lote Origen
                                </label>
                                <select
                                    value={loteSeleccionado}
                                    onChange={(e) => setLoteSeleccionado(e.target.value)}
                                    style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="">-- Seleccione Lote --</option>
                                    {(lotes || []).map(l => (
                                        <option key={l.id} value={l.id}>
                                            {l.codigo} | {l.materiaPrimaNombre} ({l.proveedorNombre})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Selector Global de Cámara */}
                            <div style={{ flex: 1, padding: '15px', background: '#e9ecef', borderRadius: '8px', borderLeft: '5px solid #6c757d' }}>
                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#003366' }}>
                                    Cámara Global (Aplicar a todos)
                                </label>
                                <select
                                    value={camaraGlobal}
                                    onChange={(e) => handleCamaraGlobalChange(e.target.value)}
                                    style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
                                >
                                    <option value="">-- Seleccionar Cámara --</option>
                                    {(ubicaciones || []).filter(u => u.tipo === 'camara').map(u => (
                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {loteSeleccionado && (
                            <div style={{ background: '#fff', padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
                                <table className="samar-table">
                                    <thead>
                                        <tr>
                                            <th style={{ width: '25%' }}>Producto</th>
                                            <th style={{ width: '20%' }}>Formato</th>
                                            <th style={{ width: '15%' }}>Cantidad</th>
                                            <th style={{ width: '15%' }}>Total (Kg)</th>
                                            <th style={{ width: '25%' }}>Cámara</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productosElaborados.map(prod => {
                                            const calibres = typeof prod.calibres === 'string' ? prod.calibres.split(',') : (prod.calibres || []);
                                            const seleccion = planilla[prod.id] || {};
                                            const calibreSeleccionado = seleccion.calibre || "";
                                            const gramaje = obtenerGramaje(calibreSeleccionado);
                                            const esUnidad = gramaje > 0;

                                            const handleChangeCantidad = (valor) => {
                                                const cantidad = parseFloat(valor) || 0;
                                                if (esUnidad) {
                                                    const kilosCalculados = (cantidad * gramaje) / 1000;
                                                    handleInputChange(prod.id, 'peso', kilosCalculados);
                                                    handleInputChange(prod.id, 'cantidad_visual', valor);
                                                } else {
                                                    handleInputChange(prod.id, 'peso', cantidad);
                                                    handleInputChange(prod.id, 'cantidad_visual', valor);
                                                }
                                            };

                                            return (
                                                <tr key={prod.id}>
                                                    <td style={{ fontWeight: 'bold' }}>{prod.nombre}</td>
                                                    <td>
                                                        <select
                                                            value={calibreSeleccionado}
                                                            onChange={(e) => {
                                                                handleInputChange(prod.id, 'calibre', e.target.value);
                                                                handleInputChange(prod.id, 'peso', 0);
                                                                handleInputChange(prod.id, 'cantidad_visual', "");
                                                            }}
                                                            style={{ width: '100%', padding: '5px' }}
                                                        >
                                                            <option value="">- Seleccionar -</option>
                                                            {calibres.map((c, i) => <option key={i} value={c}>{c}</option>)}
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            placeholder="Unid."
                                                            value={seleccion.cantidad_visual || ""}
                                                            onChange={(e) => handleChangeCantidad(e.target.value)}
                                                            disabled={!calibreSeleccionado}
                                                            style={{ width: '100%', textAlign: 'center', border: esUnidad ? '2px solid #007bff' : '1px solid #ccc' }}
                                                        />
                                                    </td>
                                                    <td>
                                                        <div style={{ background: '#f0f0f0', padding: '5px', textAlign: 'center', fontWeight: 'bold' }}>
                                                            {seleccion.peso ? Number(seleccion.peso).toFixed(2) : "0.00"} kg
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <select
                                                            value={seleccion.ubicacion || ''}
                                                            onChange={(e) => handleInputChange(prod.id, 'ubicacion', e.target.value)}
                                                            style={{ width: '100%', padding: '5px' }}
                                                        >
                                                            <option value="">- Cámara -</option>
                                                            {(ubicaciones || []).filter(u => u.tipo === 'camara').map(u => (
                                                                <option key={u.id} value={u.id}>{u.nombre}</option>
                                                            ))}
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                                <div style={{ textAlign: 'right', marginTop: '15px' }}>
                                    <button
                                        onClick={async () => {
                                            await handleGuardarEnvasado();
                                            cerrarPopup();
                                        }}
                                        className="btn-new"
                                        style={{ padding: '12px 30px', background: '#003366', color: 'white' }}
                                    >
                                        Confirmar Ingreso a Cámara
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
