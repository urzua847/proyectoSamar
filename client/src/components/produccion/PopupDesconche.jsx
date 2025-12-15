import { useEffect } from 'react';
import useProduccion from '../../hooks/produccion/useProduccion';
import '../../styles/popup.css';
import '../../styles/table.css';

export default function PopupDesconche({ show, setShow, onSuccess, initialData = null }) {
    const {
        lotes, productosCatalogo,
        loteSeleccionado, setLoteSeleccionado,
        desconche, handleDesconcheChange, guardarRendimiento,
        actualizarDesconche, // Need to add this to hook or import service
        loading,
        setDesconche // Exposed from hook for filling data
    } = useProduccion();

    // Reset or Fill data on open
    useEffect(() => {
        if (show) {
            if (initialData) {
                setLoteSeleccionado(initialData.loteId || (initialData.lote ? initialData.lote.id : ""));
                setDesconche({
                    "Carne Blanca": initialData.peso_carne_blanca,
                    "Pinzas": initialData.peso_pinzas,
                    "obs_Carne Blanca": (initialData.observacion || "").split(" | ")[0] || "",
                    "obs_Pinzas": (initialData.observacion || "").split(" | ")[1] || ""
                });
            } else {
                setLoteSeleccionado("");
                setDesconche({});
            }
        }
    }, [show, initialData, setLoteSeleccionado, setDesconche]);

    const cerrarPopup = () => {
        setShow(false);
        if (onSuccess) onSuccess();
    };

    const catalogoSeguro = productosCatalogo || [];
    const productosPrimarios = catalogoSeguro.filter(p => p.tipo === 'primario');

    const handleGuardar = async () => {
        if (initialData) {
            await actualizarDesconche(initialData.id);
        } else {
            await guardarRendimiento();
        }
        cerrarPopup();
    };

    if (!show) return null;

    return (
        <div className="bg">
            <div className="popup" style={{ width: '800px', maxWidth: '98%', maxHeight: '90vh', overflowY: 'auto' }}>
                <button className='close' onClick={() => setShow(false)}>X</button>
                <h2 style={{ color: '#003366', marginBottom: '20px' }}>
                    {initialData ? 'Editar Planilla Desconche' : 'Nueva Planilla de Desconche'}
                </h2>

                {loading ? (
                    <div style={{ padding: '30px', textAlign: 'center' }}>Cargando...</div>
                ) : (
                    <>
                        <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px', borderLeft: '5px solid #003366' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#003366' }}>
                                Seleccione Lote Origen
                            </label>
                            <select
                                value={loteSeleccionado}
                                onChange={(e) => setLoteSeleccionado(e.target.value)}
                                disabled={!!initialData} // Lock batch if editing
                                style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: initialData ? '#e9ecef' : '#fff' }}
                            >
                                <option value="">-- Seleccione Lote --</option>
                                {(lotes || []).map(l => (
                                    <option key={l.id} value={l.id}>
                                        {l.codigo} | {l.materiaPrimaNombre} ({l.proveedorNombre})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {(loteSeleccionado || initialData) && (
                            <div style={{ background: '#fff', padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
                                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '15px' }}>
                                    Ingrese los kilos netos obtenidos (Carne Blanca / Pinzas).
                                </p>
                                <table className="samar-table">
                                    <thead>
                                        <tr>
                                            <th>Producto (Primario)</th>
                                            <th style={{ width: '150px' }}>Kilos Obtenidos</th>
                                            <th>Observación</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {productosPrimarios.map(prod => (
                                            <tr key={prod.id}>
                                                <td style={{ fontWeight: 'bold' }}>{prod.nombre}</td>
                                                <td>
                                                    <input
                                                        type="number" step="0.1" placeholder="0.0"
                                                        value={desconche[prod.nombre] || ''}
                                                        onChange={(e) => handleDesconcheChange(prod.nombre, e.target.value)}
                                                        style={{ width: '100%', padding: '8px', textAlign: 'center', border: '1px solid #003366', fontWeight: 'bold' }}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text" placeholder="..."
                                                        value={desconche[`obs_${prod.nombre}`] || ''}
                                                        onChange={(e) => handleDesconcheChange(`obs_${prod.nombre}`, e.target.value)}
                                                        style={{ width: '100%', padding: '8px', border: '1px solid #ccc' }}
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div style={{ textAlign: 'right', marginTop: '20px' }}>
                                    <button
                                        onClick={handleGuardar}
                                        className="btn-new"
                                        style={{ background: '#003366', color: 'white', padding: '10px 30px' }}
                                    >
                                        {initialData ? 'Actualizar Desconche' : 'Guardar Desconche'}
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
