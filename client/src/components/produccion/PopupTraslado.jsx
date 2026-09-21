import React, { useState, useEffect, useRef } from 'react';
import axios from '../../services/root.service.js';
import { showToastSuccess, showToastError, showToastWarning } from '../../helpers/sweetAlert.js';
import '../../styles/popup.css';
import '../../styles/table.css';

const PopupTraslado = ({ isOpen, onClose, onTrasladoSuccess, initialSelection }) => {
    const [contenedores, setContenedores] = useState([]);
    const [stockCamara, setStockCamara] = useState([]);
    const [selectedContenedor, setSelectedContenedor] = useState('');
    const [movements, setMovements] = useState({});

    const [isPacking, setIsPacking] = useState(false);
    const [boxWeight, setBoxWeight] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Ref para prevenir doble clic en submit
    const isSubmittingRef = useRef(false);

    useEffect(() => {
        if (isOpen) {
            fetchContenedores();
            if (!initialSelection || initialSelection.length === 0) {
                fetchStockCamara();
            }
        }
    }, [isOpen, initialSelection]);

    const fetchContenedores = async () => {
        try {
            const response = await axios.get('/ubicaciones');
            const conts = (response.data?.data || []).filter(u => u.tipo === 'contenedor');
            setContenedores(conts);
        } catch (error) {
            console.error("Error fetching ubicaciones", error);
        }
    };

    const fetchStockCamara = async () => {
        try {
            const response = await axios.get('/envasado/stock/camaras');
            setStockCamara(response.data?.data || []);
        } catch (error) {
            console.error("Error fetching stock camara", error);
            setStockCamara([]);
        }
    };

    const handleContenedorChange = (e) => {
        setSelectedContenedor(e.target.value);
        setIsPacking(false);
        setBoxWeight("");
    };

    const handleInputChange = (key, value) => {
        setMovements(prev => ({
            ...prev,
            [key]: value
        }));
    };

    // Validar si algún movimiento excede el stock disponible
    const hasExceededStock = (stockCamara || []).some(item => {
        const uniqueKey = `${item.definicionProductoId}__${item.calibre || 'null'}`;
        const qty = Number(movements[uniqueKey] || 0);
        return qty > Number(item.totalCantidad || 0);
    });

    const handleSubmit = async () => {
        // Prevenir doble clic
        if (isSubmittingRef.current) {
            console.log('⚠️  Doble clic en traslado detectado y prevenido');
            return;
        }

        // Validación de selectedContenedor eliminada porque el destino es automático (Tránsito)
        if (hasExceededStock) return showToastError("La cantidad ingresada supera el stock disponible en uno o más productos.");

        isSubmittingRef.current = true;
        setIsSubmitting(true);

        let itemsToMove = [];

        if (initialSelection && initialSelection.length > 0) {
            itemsToMove = initialSelection.map(item => {
                const enteredQty = Number(selectionMovements[item.id] || 0);
                const totalWeight = Number(item.peso_neto_kg || 0);
                const totalCount = Number(item.cantidad || 0);
                const unitWeight = totalCount > 0 ? totalWeight / totalCount : 0;
                let weightToMove = unitWeight * enteredQty;

                return {
                    definicionProductoId: item.definicionProductoId,
                    calibre: item.calibre === '-' ? null : item.calibre,
                    loteId: item.loteId || null,
                    cantidad: Number(weightToMove.toFixed(2)) || 0
                };
            }).filter(item => item.cantidad > 0);
        } else {
            itemsToMove = Object.entries(movements)
                .filter(([_, qty]) => qty > 0)
                .map(([uniqueKey, qty]) => {
                    const [defId, calibre] = uniqueKey.split('__');
                    const stockItem = stockCamara.find(s =>
                        s.definicionProductoId == defId &&
                        (s.calibre === calibre || (s.calibre === null && calibre === 'null'))
                    );

                    let weightToMove = 0;
                    if (stockItem) {
                        const totalWeight = Number(stockItem.totalKilos);
                        const totalCount = Number(stockItem.totalCantidad);
                        const unitWeight = totalCount > 0 ? totalWeight / totalCount : 0;
                        weightToMove = unitWeight * Number(qty);
                    }

                    return {
                        definicionProductoId: Number(defId),
                        calibre: calibre === 'null' ? null : calibre,
                        cantidad: Number(weightToMove.toFixed(2))
                    };
                });
        }

        if (itemsToMove.length === 0) return showToastWarning("Ingrese cantidad a mover en al menos un producto.");

        if (!boxWeight || Number(boxWeight) <= 0) {
            setIsSubmitting(false);
            isSubmittingRef.current = false;
            return showToastWarning("Debe indicar el Kilos por Caja obligatoriamente.");
        }

        try {
            // Buscar el contenedor de destino
            const response = await axios.get('/ubicaciones');
            const ubicaciones = response.data?.data || [];
            
            // Buscar "En Tránsito" explícitamente, sino el primer contenedor disponible
            let transit = ubicaciones.find(u => u.tipo === 'contenedor' && u.nombre === 'En Tránsito');
            if (!transit) {
                transit = ubicaciones.find(u => u.tipo === 'contenedor');
            }
            if (!transit) {
                isSubmittingRef.current = false;
                setIsSubmitting(false);
                return showToastWarning("No hay contenedores creados en el sistema. Debe crear una ubicación de tipo contenedor (ej: 'En Tránsito').");
            }

            const payload = {
                destinoId: parseInt(transit.id),
                items: itemsToMove,
                peso_caja: Number(boxWeight)
            };

            await axios.post('/traslado', payload);
            showToastSuccess("Traslado realizado con éxito");
            onTrasladoSuccess();
            onClose();
        } catch (error) {
            console.error("Error en traslado", error);
            showToastError("Error al trasladar: " + (error.response?.data?.message || error.message));
        } finally {
            // Resetear el flag después de un delay
            setTimeout(() => {
                isSubmittingRef.current = false;
                setIsSubmitting(false);
            }, 500);
        }
    };

    const isSelectionMode = initialSelection && initialSelection.length > 0;
    const [selectionMovements, setSelectionMovements] = useState({});

    // Initialize selection movements when popup opens
    useEffect(() => {
        if (isSelectionMode) {
            const initialMoves = {};
            (initialSelection || []).forEach(item => {
                initialMoves[item.id] = item.cantidadTransfer;
            });
            setSelectionMovements(initialMoves);
        }
    }, [isSelectionMode, initialSelection]);

    if (!isOpen) return null;

    const handleSelectionInputChange = (id, value) => {
        setSelectionMovements(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const hasSelectionExceededStock = isSelectionMode && (initialSelection || []).some(item => {
        const qty = Number(selectionMovements[item.id] || 0);
        return qty > Number(item.cantidad || 0); // item.cantidad is the max available for that row
    });

    const displayData = isSelectionMode ? (initialSelection || []) : (stockCamara || []);

    const showPackingOption = selectedContenedor !== '';

    // Calculate total kilos to be moved for the dynamic summary
    const totalKilosToMove = displayData.reduce((acc, item) => {
        const enteredQty = isSelectionMode 
            ? Number(selectionMovements[item.id] || 0)
            : Number(movements[`${item.definicionProductoId}__${item.calibre || 'null'}`] || 0);

        const totalWeight = Number(item.peso_neto_kg || item.totalKilos || 0);
        const totalCount = Number(item.cantidad || item.totalCantidad || 0);
        const unitWeight = totalCount > 0 ? totalWeight / totalCount : 0;
        
        return acc + (unitWeight * enteredQty);
    }, 0);

    const projectedBoxes = (isPacking && Number(boxWeight) > 0) 
        ? Math.floor(totalKilosToMove / Number(boxWeight))
        : 0;

    return (
        <div className="bg" onClick={onClose}>
            <div className="popup" onClick={(e) => e.stopPropagation()} style={{ width: '900px', maxWidth: '98%' }}>
                <button className='btn-close-x' onClick={onClose}>X</button>
                <h2 style={{ color: '#003366', marginBottom: '10px' }}>
                    {isSelectionMode ? 'Confirmar Empaque y Traslado' : 'Mover Stock a Contenedor'}
                </h2>
                <div style={{ marginBottom: '20px', background: '#e3f2fd', padding: '12px 16px', borderRadius: '8px', color: '#0d47a1', fontSize: '0.9rem', border: '1px solid #bbdefb' }}>
                    ℹ️ <strong>Módulo de Traslados:</strong> Mueva productos a granel desde una Cámara hacia un Contenedor de destino.
                    Indique la cantidad de <strong>Kilos a Mover</strong> y empáquelos obligatoriamente en cajas usando el Paso 1.
                </div>

                {/* PASO 1: Destino - ELIMINADO SEGÚN NUEVO FLUJO */}
                <div style={{ display: 'none' }}>
                    <select value={selectedContenedor} readOnly>
                        <option value="">-- Automático --</option>
                    </select>
                </div>

                {/* PASO 1: Empaque Obligatorio */}
                <div className="popup-section" style={{ padding: '20px', background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <h3 className="popup-section-title" style={{ color: '#166534', borderBottomColor: '#bbf7d0' }}>
                        <span className="popup-step-badge" style={{ background: '#16a34a' }}>1</span>
                        Empaque Obligatorio
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <label style={{ fontWeight: '600', color: '#334155' }}>Kilos por Caja:</label>
                                <input
                                    type="number"
                                    style={{ padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', width: '110px', textAlign: 'right' }}
                                    placeholder="Ej: 10"
                                    min="0.01"
                                    step="0.01"
                                    value={boxWeight}
                                    onChange={e => {
                                        setBoxWeight(e.target.value);
                                        setIsPacking(true); // Force isPacking to true
                                    }}
                                />
                                
                                {totalKilosToMove > 0 && Number(boxWeight) > 0 && (
                                    <div style={{ padding: '8px 12px', background: '#dcfce7', color: '#166534', borderRadius: '6px', fontWeight: '500', fontSize: '0.9rem', marginLeft: '10px' }}>
                                        Moverás <strong>{totalKilosToMove.toFixed(2)} kg</strong> a granel ➡️ Se armarán <strong>{projectedBoxes} cajas</strong> de {boxWeight} kg.
                                    </div>
                                )}
                            </div>
                        </div>

                    {/* PASO 3: Selección de Productos */}
                <div className="popup-section" style={{ padding: 0, overflow: 'hidden' }}>
                    <h3 className="popup-section-title" style={{ padding: '20px', margin: 0, borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
                        <span className="popup-step-badge">3</span>
                        Productos a Trasladar
                    </h3>
                    <div className="table-container-native" style={{ maxHeight: '400px', overflowY: 'auto', border: 'none', borderRadius: 0, boxShadow: 'none' }}>
                        <table className="samar-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cámara Origen</th>
                                <th>Calibre</th>
                                {isSelectionMode ? (
                                    <>
                                        <th>Lote</th>
                                        <th style={{ textAlign: 'right' }}>CANTIDAD (UNIDADES)</th>
                                    </>
                                ) : (
                                    <>
                                        <th style={{ textAlign: 'right' }}>Disponible (kg)</th>
                                        <th style={{ width: '160px', textAlign: 'right' }}>CANTIDAD (UNIDADES)</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {displayData.map((item, idx) => {
                                const uniqueKey = `${item.definicionProductoId}__${item.calibre || 'null'}`;
                                const enteredQty = Number(movements[uniqueKey] || 0);
                                const isExceeded = !isSelectionMode && enteredQty > Number(item.totalCantidad);

                                return (
                                    <tr key={idx} className="hover-row">
                                        <td style={{ fontWeight: '500' }}>
                                            {isSelectionMode ? item.productoFinalNombre : item.productoNombre}
                                        </td>
                                        <td>{item.ubicacionNombre}</td>
                                        <td>{item.calibre || '-'}</td>

                                        {isSelectionMode ? (
                                            <>
                                                <td>{item.loteCodigo}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="column-filter-input"
                                                        style={{
                                                            textAlign: 'right',
                                                            fontWeight: 'bold',
                                                            border: (Number(selectionMovements[item.id] || 0) > Number(item.cantidad)) ? '2px solid #ef4444' : '1px solid #ccc',
                                                            backgroundColor: (Number(selectionMovements[item.id] || 0) > Number(item.cantidad)) ? '#fef2f2' : '#ffffff'
                                                        }}
                                                        min="0"
                                                        max={item.cantidad}
                                                        value={selectionMovements[item.id] !== undefined ? selectionMovements[item.id] : ''}
                                                        onChange={(e) => handleSelectionInputChange(item.id, e.target.value)}
                                                    />
                                                    {(Number(selectionMovements[item.id] || 0) > Number(item.cantidad)) && (
                                                        <div style={{ color: '#ef4444', fontSize: '0.75rem', textAlign: 'right', marginTop: '2px', fontWeight: 600 }}>
                                                            Máx: {item.cantidad}
                                                        </div>
                                                    )}
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#155724' }}>
                                                    {item.totalCantidad}
                                                </td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        className="column-filter-input"
                                                        style={{
                                                            textAlign: 'right',
                                                            fontWeight: 'bold',
                                                            border: isExceeded ? '2px solid #ef4444' : '1px solid #ccc',
                                                            backgroundColor: isExceeded ? '#fef2f2' : '#ffffff'
                                                        }}
                                                        min="0"
                                                        max={item.totalCantidad}
                                                        placeholder="0"
                                                        onChange={(e) => handleInputChange(uniqueKey, e.target.value)}
                                                    />
                                                    {isExceeded && (
                                                        <div style={{ color: '#ef4444', fontSize: '0.75rem', textAlign: 'right', marginTop: '2px', fontWeight: 600 }}>
                                                            Supera stock ({item.totalCantidad})
                                                        </div>
                                                    )}
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                            {displayData.length === 0 && (
                                <tr><td colSpan="5" className="no-data">No hay datos.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                </div>

                <div className="popup-actions">
                    <button type="button" onClick={onClose} className="btn-cancel">
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="btn-save"
                        disabled={hasExceededStock || hasSelectionExceededStock || isSubmitting}
                        style={{
                            opacity: (hasExceededStock || hasSelectionExceededStock || isSubmitting) ? 0.5 : 1,
                            cursor: (hasExceededStock || hasSelectionExceededStock || isSubmitting) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {isSubmitting ? 'Procesando...' : 'Confirmar Traslado'}
                    </button>
                </div>
            </div>
        </div>
        </div>
    );
};

export default PopupTraslado;

