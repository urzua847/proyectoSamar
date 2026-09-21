import { useState, useEffect } from 'react';
import { createProduccionYield } from '../../services/produccion.service';
import { getProductos } from '../../services/producto.service';
import '../../styles/popup.css';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

export default function PopupNuevaProduccion({ show, setShow, onSuccess, selectedLote }) {
    const [primarios, setPrimarios] = useState([]);
    const [formData, setFormData] = useState({});
    const [observacion, setObservacion] = useState('');

    useEffect(() => {
        if (show && selectedLote) {
            setFormData({});
            setObservacion('');
            
            // Cargar productos primarios de esta especie
            const loadProductos = async () => {
                const res = await getProductos();
                if (res.status === 'Success') {
                    const filtered = res.data.filter(p => p.materiaPrima?.id === selectedLote.materiaPrimaId && p.tipo === 'primario');
                    setPrimarios(filtered);
                    
                    const initialData = {};
                    filtered.forEach(p => initialData[p.id] = '');
                    setFormData(initialData);
                }
            };
            loadProductos();
        }
    }, [show, selectedLote]);

    const handleChange = (id, value) => {
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (index < primarios.length - 1) {
                document.getElementById(`input-primario-${index + 1}`)?.focus();
            } else {
                document.getElementById(`input-observacion`)?.focus();
            }
        }
    };

    const handleSave = async () => {
        if (!selectedLote) return;

        const detalles = primarios.map(p => ({
            productoId: p.id,
            peso: Number(formData[p.id] || 0),
            nombre: p.nombre
        })).filter(d => d.peso > 0);

        if (detalles.length === 0) {
            return showErrorAlert("Error", "Debes ingresar al menos un peso válido.");
        }

        try {
            const response = await createProduccionYield({
                loteRecepcionId: selectedLote.id,
                detalles: detalles,
                observacion: observacion
            });

            if (response.status === 'Success') {
                showSuccessAlert("Éxito", "Producción registrada correctamente.");
                onSuccess();
                setShow(false);
            } else {
                showErrorAlert("Error", response.message);
            }
        } catch (error) {
            console.error(error);
            showErrorAlert("Error", "Error inesperado al guardar.");
        }
    };

    if (!show || !selectedLote) return null;

    return (
        <div className="bg" onClick={() => setShow(false)}>
            <div className="popup" onClick={e => e.stopPropagation()} style={{ padding: '30px', maxWidth: '600px', width: '90%' }}>
                <button className='btn-close-x' onClick={() => setShow(false)}>X</button>

                <h2 style={{ color: '#003366', marginBottom: '10px', textAlign: 'center' }}>
                    Nueva Producción (Rendimiento)
                </h2>
                <h4 style={{ color: '#666', textAlign: 'center', marginBottom: '25px', marginTop: '0' }}>
                    Lote Seleccionado: <span style={{ color: '#003366' }}>{selectedLote.codigo}</span>
                </h4>
                <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#555', marginBottom: '20px' }}>
                    {selectedLote.materiaPrimaNombre} | Proveedor: {selectedLote.proveedorNombre}
                </p>

                <div className="form-container" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                        {primarios.map((p, index) => (
                            <div key={p.id} className="container_inputs" style={{ flex: '1 1 calc(50% - 20px)', minWidth: '150px' }}>
                                <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{p.nombre} (Kg)</label>
                                <input
                                    id={`input-primario-${index}`}
                                    type="number"
                                    value={formData[p.id] || ''}
                                    onChange={(e) => handleChange(p.id, e.target.value)}
                                    onKeyDown={(e) => handleKeyDown(e, index)}
                                    step="0.01"
                                    placeholder="0.00"
                                    style={{
                                        padding: '12px 15px',
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

                    <div className="container_inputs">
                        <label style={{ fontSize: '0.9rem' }}>Observación</label>
                        <textarea
                            id="input-observacion"
                            value={observacion}
                            onChange={(e) => setObservacion(e.target.value)}
                            rows="3"
                            placeholder="Comentarios adicionales..."
                            style={{
                                width: '100%',
                                padding: '12px',
                                border: '1px solid #ddd',
                                borderRadius: '8px',
                                resize: 'none',
                                fontFamily: 'inherit',
                                fontSize: '0.95rem'
                            }}
                        />
                    </div>

                    <div style={{ paddingTop: '10px' }}>
                        <button
                            onClick={handleSave}
                            className="btn-save"
                            style={{ width: '100%' }}
                            disabled={primarios.length === 0}
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
