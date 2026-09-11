import { useState, useEffect } from 'react';
import { updateLote } from '../../services/recepcion.service';
import { showToastSuccess, showToastError } from '../../helpers/sweetAlert';
import '../../styles/popup.css';

export default function PopupInputKilos({ show, setShow, onSuccess, initialData }) {
    const [formData, setFormData] = useState({
        peso_carne_blanca: '',
        peso_pinzas: '',
        observacion: ''
    });

    useEffect(() => {
        if (show && initialData) {
            const formatValue = (val) => {
                if (!val) return '';
                if (Number(val) === 0) return '';
                return val;
            };

            setFormData({
                peso_carne_blanca: formatValue(initialData.peso_carne_blanca),
                peso_pinzas: formatValue(initialData.peso_pinzas),
                observacion: initialData.observacion_produccion || ''
            });
        }
    }, [show, initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const maxWeight = initialData ? Number(initialData.peso_neto || initialData.peso_bruto_kg || initialData.peso_neto_kg || 99999) : 99999;
    const currentTotal = Number(formData.peso_carne_blanca || 0) + Number(formData.peso_pinzas || 0);
    const hasWeightError = maxWeight > 0 && currentTotal > maxWeight * 1.5; // Margen razonable de tolerancia si aplica

    const handleSave = async () => {
        if (!initialData || hasWeightError) return;

        try {
            await updateLote(initialData.id, {
                peso_carne_blanca: Number(formData.peso_carne_blanca || 0),
                peso_pinzas: Number(formData.peso_pinzas || 0),
                peso_total_producido: currentTotal,
                observacion_produccion: formData.observacion
            });
            showToastSuccess('Producción de lote actualizada exitosamente');
            onSuccess();
        } catch (error) {
            console.error(error);
            showToastError("Error al guardar datos de producción");
        }
    };

    if (!show || !initialData) return null;

    return (
        <div className="bg" onClick={() => setShow(false)}>
            <div className="popup" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
                <button className='btn-close-x' onClick={() => setShow(false)}>✕</button>

                <h2>Ingreso de Producción</h2>
                <p className="popup-subtitle">
                    Lote: <span style={{ color: '#003366', fontWeight: 'bold' }}>{initialData.codigo}</span> | {initialData.materiaPrimaNombre}
                </p>

                <div className="form-container">
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div className="container_inputs" style={{ flex: 1 }}>
                            <label>Carne Blanca (Kg)</label>
                            <input
                                type="number"
                                name="peso_carne_blanca"
                                value={formData.peso_carne_blanca}
                                onChange={handleChange}
                                step="0.01"
                                placeholder="0.00"
                                style={{
                                    border: hasWeightError ? '2px solid #ef4444' : '1px solid #d1d5db',
                                    textAlign: 'center'
                                }}
                            />
                        </div>
                        <div className="container_inputs" style={{ flex: 1 }}>
                            <label>Pinzas (Kg)</label>
                            <input
                                type="number"
                                name="peso_pinzas"
                                value={formData.peso_pinzas}
                                onChange={handleChange}
                                step="0.01"
                                placeholder="0.00"
                                style={{
                                    border: hasWeightError ? '2px solid #ef4444' : '1px solid #d1d5db',
                                    textAlign: 'center'
                                }}
                            />
                        </div>
                    </div>

                    {hasWeightError && (
                        <span style={{ color: '#ef4444', fontSize: '0.85rem', textAlign: 'center', fontWeight: 600 }}>
                            ⚠️ La suma ingresada ({currentTotal.toFixed(2)} Kg) excede el peso del lote ({maxWeight.toFixed(2)} Kg).
                        </span>
                    )}

                    <div className="container_inputs">
                        <label>Observación</label>
                        <textarea
                            name="observacion"
                            value={formData.observacion}
                            onChange={handleChange}
                            rows="3"
                            placeholder="Comentarios adicionales de producción..."
                            style={{
                                width: '100%',
                                resize: 'none'
                            }}
                        />
                    </div>

                    <div className="popup-actions">
                        <button type="button" className="btn-cancel" onClick={() => setShow(false)}>Cancelar</button>
                        <button
                            onClick={handleSave}
                            className="btn-save"
                            disabled={hasWeightError}
                            style={{
                                opacity: hasWeightError ? 0.5 : 1,
                                cursor: hasWeightError ? 'not-allowed' : 'pointer'
                            }}
                        >
                            Guardar Producción
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}


