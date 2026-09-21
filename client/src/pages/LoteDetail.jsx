import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getLoteById } from '../services/recepcion.service';
import { generateLotPDF } from '../services/pdf.service';
import '../styles/loteDetail.css';

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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <span className="section-title" style={{ margin: 0 }}>Resultados de Producción</span>
                        {!lote.estado && (
                            <span style={{
                                background: '#fef2f2',
                                color: '#dc2626',
                                border: '1px solid #fecaca',
                                padding: '4px 12px',
                                borderRadius: '20px',
                                fontSize: '0.8rem',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                            }}>
                                🔒 Lote Cerrado (Ingresos Bloqueados)
                            </span>
                        )}
                    </div>
                    <div className="form-grid">
                        <div>
                            {(() => {
                                if (!lote.producciones || lote.producciones.length === 0) return (
                                    <div style={{ color: '#888', fontStyle: 'italic', padding: '10px' }}>Sin producción</div>
                                );
                                
                                // Aggregate detalles from all producciones (usually just 1)
                                const aggr = {};
                                lote.producciones.forEach(prod => {
                                    if (prod.detalles && Array.isArray(prod.detalles)) {
                                        prod.detalles.forEach(d => {
                                            aggr[d.nombre] = (aggr[d.nombre] || 0) + Number(d.peso);
                                        });
                                    }
                                });

                                return Object.entries(aggr).map(([nombre, peso]) => (
                                    <div className="form-row" key={nombre}>
                                        <label className="form-label">{nombre}:</label>
                                        <input className="form-input-readonly" value={`${peso.toFixed(2)} Kg`} readOnly />
                                    </div>
                                ));
                            })()}
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

                    {/* Tarjeta de Merma y Porcentaje de Pérdida */}
                    {Number(lote.merma_kg || 0) > 0 && (
                        <div style={{
                            marginTop: '20px',
                            padding: '14px 18px',
                            background: '#f8f9fa',
                            border: '1px solid #ced4da',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flexWrap: 'wrap',
                            gap: '12px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#e9ecef',
                                    color: '#495057',
                                    fontWeight: 'bold',
                                    fontSize: '1rem'
                                }}>
                                    !
                                </div>
                                <div>
                                    <div style={{ fontWeight: '600', color: '#343a40', fontSize: '0.95rem' }}>
                                        Merma Registrada (Cierre de Lote)
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '2px' }}>
                                        Diferencia entre el total producido y el ingreso final a cámara
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <div style={{
                                    fontSize: '1.2rem',
                                    fontWeight: '700',
                                    color: '#212529',
                                    fontFamily: 'Consolas, "Courier New", monospace'
                                }}>
                                    {Number(lote.merma_kg).toFixed(2)} <span style={{ fontSize: '0.85rem', fontWeight: '500', color: '#6c757d' }}>Kg</span>
                                </div>
                                <div style={{
                                    padding: '4px 10px',
                                    background: '#e9ecef',
                                    color: '#495057',
                                    border: '1px solid #ced4da',
                                    borderRadius: '4px',
                                    fontWeight: '600',
                                    fontSize: '0.85rem'
                                }}>
                                    {lote.peso_total_producido
                                        ? ((Number(lote.merma_kg) / Number(lote.peso_total_producido)) * 100).toFixed(2)
                                        : '0.00'}% de pérdida
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Botón extra decorativo opcional o nada */}
            </div>
        </div>
    );
};

export default LoteDetail;
