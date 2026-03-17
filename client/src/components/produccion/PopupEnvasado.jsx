import { useState, useEffect } from 'react';
import useProduccion from '../../hooks/produccion/useProduccion';
import { getResumenProduccion } from '../../services/envasado.service';
import { showErrorAlert } from '../../helpers/sweetAlert';
import '../../styles/popup.css';
import '../../styles/table.css';

export default function PopupEnvasado({ show, setShow, onSuccess }) {
    const {
        lotes, productosCatalogo, ubicaciones,
        loteSeleccionado, setLoteSeleccionado,
        handleGuardarEnvasado,
        loading
    } = useProduccion();

    const [expandedProductIds, setExpandedProductIds] = useState([]);
    const [formData, setFormData] = useState({});
    const [camaraGlobal, setCamaraGlobal] = useState('');
    const [resumenYield, setResumenYield] = useState(null);

    useEffect(() => {
        if (loteSeleccionado) {
            getResumenProduccion(loteSeleccionado).then(res => {
                if (res.status === 'Success') {
                    setResumenYield(res.data);
                }
            });
        }
    }, [loteSeleccionado]);

    const cerrarPopup = () => {
        setShow(false);
        setFormData({});
        setExpandedProductIds([]);
        if (onSuccess) onSuccess();
    };

    const activeLote = lotes.find(l => l.id == loteSeleccionado);
    const filteredProducts = activeLote
        ? productosCatalogo.filter(p => p.materiaPrima?.id === activeLote.materiaPrima?.id && p.tipo === 'elaborado')
        : [];

    const toggleExpand = (prodId) => {
        setExpandedProductIds(prev =>
            prev.includes(prodId)
                ? prev.filter(id => id !== prodId)
                : [...prev, prodId]
        );
    };

    const obtenerGramaje = (textoCalibre) => {
        if (!textoCalibre) return 0;
        const match = textoCalibre.match(/(\d+)\s*grs/i);
        return match ? parseInt(match[1]) : 0;
    };

    const handleInputChange = (prodId, calibre, field, value) => {
        const key = `${prodId}-${calibre}`;

        setFormData(prev => {
            const currentEntry = prev[key] || { ubicacion: camaraGlobal };
            const newData = { ...currentEntry, [field]: value };

            if (field === 'cantidad') {
                const gramaje = obtenerGramaje(calibre);
                if (gramaje > 0) {
                    const qty = parseInt(value) || 0;
                    newData.pesoTotal = (qty * gramaje) / 1000;
                }
            }

            setErrors(prevErrors => {
                if (!prevErrors[key]) return prevErrors;
                const newRowErrors = { ...prevErrors[key] };
                if (field === 'cantidad' || field === 'pesoTotal') delete newRowErrors.cantidad;
                if (field === 'ubicacion') delete newRowErrors.ubicacion;

                if (Object.keys(newRowErrors).length === 0) {
                    const { [key]: deleted, ...rest } = prevErrors;
                    return rest;
                }
                return { ...prevErrors, [key]: newRowErrors };
            });

            return { ...prev, [key]: newData };
        });
    };

    const [errors, setErrors] = useState({});

    const handleConfirmar = async () => {
        const itemsToSave = [];
        const newErrors = {};

        Object.keys(formData).forEach(key => {
            const firstHyphen = key.indexOf('-');
            const prodId = key.substring(0, firstHyphen);
            const calibre = key.substring(firstHyphen + 1);

            const entry = formData[key];

            const hasQuantity = (entry.cantidad && parseInt(entry.cantidad) > 0) || (entry.pesoTotal && parseFloat(entry.pesoTotal) > 0);
            const hasLocation = !!entry.ubicacion;

            if (hasQuantity) {
                if (!hasLocation) {
                    newErrors[key] = { ...newErrors[key], ubicacion: true };
                } else {
                    const gramaje = obtenerGramaje(calibre);
                    const cantidad = parseInt(entry.cantidad) || 0;

                    if (gramaje > 0 && cantidad > 0) {
                        for (let i = 0; i < cantidad; i++) {
                            itemsToSave.push({
                                definicionProductoId: Number(prodId),
                                ubicacionId: Number(entry.ubicacion),
                                peso_neto_kg: gramaje / 1000,
                                calibre: calibre
                            });
                        }
                    } else if (entry.pesoTotal > 0) {
                        itemsToSave.push({
                            definicionProductoId: Number(prodId),
                            ubicacionId: Number(entry.ubicacion),
                            peso_neto_kg: Number(entry.pesoTotal),
                            calibre: calibre
                        });
                    }
                }
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const prodIdsWithError = Object.keys(newErrors).map(k => k.split('-')[0]).map(Number);
            setExpandedProductIds(prev => [...new Set([...prev, ...prodIdsWithError])]);
            return;
        }

        setErrors({});

        if (itemsToSave.length === 0) {
            return;
        }

        let totalCarne = 0;
        let totalPinzas = 0;

        itemsToSave.forEach(item => {
            const prodDef = productosCatalogo.find(p => p.id === item.definicionProductoId);
            if (prodDef) {
                if (prodDef.origen === 'carne_blanca') totalCarne += item.peso_neto_kg;
                if (prodDef.origen === 'pinza') totalPinzas += item.peso_neto_kg;
            }
        });

        if (resumenYield) {
            const balanceCarne = Number(resumenYield.balance.carne || 0);
            const balancePinzas = Number(resumenYield.balance.pinzas || 0);

            if (totalCarne > balanceCarne) {
                showErrorAlert(
                    'Límite Excedido',
                    `Carne Blanca: Intentas guardar ${totalCarne.toFixed(2)} kg, pero solo quedan ${balanceCarne.toFixed(2)} kg disponibles.`
                );
                return;
            }
            if (totalPinzas > balancePinzas) {
                showErrorAlert(
                    'Límite Excedido',
                    `Pinzas: Intentas guardar ${totalPinzas.toFixed(2)} kg, pero solo quedan ${balancePinzas.toFixed(2)} kg disponibles.`
                );
                return;
            }
        }

        const success = await handleGuardarEnvasado(itemsToSave);
        if (success) {
            cerrarPopup();
        }
    };

    const handleCamaraGlobalChange = (val) => {
        setCamaraGlobal(val);
        setFormData(prev => {
            const nextState = { ...prev };
            Object.keys(nextState).forEach(k => {
                nextState[k].ubicacion = val;
            });
            return nextState;
        });
    };

    if (!show) return null;

    return (
        <div className="bg">
            <div className="popup" style={{ width: '1100px', maxWidth: '98%', maxHeight: '90vh', overflowY: 'auto', padding: '32px' }}>
                <button className='btn-close-x' onClick={cerrarPopup}>X</button>
                <h2 style={{ color: '#003366', marginBottom: '24px', fontSize: '1.4rem' }}>Ingreso a Cámara (Envasado)</h2>

                {loading ? <div style={{ padding: '30px', textAlign: 'center' }}>Cargando...</div> : (
                    <>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '28px' }}>
                            <div>
                                <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#444', display: 'block', marginBottom: '6px' }}>Lote Origen</label>
                                <select
                                    value={loteSeleccionado}
                                    onChange={(e) => setLoteSeleccionado(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem' }}
                                >
                                    <option value="">-- Seleccione Lote --</option>
                                    {(lotes || []).map(l => (
                                        <option key={l.id} value={l.id}>
                                            {l.codigo} | {l.materiaPrimaNombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#444', display: 'block', marginBottom: '6px' }}>Cámara Global</label>
                                <select
                                    value={camaraGlobal}
                                    onChange={(e) => handleCamaraGlobalChange(e.target.value)}
                                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem' }}
                                >
                                    <option value="">-- Todas --</option>
                                    {(ubicaciones || []).filter(u => u.tipo === 'camara').map(u => (
                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {loteSeleccionado && (
                            <div className="accordion-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {filteredProducts.map(prod => {
                                    const calibres = Array.isArray(prod.calibres)
                                        ? prod.calibres
                                        : (typeof prod.calibres === 'string'
                                            ? prod.calibres.split(',').map(c => c.trim()).filter(c => c !== '')
                                            : []);

                                    const isExpanded = expandedProductIds.includes(prod.id);

                                    return (
                                        <div key={prod.id} style={{ border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden' }}>
                                            {/* Header / Button */}
                                            <div
                                                onClick={() => toggleExpand(prod.id)}
                                                style={{
                                                    padding: '15px',
                                                    background: isExpanded ? '#003366' : '#f8f9fa',
                                                    color: isExpanded ? '#fff' : '#333',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                <span>{prod.nombre}</span>
                                                <span>{isExpanded ? '▲' : '▼'}</span>
                                            </div>

                                            {/* Content (Calibres Table) */}
                                            {isExpanded && (
                                                <div style={{ padding: '15px', background: '#f0f4f8' }}>
                                                    <div className="table-container-native" style={{ width: '100%', boxShadow: 'none' }}>
                                                        <table className="samar-table">
                                                            <thead>
                                                                <tr style={{ background: '#003366', color: 'white' }}>
                                                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Calibre</th>
                                                                    <th style={{ width: '140px', padding: '12px 16px', textAlign: 'center' }}>Cant. (Envases)</th>
                                                                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>Peso Total (Kg)</th>
                                                                    <th style={{ padding: '12px 16px', textAlign: 'left' }}>Ubicación</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {calibres.map((cal, idx) => {
                                                                    const key = `${prod.id}-${cal}`;
                                                                    const data = formData[key] || {};
                                                                    const rowErrors = errors[key] || {};
                                                                    const gramaje = obtenerGramaje(cal);

                                                                    return (
                                                                        <tr key={idx} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                                            <td style={{ fontWeight: '600', padding: '12px 16px', whiteSpace: 'nowrap' }}>{cal}</td>
                                                                            <td style={{ padding: '8px 12px' }}>
                                                                                <input
                                                                                    type="number"
                                                                                    placeholder="0"
                                                                                    value={data.cantidad || ''}
                                                                                    onChange={(e) => handleInputChange(prod.id, cal, 'cantidad', e.target.value)}
                                                                                    style={{
                                                                                        width: '100%',
                                                                                        padding: '8px',
                                                                                        textAlign: 'center',
                                                                                        borderRadius: '4px',
                                                                                        border: rowErrors.cantidad ? '2px solid red' : '1px solid #ccc'
                                                                                    }}
                                                                                />
                                                                            </td>
                                                                            <td style={{ padding: '8px 12px' }}>
                                                                                <input
                                                                                    type="number"
                                                                                    placeholder="0.00"
                                                                                    value={data.pesoTotal || ''}
                                                                                    onChange={(e) => handleInputChange(prod.id, cal, 'pesoTotal', e.target.value)}
                                                                                    disabled={gramaje > 0}
                                                                                    style={{
                                                                                        width: '100%',
                                                                                        padding: '8px',
                                                                                        textAlign: 'center',
                                                                                        borderRadius: '4px',
                                                                                        background: gramaje > 0 ? '#eee' : '#fff',
                                                                                        border: rowErrors.cantidad ? '2px solid red' : '1px solid #ccc'
                                                                                    }}
                                                                                />
                                                                            </td>
                                                                            <td style={{ padding: '8px 12px' }}>
                                                                                <select
                                                                                    value={data.ubicacion || camaraGlobal}
                                                                                    onChange={(e) => handleInputChange(prod.id, cal, 'ubicacion', e.target.value)}
                                                                                    style={{
                                                                                        width: '100%',
                                                                                        padding: '8px',
                                                                                        borderRadius: '4px',
                                                                                        border: rowErrors.ubicacion ? '2px solid red' : '1px solid #ccc'
                                                                                    }}
                                                                                >
                                                                                    <option value="">- Selec -</option>
                                                                                    {(ubicaciones || []).filter(u => u.tipo === 'camara').map(u => (
                                                                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                                                                    ))}
                                                                                </select>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                                {calibres.length === 0 && (
                                                                    <tr><td colSpan="4" style={{ textAlign: 'center', color: '#999' }}>Sin calibres definidos</td></tr>
                                                                )}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                                {filteredProducts.length === 0 && (
                                    <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                        No hay productos definidos para esta Materia Prima.
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ marginTop: '28px', textAlign: 'right', borderTop: '1px solid #e2e8f0', paddingTop: '20px' }}>
                            <button className="btn-new" onClick={handleConfirmar} style={{ padding: '12px 28px', fontSize: '1rem' }}>
                                Confirmar y Guardar Todos
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
