import { useState, useEffect } from 'react';
import { getLotesActivos, updateLote } from '../../services/recepcion.service';
import { showToastSuccess, showToastError } from '../../helpers/sweetAlert';
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
            showToastSuccess("Proceso iniciado exitosamente");
            onSuccess();
        } catch (error) {
            console.error(error);
            showToastError("Error al iniciar proceso");
        }
    };

    if (!show) return null;

    return (
        <div className="bg" onClick={() => setShow(false)}>
            <div className="popup" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <button className='btn-close-x' onClick={() => setShow(false)}>✕</button>
                <h2>Iniciar Nuevo Proceso</h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#64748b' }}>Cargando lotes...</div>
                ) : (
                    <>
                        <div className="container_inputs">
                            <label>Seleccione Lote para Producción</label>
                            <select
                                value={selectedLoteId}
                                onChange={(e) => setSelectedLoteId(e.target.value)}
                            >
                                <option value="">-- Seleccione Lote --</option>
                                {lotes.map(l => (
                                    <option key={l.id} value={l.id}>
                                        {l.codigo} | {l.materiaPrimaNombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="popup-actions">
                            <button type="button" className="btn-cancel" onClick={() => setShow(false)}>Cancelar</button>
                            <button
                                onClick={handleConfirm}
                                className="btn-save"
                                disabled={!selectedLoteId}
                                style={{ opacity: selectedLoteId ? 1 : 0.5, cursor: selectedLoteId ? 'pointer' : 'not-allowed' }}
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

