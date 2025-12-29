import { useState, useEffect } from 'react';
import { getLotesActivos, updateLote } from '../../services/recepcion.service';
import '../../styles/popup.css';

export default function PopupSeleccionLote({ show, setShow, onSuccess }) {
    const [lotes, setLotes] = useState([]);
    const [selectedLoteId, setSelectedLoteId] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (show) {
            setLoading(true);
            getLotesActivos().then(data => {
                const disponibles = data.filter(l => !l.en_proceso_produccion);
                setLotes(disponibles);
                setLoading(false);
            });
            setSelectedLoteId("");
        }
    }, [show]);

    const handleConfirm = async () => {
        if (!selectedLoteId) return;

        try {
            await updateLote(selectedLoteId, {
                en_proceso_produccion: true,
                fecha_inicio_produccion: new Date().toISOString()
            });
            onSuccess();
        } catch (error) {
            console.error(error);
            alert("Error al iniciar proceso");
        }
    };

    if (!show) return null;

    return (
        <div className="bg">
            <div className="popup" style={{ width: '500px' }}>
                <button className='close' onClick={() => setShow(false)}>X</button>
                <h2 style={{ color: '#003366', marginBottom: '20px' }}>Iniciar Nuevo Proceso</h2>

                {loading ? (
                    <div style={{ textAlign: 'center' }}>Cargando lotes...</div>
                ) : (
                    <>
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                                Seleccione Lote para Producción
                            </label>
                            <select
                                value={selectedLoteId}
                                onChange={(e) => setSelectedLoteId(e.target.value)}
                                style={{ width: '100%', padding: '10px', fontSize: '1rem' }}
                            >
                                <option value="">-- Seleccione Lote --</option>
                                {lotes.map(l => (
                                    <option key={l.id} value={l.id}>
                                        {l.codigo} | {l.materiaPrimaNombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <button
                                onClick={handleConfirm}
                                className="btn-new"
                                disabled={!selectedLoteId}
                                style={{ background: selectedLoteId ? '#28a745' : '#ccc', color: 'white' }}
                            >
                                Iniciar Proceso
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
