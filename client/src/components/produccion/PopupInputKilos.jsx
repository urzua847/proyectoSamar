import { useState, useEffect } from 'react';
import { updateLote } from '../../services/recepcion.service';
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

    const handleSave = async () => {
        if (!initialData) return;

        try {
            await updateLote(initialData.id, {
                peso_carne_blanca: Number(formData.peso_carne_blanca),
                peso_pinzas: Number(formData.peso_pinzas),
                peso_total_producido: Number(formData.peso_carne_blanca) + Number(formData.peso_pinzas),
                observacion_produccion: formData.observacion
            });
            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Error al guardar datos");
        }
    };

    if (!show || !initialData) return null;

    return (
        <div className="bg">
            <div className="popup" style={{ width: '500px', borderRadius: '12px', padding: '30px' }}>
                <button className='close' onClick={() => setShow(false)}>X</button>

                <h2 style={{ color: '#003366', marginBottom: '10px', textAlign: 'center' }}>
                    Ingreso de Producción
                </h2>
                <h4 style={{ color: '#666', textAlign: 'center', marginBottom: '25px', marginTop: '0' }}>
                    Lote: <span style={{ color: '#003366' }}>{initialData.codigo}</span> | {initialData.materiaPrimaNombre}
                </h4>

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
                            Guardar Producción
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
