import { useState, useEffect } from 'react';
import { getProduccionByLote, updateProduccionYield } from '../../services/produccion.service';
import { getProductos } from '../../services/producto.service';
import '../../styles/popup.css';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

export default function PopupEditarProduccion({ show, setShow, onSuccess, selectedLote }) {
    const [primarios, setPrimarios] = useState([]);
    const [formData, setFormData] = useState({});
    const [observacion, setObservacion] = useState('');
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

        const resProductos = await getProductos();
        let loadedPrimarios = [];
        if (resProductos.status === 'Success') {
            loadedPrimarios = resProductos.data.filter(p => p.materiaPrima?.id === selectedLote.materiaPrimaId && p.tipo === 'primario');
            setPrimarios(loadedPrimarios);
        }

        const initialData = {};
        loadedPrimarios.forEach(p => initialData[p.id] = '');
        
        if (prod.detalles && Array.isArray(prod.detalles)) {
            prod.detalles.forEach(d => {
                initialData[d.productoId] = String(d.peso ?? '');
            });
        }
        setFormData(initialData);
        setObservacion(prod.observacion || '');

        setLoading(false);
    };

    const handleChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (index < primarios.length - 1) {
                document.getElementById(`edit-input-primario-${index + 1}`)?.focus();
            } else {
                document.getElementById(`edit-input-observacion`)?.focus();
            }
        }
    };

    const handleSave = async () => {
        if (!selectedLote || bloqueado) return;

        const detalles = primarios.map(p => ({
            productoId: p.id,
            peso: Number(formData[p.id] || 0),
            nombre: p.nombre
        })).filter(d => d.peso > 0);

        if (detalles.length === 0) {
            return showErrorAlert("Error", "Debes ingresar al menos un peso válido.");
        }

        const res = await updateProduccionYield(selectedLote.id, {
            detalles: detalles,
            observacion: observacion
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
            <div className="popup" onClick={e => e.stopPropagation()} style={{ padding: '30px', maxWidth: '600px', width: '90%' }}>
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
                            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                {primarios.map((p, index) => (
                                    <div key={p.id} style={{ flex: '1 1 calc(50% - 16px)', minWidth: '150px' }}>
                                        <label style={{ fontSize: '0.9rem', fontWeight: 'bold', display: 'block', marginBottom: '6px' }}>
                                            {p.nombre} (Kg)
                                        </label>
                                        <input
                                            id={`edit-input-primario-${index}`}
                                            type="number"
                                            value={formData[p.id] || ''}
                                            onChange={(e) => handleChange(p.id, e.target.value)}
                                            onKeyDown={(e) => handleKeyDown(e, index)}
                                            step="0.01"
                                            min="0"
                                            style={{
                                                padding: '11px 12px',
                                                border: '1px solid #ccc',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                textAlign: 'center',
                                                width: '100%',
                                                boxSizing: 'border-box'
                                            }}
                                        />
                                    </div>
                                ))}
                                {primarios.length === 0 && (
                                    <div style={{ width: '100%', textAlign: 'center', color: '#888', padding: '20px' }}>
                                        No se encontraron productos primarios para esta especie.
                                    </div>
                                )}
                            </div>

                            <div>
                                <label style={{ fontSize: '0.9rem', display: 'block', marginBottom: '6px' }}>
                                    Observación
                                </label>
                                <textarea
                                    id="edit-input-observacion"
                                    value={observacion}
                                    onChange={(e) => setObservacion(e.target.value)}
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
                                disabled={primarios.length === 0}
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
