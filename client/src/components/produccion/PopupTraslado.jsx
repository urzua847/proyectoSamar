import React, { useState, useEffect } from 'react';
import axios from '../../services/root.service.js';
import '../../styles/popup.css';
import '../../styles/table.css';

const PopupTraslado = ({ isOpen, onClose, onTrasladoSuccess, initialSelection }) => {
    const [contenedores, setContenedores] = useState([]);
    const [stockCamara, setStockCamara] = useState([]);
    const [selectedContenedor, setSelectedContenedor] = useState('');
    const [movements, setMovements] = useState({});

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
            const conts = response.data.data.filter(u => u.tipo === 'contenedor');
            setContenedores(conts);
        } catch (error) {
            console.error("Error fetching ubicaciones", error);
        }
    };

    const fetchStockCamara = async () => {
        try {
            const response = await axios.get('/produccion/stock/camaras');
            setStockCamara(response.data.data);
        } catch (error) {
            console.error("Error fetching stock camara", error);
        }
    };

    const handleInputChange = (key, value) => {
        setMovements(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleSubmit = async () => {
        if (!selectedContenedor) return alert("Seleccione un contenedor de destino");

        let itemsToMove = [];

        if (initialSelection && initialSelection.length > 0) {
            itemsToMove = initialSelection.map(item => {
                const totalWeight = Number(item.peso_neto_kg);
                const totalCount = Number(item.cantidad);
                const unitWeight = totalCount > 0 ? totalWeight / totalCount : 0;
                const weightToMove = unitWeight * Number(item.cantidadTransfer);

                return {
                    definicionProductoId: item.definicionProductoId,
                    calibre: item.calibre === '-' ? null : item.calibre,
                    loteId: item.loteId,
                    cantidad: Number(weightToMove.toFixed(2)) // Send weight, not count
                };
            });
        } else {
            itemsToMove = Object.entries(movements)
                .filter(([_, qty]) => qty > 0)
                .map(([uniqueKey, qty]) => {
                    const [defId, calibre] = uniqueKey.split('__');
                    // Find the item in stockCamara to get its weight/unit ratio
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
                        cantidad: Number(weightToMove.toFixed(2)) // Send converted weight
                    };
                });
        }

        if (itemsToMove.length === 0) return alert("Ingrese cantidad a mover en al menos un producto.");

        try {
            const payload = {
                destinoId: parseInt(selectedContenedor),
                items: itemsToMove
            };

            await axios.post('/traslado', payload);
            alert("Traslado realizado con éxito");
            onTrasladoSuccess();
            onClose();
        } catch (error) {
            console.error("Error en traslado", error);
            alert("Error al trasladar: " + (error.response?.data?.message || error.message));
        }
    };

    if (!isOpen) return null;

    const isSelectionMode = initialSelection && initialSelection.length > 0;
    const displayData = isSelectionMode ? initialSelection : stockCamara;

    return (
        <div className="bg">
            <div className="popup" style={{ width: '900px', maxWidth: '98%' }}>
                <button className='close' onClick={onClose}>X</button>
                <h2 style={{ color: '#003366', marginBottom: '20px' }}>
                    {isSelectionMode ? 'Confirmar Traslado' : 'Traslado a Contenedor'}
                </h2>

                <div style={{ marginBottom: '20px', padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#003366' }}>
                        Destino (Contenedor)
                    </label>
                    <select
                        value={selectedContenedor}
                        onChange={(e) => setSelectedContenedor(e.target.value)}
                        style={{ width: '100%', padding: '10px', fontSize: '1rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        <option value="">-- Seleccionar --</option>
                        {contenedores.map(c => (
                            <option key={c.id} value={c.id}>{c.nombre}</option>
                        ))}
                    </select>
                </div>

                <div className="table-container-native" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="samar-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Cámara Origen</th>
                                <th>Calibre</th>
                                {isSelectionMode ? (
                                    <>
                                        <th>Lote</th>
                                        <th style={{ textAlign: 'right' }}>A Mover (Cant.)</th>
                                    </>
                                ) : (
                                    <>
                                        <th style={{ textAlign: 'right' }}>Disponible (Unid)</th>
                                        <th style={{ width: '150px' }}>Mover (Unid)</th>
                                    </>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {displayData.map((item, idx) => {
                                const uniqueKey = `${item.definicionProductoId}__${item.calibre || 'null'}`;

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
                                                <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#007bff' }}>
                                                    {item.cantidadTransfer}
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
                                                        style={{ textAlign: 'right', fontWeight: 'bold' }}
                                                        min="0"
                                                        max={item.totalCantidad}
                                                        placeholder="0"
                                                        onChange={(e) => handleInputChange(uniqueKey, e.target.value)}
                                                    />
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

                <div style={{ padding: '20px', textAlign: 'right', gap: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} className="btn-edit" style={{ backgroundColor: '#6c757d' }}>Cancelar</button>
                    <button onClick={handleSubmit} className="btn-new" style={{ padding: '10px 25px' }}>Confirmar Traslado</button>
                </div>
            </div>
        </div>
    );
};

export default PopupTraslado;
