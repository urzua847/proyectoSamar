import { useState, useEffect } from 'react';
import { createProduccionYield } from '../../services/produccion.service';
import '../../styles/popup.css';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

export default function PopupNuevaProduccion({ show, setShow, onSuccess, selectedLote }) {
    const [formData, setFormData] = useState({
        peso_carne_blanca: '',
        peso_pinzas: '',
        observacion: ''
    });

    useEffect(() => {
        if (show) {
            setFormData({
                peso_carne_blanca: '',
                peso_pinzas: '',
                observacion: ''
            });
        }
    }, [show, selectedLote]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!selectedLote) return;

        if (!formData.peso_carne_blanca && !formData.peso_pinzas) {
            return showErrorAlert("Error", "Debes ingresar al menos un peso.");
        }

        try {
            const response = await createProduccionYield({
                loteRecepcionId: selectedLote.id,
                peso_carne_blanca: Number(formData.peso_carne_blanca || 0),
                peso_pinzas: Number(formData.peso_pinzas || 0),
                observacion: formData.observacion
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
        <div className="bg">
            <div className="popup" style={{ width: '500px', borderRadius: '12px', padding: '30px' }}>
                <button className='close' onClick={() => setShow(false)}>X</button>

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

                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div className="container_inputs" style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Carne Blanca (Kg)</label>
                            <input
                                type="number"
                                name="peso_carne_blanca"
                                value={formData.peso_carne_blanca}
                                onChange={handleChange}
                                step="0.01"
                                placeholder="0.00"
                                style={{
                                    padding: '12px 15px',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    textAlign: 'center'
                                }}
                            />
                        </div>
                        <div className="container_inputs" style={{ flex: 1 }}>
                            <label style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>Pinzas (Kg)</label>
                            <input
                                type="number"
                                name="peso_pinzas"
                                value={formData.peso_pinzas}
                                onChange={handleChange}
                                step="0.01"
                                placeholder="0.00"
                                style={{
                                    padding: '12px 15px',
                                    border: '1px solid #ccc',
                                    borderRadius: '8px',
                                    fontSize: '1rem',
                                    textAlign: 'center'
                                }}
                            />
                        </div>
                    </div>

                    <div className="container_inputs">
                        <label style={{ fontSize: '0.9rem' }}>Observación</label>
                        <textarea
                            name="observacion"
                            value={formData.observacion}
                            onChange={handleChange}
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
                            className="btn-new"
                            style={{
                                width: '100%',
                                background: '#003366',
                                color: 'white',
                                padding: '15px',
                                fontSize: '1rem',
                                borderRadius: '25px',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                                cursor: 'pointer',
                                border: 'none'
                            }}
                        >
                            Guardar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
