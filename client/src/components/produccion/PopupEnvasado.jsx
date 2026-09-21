import { useState, useEffect, useMemo } from 'react';
import useProduccion from '../../hooks/produccion/useProduccion';
import { getResumenProduccion } from '../../services/envasado.service';
import { showErrorAlert } from '../../helpers/sweetAlert';
import ProductionSummaryBar from './ProductionSummaryBar';
import '../../styles/popup.css';
import '../../styles/table.css';

export default function PopupEnvasado({ show, setShow, onSuccess }) {
    const {
        lotes, productosCatalogo, ubicaciones,
        loteSeleccionado, setLoteSeleccionado,
        handleGuardarEnvasado,
        loading
    } = useProduccion();

    const [formData, setFormData] = useState({});
    const [camaraGlobal, setCamaraGlobal] = useState('');
    const [resumenYield, setResumenYield] = useState(null);
    const [cerrarLote, setCerrarLote] = useState(false);

    // Load draft on mount
    useEffect(() => {
        if (show && loteSeleccionado) {
            const savedDraft = localStorage.getItem(`draft_envasado_${loteSeleccionado}`);
            if (savedDraft) {
                try {
                    setFormData(JSON.parse(savedDraft));
                } catch (e) {
                    console.error("Error loading draft", e);
                }
            } else {
                setFormData({});
            }
            
            getResumenProduccion(loteSeleccionado).then(res => {
                if (res.status === 'Success') {
                    setResumenYield(res.data);
                }
            });
        } else if (!show) {
            setResumenYield(null);
        }
    }, [loteSeleccionado, show]);

    // Save draft when formData changes
    useEffect(() => {
        if (show && loteSeleccionado && Object.keys(formData).length > 0) {
            localStorage.setItem(`draft_envasado_${loteSeleccionado}`, JSON.stringify(formData));
        }
    }, [formData, loteSeleccionado, show]);

    const cerrarPopup = () => {
        setShow(false);
        setFormData({});
        setCerrarLote(false);
        if (onSuccess) onSuccess();
    };

    const clearDraft = () => {
        if (loteSeleccionado) {
            localStorage.removeItem(`draft_envasado_${loteSeleccionado}`);
        }
    };

    const activeLote = lotes.find(l => l.id == loteSeleccionado);
    const filteredProducts = activeLote
        ? productosCatalogo.filter(p => p.materiaPrima?.id === activeLote.materiaPrima?.id && p.tipo === 'elaborado')
        : [];

    const dynamicBalances = useMemo(() => {
        if (!resumenYield || !resumenYield.balances) return [];

        const currentIngresos = {};
        resumenYield.balances.forEach(b => currentIngresos[b.nombre] = 0);

        Object.keys(formData).forEach(key => {
            const firstHyphen = key.indexOf('-');
            const prodId = Number(key.substring(0, firstHyphen));
            const entry = formData[key];
            const val = parseFloat(entry?.pesoTotal);
            const kg = isNaN(val) ? 0 : val;

            const prodDef = productosCatalogo.find(p => p.id === prodId);
            if (prodDef && prodDef.origen) {
                const origenStr = prodDef.origen.toLowerCase().trim();
                
                const matchedBalances = resumenYield.balances.filter(b => {
                    const balName = b.nombre.toLowerCase().trim();
                    return origenStr === balName || origenStr.includes(balName) || balName.includes(origenStr);
                });

                if (matchedBalances.length > 0) {
                    const exactMatch = matchedBalances.find(b => b.nombre.toLowerCase().trim() === origenStr);
                    if (exactMatch) {
                        currentIngresos[exactMatch.nombre] += kg;
                    } else {
                        // Si hace match con múltiples y no es exacto, divide el peso (ej. "Pinza y Carne Blanca")
                        const kgPerBalance = kg / matchedBalances.length;
                        matchedBalances.forEach(b => {
                            currentIngresos[b.nombre] += kgPerBalance;
                        });
                    }
                }
            }
        });

        return resumenYield.balances.map(bal => {
            const currentIngreso = currentIngresos[bal.nombre] || 0;
            const saldo = bal.balance - currentIngreso;
            return {
                ...bal,
                ingresoActual: currentIngreso,
                saldoRestante: saldo
            };
        });
    }, [resumenYield, formData, productosCatalogo]);

    const isExceeded = useMemo(() => {
        return dynamicBalances.some(b => b.saldoRestante < -0.01); // Pequeno margen de error flotante
    }, [dynamicBalances]);

    const obtenerGramaje = (textoCalibre) => {
        if (!textoCalibre) return 0;
        const match = textoCalibre.match(/(\d+)\s*grs/i);
        return match ? parseInt(match[1]) : 0;
    };

    const handleInputChange = (prodId, calibre, field, value) => {
        const key = `${prodId}-${calibre}`;

        setFormData(prev => {
            const currentEntry = prev[key] || { ubicacion: camaraGlobal };
            const newData = { ...currentEntry, [field]: value };

            if (field === 'cantidad') {
                const gramaje = obtenerGramaje(calibre);
                if (gramaje > 0) {
                    const qty = parseInt(value) || 0;
                    newData.pesoTotal = (qty * gramaje) / 1000;
                }
            }

            setErrors(prevErrors => {
                if (!prevErrors[key]) return prevErrors;
                const newRowErrors = { ...prevErrors[key] };
                if (field === 'cantidad' || field === 'pesoTotal') delete newRowErrors.cantidad;
                if (field === 'ubicacion') delete newRowErrors.ubicacion;

                if (Object.keys(newRowErrors).length === 0) {
                    const { [key]: deleted, ...rest } = prevErrors;
                    return rest;
                }
                return { ...prevErrors, [key]: newRowErrors };
            });

            return { ...prev, [key]: newData };
        });
    };

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleConfirmar = async () => {
        if (isExceeded) {
            showErrorAlert('Límite Excedido', 'El saldo restante no puede ser negativo. Ajuste los kilos a ingresar.');
            return;
        }
        if (isSubmitting) return; // Prevent double-clicks

        const itemsToSave = [];
        const newErrors = {};

        Object.keys(formData).forEach(key => {
            const firstHyphen = key.indexOf('-');
            const prodId = key.substring(0, firstHyphen);
            const calibre = key.substring(firstHyphen + 1);

            const entry = formData[key];

            const hasQuantity = (entry.cantidad && parseInt(entry.cantidad) > 0) || (entry.pesoTotal && parseFloat(entry.pesoTotal) > 0);
            const hasLocation = !!entry.ubicacion;

            if (hasQuantity) {
                if (!hasLocation) {
                    newErrors[key] = { ...newErrors[key], ubicacion: true };
                } else {
                    const gramaje = obtenerGramaje(calibre);
                    const cantidad = parseInt(entry.cantidad) || 0;

                    if (gramaje > 0 && cantidad > 0) {
                        for (let i = 0; i < cantidad; i++) {
                            itemsToSave.push({
                                definicionProductoId: Number(prodId),
                                ubicacionId: Number(entry.ubicacion),
                                peso_neto_kg: gramaje / 1000,
                                calibre: calibre
                            });
                        }
                    } else if (entry.pesoTotal > 0) {
                        itemsToSave.push({
                            definicionProductoId: Number(prodId),
                            ubicacionId: Number(entry.ubicacion),
                            peso_neto_kg: Number(entry.pesoTotal),
                            calibre: calibre
                        });
                    }
                }
            }
        });

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            const prodIdsWithError = Object.keys(newErrors).map(k => k.split('-')[0]).map(Number);
            setExpandedProductIds(prev => [...new Set([...prev, ...prodIdsWithError])]);
            return;
        }

        setErrors({});

        if (itemsToSave.length === 0) {
            return;
        }

        // La validación de límites (isExceeded) ya se realiza al inicio de handleConfirmar 
        // de forma completamente dinámica usando los saldos restantes.

        setIsSubmitting(true);
        try {
            const success = await handleGuardarEnvasado(itemsToSave, {
                cerrar_lote: cerrarLote,
                merma_kg: cerrarLote && saldoRestante > 0 ? saldoRestante : 0
            });
            if (success) {
                clearDraft();
                cerrarPopup();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCamaraGlobalChange = (val) => {
        setCamaraGlobal(val);
        setFormData(prev => {
            const nextState = { ...prev };
            Object.keys(nextState).forEach(k => {
                nextState[k].ubicacion = val;
            });
            return nextState;
        });
    };

    const groupedProducts = {};
    filteredProducts.forEach(prod => {
        const origin = prod.origen || 'Otros';
        if (!groupedProducts[origin]) groupedProducts[origin] = [];
        groupedProducts[origin].push(prod);
    });

    const saldoRestante = dynamicBalances.reduce((acc, curr) => acc + (curr.saldoRestante > 0 ? curr.saldoRestante : 0), 0);

    if (!show) return null;

    return (
        <div className="bg" style={{ display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={cerrarPopup}>
            <div className="popup" onClick={e => e.stopPropagation()} style={{ width: '1100px', flex: loteSeleccionado ? '1 1 auto' : '0 1 auto', maxWidth: loteSeleccionado ? '1100px' : '98%', maxHeight: '90vh', overflowY: 'auto', padding: '32px', margin: 0 }}>
                <button className='btn-close-x' onClick={cerrarPopup}>X</button>
                <h2 style={{ color: '#003366', marginBottom: '24px', fontSize: '1.4rem' }}>Ingreso a Cámara (Envasado)</h2>

                {loading ? <div style={{ padding: '30px', textAlign: 'center' }}>Cargando...</div> : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            
                            {/* PASO 1: Selección Inicial */}
                            <div className="popup-section" style={{ marginBottom: 0, padding: '24px' }}>
                                <h3 className="popup-section-title">
                                    <span style={{ color: '#003366', marginRight: '8px' }}>•</span>
                                    Contexto de Producción
                                </h3>
                                <div className="popup-grid-2">
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#444', display: 'block', marginBottom: '6px' }}>Lote de Origen</label>
                                        <select
                                            value={loteSeleccionado}
                                            onChange={(e) => setLoteSeleccionado(e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem' }}
                                        >
                                            <option value="">-- Seleccione Lote --</option>
                                            {(lotes || []).map(l => (
                                                <option key={l.id} value={l.id}>
                                                    {l.codigo} | {l.materiaPrimaNombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontWeight: '600', fontSize: '0.9rem', color: '#444', display: 'block', marginBottom: '6px' }}>Cámara Global Destino</label>
                                        <select
                                            value={camaraGlobal}
                                            onChange={(e) => handleCamaraGlobalChange(e.target.value)}
                                            style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #ccc', fontSize: '0.95rem' }}
                                        >
                                            <option value="">-- Asignación Manual por Producto --</option>
                                            {(ubicaciones || []).filter(u => u.tipo === 'camara').map(u => (
                                                <option key={u.id} value={u.id}>{u.nombre}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* PASO 3: Catálogo */}
                            {loteSeleccionado && (
                            <div className="popup-section" style={{ marginBottom: 0, padding: '24px' }}>
                                <h3 className="popup-section-title">
                                    <span style={{ color: '#003366', marginRight: '8px' }}>•</span>
                                    Desglose de Calibres
                                </h3>
                                <div className="table-container-native" style={{ width: '100%', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)', border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', background: '#ffffff', marginTop: '15px' }}>
                                    <table className="samar-table" style={{ width: '100%', borderCollapse: 'collapse', margin: 0 }}>
                                        <thead>
                                            <tr style={{ background: '#f8fafc', color: '#003366', borderBottom: '2px solid #e2e8f0', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '700', width: '25%', color: '#003366' }}>Producto</th>
                                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '700', width: '20%', color: '#003366' }}>Calibre</th>
                                                <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: '700', width: '15%', color: '#003366' }}>Cant. (Envases)</th>
                                                <th style={{ padding: '16px 20px', textAlign: 'center', fontWeight: '700', width: '15%', color: '#003366' }}>Peso Total (Kg)</th>
                                                <th style={{ padding: '16px 20px', textAlign: 'left', fontWeight: '700', width: '25%', color: '#003366' }}>Ubicación</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {Object.entries(groupedProducts).flatMap(([origen, products]) => {
                                                const groupHeader = (
                                                    <tr key={`group-${origen}`} style={{ background: '#e2e8f0', color: '#0f172a' }}>
                                                        <td colSpan="5" style={{ padding: '12px 20px', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.9rem', color: '#003366' }}>
                                                            Origen: {origen}
                                                        </td>
                                                    </tr>
                                                );

                                                const groupRows = products.flatMap((prod, prodIdx) => {
                                                    const calibres = Array.isArray(prod.calibres)
                                                        ? prod.calibres
                                                        : (typeof prod.calibres === 'string'
                                                            ? prod.calibres.split(',').map(c => c.trim()).filter(c => c !== '')
                                                            : []);
                                                    
                                                    if (calibres.length === 0) {
                                                        return [(
                                                            <tr key={`empty-${prod.id}`} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                                                <td style={{ padding: '20px', fontWeight: '700', color: '#1e293b', verticalAlign: 'middle', borderRight: '1px solid #f1f5f9', background: '#f8fafc' }}>{prod.nombre}</td>
                                                                <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', fontStyle: 'italic' }}>Sin calibres definidos</td>
                                                            </tr>
                                                        )];
                                                    }

                                                    return calibres.map((cal, idx) => {
                                                        const key = `${prod.id}-${cal}`;
                                                        const data = formData[key] || {};
                                                        const rowErrors = errors[key] || {};
                                                        const gramaje = obtenerGramaje(cal);
                                                        
                                                        const origenStr = prod.origen ? prod.origen.toLowerCase() : '';
                                                        const relatedBalance = dynamicBalances.find(b => 
                                                            origenStr.includes(b.nombre.toLowerCase()) || b.nombre.toLowerCase().includes(origenStr)
                                                        );
                                                        const isOverdrawn = relatedBalance ? relatedBalance.saldoRestante < -0.01 : false;
                                                        const hasQtyError = rowErrors.cantidad || (isOverdrawn && (data.cantidad > 0 || data.pesoTotal > 0));

                                                        // Estilos para inputs modernos (Option 1)
                                                        const inputStyle = {
                                                            width: '100%',
                                                            padding: '10px 12px',
                                                            textAlign: 'center',
                                                            borderRadius: '6px',
                                                            border: '1px solid transparent',
                                                            backgroundColor: hasQtyError ? '#fee2e2' : '#f1f5f9',
                                                            boxShadow: hasQtyError ? '0 0 0 1px #ef4444' : 'inset 0 1px 2px rgba(0,0,0,0.05)',
                                                            transition: 'all 0.2s',
                                                            outline: 'none',
                                                            fontSize: '0.95rem'
                                                        };
                                                        const inputStylePeso = {
                                                            ...inputStyle,
                                                            backgroundColor: gramaje > 0 ? '#e2e8f0' : (hasQtyError ? '#fee2e2' : '#f1f5f9'),
                                                        };

                                                        return (
                                                            <tr key={`${prod.id}-${idx}`} style={{ borderBottom: idx === calibres.length - 1 ? '2px solid #e2e8f0' : '1px solid #f8fafc' }}>
                                                                {idx === 0 && (
                                                                    <td rowSpan={calibres.length} style={{ padding: '20px', fontWeight: '700', color: '#0f172a', verticalAlign: 'middle', borderRight: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '1.05rem' }}>
                                                                        {prod.nombre}
                                                                    </td>
                                                                )}
                                                                <td style={{ fontWeight: '600', padding: '16px 20px', whiteSpace: 'nowrap', color: '#475569', fontSize: '0.95rem' }}>{cal}</td>
                                                                <td style={{ padding: '12px 20px' }}>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="0"
                                                                        value={data.cantidad || ''}
                                                                        onChange={(e) => handleInputChange(prod.id, cal, 'cantidad', e.target.value)}
                                                                        style={inputStyle}
                                                                        onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
                                                                        onBlur={(e) => e.target.style.border = '1px solid transparent'}
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '12px 20px' }}>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="0.00"
                                                                        value={data.pesoTotal || ''}
                                                                        onChange={(e) => handleInputChange(prod.id, cal, 'pesoTotal', e.target.value)}
                                                                        disabled={gramaje > 0}
                                                                        style={inputStylePeso}
                                                                        onFocus={(e) => e.target.style.border = gramaje > 0 ? '1px solid transparent' : '1px solid #3b82f6'}
                                                                        onBlur={(e) => e.target.style.border = '1px solid transparent'}
                                                                    />
                                                                </td>
                                                                <td style={{ padding: '12px 20px' }}>
                                                                    <select
                                                                        value={data.ubicacion || camaraGlobal}
                                                                        onChange={(e) => handleInputChange(prod.id, cal, 'ubicacion', e.target.value)}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '10px 12px',
                                                                            borderRadius: '6px',
                                                                            border: rowErrors.ubicacion ? '1px solid #ef4444' : '1px solid #cbd5e1',
                                                                            backgroundColor: '#ffffff',
                                                                            outline: 'none',
                                                                            fontSize: '0.95rem'
                                                                        }}
                                                                    >
                                                                        <option value="">- Selec -</option>
                                                                        {(ubicaciones || []).filter(u => u.tipo === 'camara').map(u => (
                                                                            <option key={u.id} value={u.id}>{u.nombre}</option>
                                                                        ))}
                                                                    </select>
                                                                </td>
                                                            </tr>
                                                        );
                                                    });
                                                });
                                                return [groupHeader, ...groupRows];
                                            })}
                                            {filteredProducts.length === 0 && (
                                                <tr>
                                                    <td colSpan="5" style={{ padding: '40px', textAlign: 'center', color: '#64748b', fontSize: '1.1rem' }}>
                                                        No hay productos definidos para esta Materia Prima.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {loteSeleccionado && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                marginTop: '20px',
                                padding: '12px 16px',
                                background: cerrarLote ? '#fff7ed' : '#f8fafc',
                                border: cerrarLote ? '1px solid #ffedd5' : '1px solid #e2e8f0',
                                borderRadius: '10px',
                                transition: 'all 0.2s ease-in-out',
                                opacity: saldoRestante > 0 ? 1 : 0.6
                            }}>
                                <input
                                    type="checkbox"
                                    id="cerrarLoteCheckbox"
                                    checked={cerrarLote}
                                    onChange={(e) => setCerrarLote(e.target.checked)}
                                    disabled={saldoRestante <= 0}
                                    style={{ width: '18px', height: '18px', cursor: saldoRestante > 0 ? 'pointer' : 'not-allowed', accentColor: '#ea580c' }}
                                />
                                <label
                                    htmlFor="cerrarLoteCheckbox"
                                    style={{
                                        fontSize: '0.9rem',
                                        fontWeight: '600',
                                        color: cerrarLote ? '#c2410c' : '#334155',
                                        cursor: saldoRestante > 0 ? 'pointer' : 'not-allowed',
                                        margin: 0
                                    }}
                                >
                                    Ingreso Final: Cerrar lote y registrar saldo restante ({saldoRestante > 0 ? saldoRestante.toFixed(2) : '0.00'} kg) como merma
                                </label>
                            </div>
                        )}

                        <div className="popup-actions" style={{ marginTop: '20px' }}>
                            <button className="btn-cancel" onClick={cerrarPopup} disabled={isSubmitting}>
                                Cancelar
                            </button>
                            <button
                                className="btn-save"
                                onClick={handleConfirmar}
                                disabled={isExceeded || isSubmitting}
                                style={{
                                    backgroundColor: (isExceeded || isSubmitting) ? '#cbd5e1' : '#10b981',
                                    color: (isExceeded || isSubmitting) ? '#64748b' : '#ffffff',
                                    cursor: (isExceeded || isSubmitting) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {isSubmitting ? 'Guardando...' : 'Confirmar y Guardar Todos'}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* TARJETA FLOTANTE DE RENDIMIENTO (Fuera del popup principal) */}
            {loteSeleccionado && !loading && (
                <div className="popup-side-panel" onClick={e => e.stopPropagation()} style={{ 
                    flex: '0 0 320px', 
                    background: '#ffffff', 
                    borderRadius: '12px', 
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', 
                    maxHeight: '90vh',
                    overflowY: 'auto',
                    border: '1px solid #e2e8f0',
                    display: 'flex', 
                    flexDirection: 'column'
                }}>
                    <div style={{ padding: '24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 0, zIndex: 10 }}>
                        <h3 className="popup-section-title" style={{ margin: 0 }}>
                            <span style={{ color: '#003366', marginRight: '8px' }}>•</span>
                            Rendimiento en Tiempo Real
                        </h3>
                    </div>
                    <div style={{ padding: '24px' }}>
                        <ProductionSummaryBar 
                            isExceeded={isExceeded}
                            dynamicBalances={dynamicBalances}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
