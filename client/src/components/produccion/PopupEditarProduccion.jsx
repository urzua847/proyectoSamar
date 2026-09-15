import { useState, useEffect } from 'react';
import { getProduccionByLote, updateProduccionYield } from '../../services/produccion.service';
import '../../styles/popup.css';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

export default function PopupEditarProduccion({ show, setShow, onSuccess, selectedLote }) {
    const [formData, setFormData] = useState({
        peso_carne_blanca: '',
        peso_pinzas: '',
        observacion: ''
    });
    const [produccionActual, setProduccionActual] = useState(null);
    const [loading, setLoading] = useState(false);
    const [bloqueado, setBloqueado] = useState(false);
    const [mensajeBloqueo, setMensajeBloqueo] = useState('');

    useEffect(() => {
        if (show && selectedLote) {
            cargarProduccion();
        }
    }, [show, selectedLote]);

    const cargarProduccion = async () => {
        setLoading(true);
        setBloqueado(false);
        setMensajeBloqueo('');

        const res = await getProduccionByLote(selectedLote.id);

        if (res.status !== 'Success' || !res.data) {
            showErrorAlert('Error', 'No se encontró un registro de producción para este lote.');
            setShow(false);
            setLoading(false);
            return;
        }

        const prod = res.data;
        setProduccionActual(prod);

        // Verificar si ya fue editada
        if (prod.editada) {
            setBloqueado(true);
            setMensajeBloqueo('Este registro ya fue editado una vez. No se permiten más modificaciones.');
        }

        setFormData({
            peso_carne_blanca: String(prod.peso_carne_blanca ?? ''),
            peso_pinzas: String(prod.peso_pinzas ?? ''),
            observacion: prod.observacion || ''
        });

        setLoading(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleKeyDown = (e, nextFieldId) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (nextFieldId === 'submit') {
                handleSave();
            } else {
                document.getElementById(nextFieldId)?.focus();
            }
        }
    };

    const handleSave = async () => {
        if (!selectedLote || bloqueado) return;

        if (!formData.peso_carne_blanca && !formData.peso_pinzas) {
            return showErrorAlert('Error', 'Debes ingresar al menos un peso.');
        }

        const res = await updateProduccionYield(selectedLote.id, {
            peso_carne_blanca: Number(formData.peso_carne_blanca || 0),
            peso_pinzas: Number(formData.peso_pinzas || 0),
            observacion: formData.observacion
        });

        if (res.status === 'Success') {
            showSuccessAlert('Actualizado', 'La producción fue corregida exitosamente. Este registro queda bloqueado para nuevas ediciones.');
            onSuccess();
            setShow(false);
        } else {
            showErrorAlert('Error', res.message);
        }
    };

    if (!show || !selectedLote) return null;

    return (
        <div className="bg" onClick={() => setShow(false)}>
            <div className="popup" onClick={e => e.stopPropagation()} style={{ padding: '30px', width: '500px', maxWidth: '95%' }}>
                <button className='btn-close-x' onClick={() => setShow(false)}>X</button>

                <h2 style={{ color: '#003366', marginBottom: '8px', textAlign: 'center' }}>
                    Corregir Producción
                </h2>
                <h4 style={{ color: '#666', textAlign: 'center', marginBottom: '4px', marginTop: '0' }}>
                    Lote: <span style={{ color: '#003366' }}>{selectedLote.codigo}</span>
                </h4>
                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#555', marginBottom: '18px' }}>
                    {selectedLote.materiaPrimaNombre} | Proveedor: {selectedLote.proveedorNombre}
                </p>

                {loading ? (
                    <p style={{ textAlign: 'center', color: '#888' }}>Cargando...</p>
                ) : bloqueado ? (
                    <div style={{
                        background: '#fff3cd',
                        border: '1px solid #ffc107',
                        borderRadius: '8px',
                        padding: '16px',
                        textAlign: 'center',
                        color: '#856404',
                        marginBottom: '16px'
                    }}>
                        <div style={{ fontSize: '1.8rem', marginBottom: '8px' }}>🔒</div>
                        <p style={{ margin: 0, fontWeight: 'bold' }}>Edición bloqueada</p>
                        <p style={{ margin: '6px 0 0', fontSize: '0.9rem' }}>{mensajeBloqueo}</p>
                    </div>
                ) : (
                    <>
                        {/* Aviso de única oportunidad */}
                        <div style={{
                            background: '#fff3cd',
                            border: '1px solid #ffc107',
                            borderRadius: '8px',
                            padding: '10px 14px',
                            marginBottom: '18px',
                            fontSize: '0.85rem',
                            color: '#856404'
                        }}>
                            ⚠️ <strong>Atención:</strong> Solo se permite <strong>una corrección</strong> por lote. Una vez guardado, este registro quedará bloqueado permanentemente.
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                                        Carne Blanca (Kg)
                                    </label>
                                    <input
                                        id="edit-input-carne"
                                        type="number"
                                        name="peso_carne_blanca"
                                        value={formData.peso_carne_blanca}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, 'edit-input-pinzas')}
                                        step="0.01"
                                        min="0"
                                        style={{
                                            padding: '11px 12px',
                                            border: '1px solid #ccc',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            textAlign: 'center'
                                        }}
                                    />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                                        Pinzas (Kg)
                                    </label>
                                    <input
                                        id="edit-input-pinzas"
                                        type="number"
                                        name="peso_pinzas"
                                        value={formData.peso_pinzas}
                                        onChange={handleChange}
                                        onKeyDown={(e) => handleKeyDown(e, 'submit')}
                                        step="0.01"
                                        min="0"
                                        style={{
                                            padding: '11px 12px',
                                            border: '1px solid #ccc',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            textAlign: 'center'
                                        }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
                                    Observación
                                </label>
                                <textarea
                                    name="observacion"
                                    value={formData.observacion}
                                    onChange={handleChange}
                                    rows="2"
                                    placeholder="Motivo de la corrección..."
                                    style={{
                                        width: '100%',
                                        padding: '10px 12px',
                                        border: '1px solid #ddd',
                                        borderRadius: '8px',
                                        resize: 'none',
                                        fontFamily: 'inherit',
                                        fontSize: '0.9rem',
                                        boxSizing: 'border-box'
                                    }}
                                />
                            </div>

                            <button
                                onClick={handleSave}
                                className="btn-save"
                                style={{ width: '100%' }}
                            >
                                Guardar Corrección
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
