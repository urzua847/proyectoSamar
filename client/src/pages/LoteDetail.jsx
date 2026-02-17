import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLoteById } from '../services/recepcion.service';
import { generateLotPDF } from '../services/pdf.service';
import '../styles/loteDetail.css'; // New ERP style

const LoteDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lote, setLote] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('info');

    useEffect(() => {
        const fetchLote = async () => {
            if (id) {
                const data = await getLoteById(id);
                setLote(data);
            }
            setLoading(false);
        };
        fetchLote();
    }, [id]);

    if (loading) return <div className="lote-detail-container">Cargando datos...</div>;
    if (!lote) return <div className="lote-detail-container">Lote no encontrado</div>;

    return (
        <div className="lote-detail-container">
            <div className="lote-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 className="lote-title">VER Lote MP {lote.codigo}</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-erp" onClick={() => generateLotPDF(lote)}>
                        Imprimir / PDF
                    </button>
                    <button className="btn-erp" onClick={() => navigate(-1)} style={{ backgroundColor: '#6c757d', color: 'white', borderColor: '#5a6268' }}>
                        Volver
                    </button>
                </div>
            </div>

            {/* TAB BUTTONS */}
            <div className="lote-tabs">
                <button
                    className={`tab-button ${activeTab === 'info' ? 'active' : ''}`}
                    onClick={() => setActiveTab('info')}
                >
                    Información Básica
                </button>
            </div>

            {/* MAIN PANEL */}
            <div className="lote-panel">

                {activeTab === 'info' && (
                    <div className="form-grid">
                        {/* COLUMNA IZQUIERDA */}
                        <div>
                            <div className="form-row">
                                <label className="form-label">Lote Materia Prima:</label>
                                <input className="form-input-readonly" value={lote.codigo} readOnly />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Fecha/Hora Recepción:</label>
                                <input className="form-input-readonly" value={lote.fechaFormateada} readOnly />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Tipo de Proceso:</label>
                                <input className="form-input-readonly" value={lote.tipo_proceso || 'Estándar'} readOnly />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Presentación:</label>
                                <input className="form-input-readonly" value={lote.presentacion || 'Entero'} readOnly />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Activo:</label>
                                <div className="checkbox-container">
                                    <input type="checkbox" checked={lote.estado} readOnly disabled />
                                </div>
                            </div>
                        </div>

                        {/* COLUMNA DERECHA */}
                        <div>
                            <div className="form-row">
                                <label className="form-label">Proveedor:</label>
                                <input className="form-input-readonly" value={lote.proveedorNombre || ''} readOnly />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Cliente:</label>
                                <input className="form-input-readonly" value="Interno" readOnly />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Familia/Especie:</label>
                                <input className="form-input-readonly" value={lote.materiaPrimaNombre || ''} readOnly />
                            </div>
                            <div className="form-row">
                                <label className="form-label">N° Bandejas:</label>
                                <input className="form-input-readonly" value={lote.numero_bandejas} readOnly />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Peso Bruto Total:</label>
                                <input className="form-input-readonly" value={`${lote.peso_bruto_kg} Kg`} readOnly />
                            </div>
                        </div>

                        {/* Full Width Observaciones */}
                        <div className="full-width" style={{ marginTop: '10px' }}>
                            <div className="form-row" style={{ gridTemplateColumns: '180px 1fr' }}>
                                <label className="form-label" style={{ alignSelf: 'start', paddingTop: '5px' }}>Observaciones:</label>
                                <textarea
                                    className="full-area-input"
                                    rows="3"
                                    readOnly
                                    value={lote.observacion || ''}
                                />
                            </div>
                        </div>

                        {/* Data Planta */}
                        <div className="full-width">
                            <div className="form-grid" style={{ marginTop: '10px' }}>
                                <div className="form-row">
                                    <label className="form-label">Responsable:</label>
                                    <input className="form-input-readonly" value={lote.operario?.nombre || 'Admin'} readOnly />
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* Sección Resultados de Producción */}
                <div className="section-box">
                    <span className="section-title">Resultados de Producción</span>
                    <div className="form-grid">
                        <div>
                            <div className="form-row">
                                <label className="form-label">Carne Blanca:</label>
                                <input className="form-input-readonly" value={`${lote.peso_carne_blanca || 0} Kg`} readOnly />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Pinzas:</label>
                                <input className="form-input-readonly" value={`${lote.peso_pinzas || 0} Kg`} readOnly />
                            </div>
                        </div>
                        <div>
                            <div className="form-row">
                                <label className="form-label">Total Producido:</label>
                                <input className="form-input-readonly" value={`${lote.peso_total_producido || 0} Kg`} readOnly />
                            </div>
                            <div className="form-row">
                                <label className="form-label">Rendimiento:</label>
                                <input className="form-input-readonly"
                                    value={`${lote.peso_total_producido
                                        ? ((Number(lote.peso_total_producido) / Number(lote.peso_bruto_kg)) * 100).toFixed(2)
                                        : '0.00'}%`}
                                    readOnly
                                    style={{ fontWeight: 'bold' }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Botón extra decorativo opcional o nada */}
            </div>
        </div>
    );
};

export default LoteDetail;
