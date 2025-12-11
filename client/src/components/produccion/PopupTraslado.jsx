import React, { useState, useEffect } from 'react';
import axios from '../../services/root.service.js';
import '../../styles/popup.css';
import '../../styles/table.css';

const PopupTraslado = ({ isOpen, onClose, onTrasladoSuccess }) => {
    const [contenedores, setContenedores] = useState([]);
    const [stockCamara, setStockCamara] = useState([]);
    const [selectedContenedor, setSelectedContenedor] = useState('');
    const [movements, setMovements] = useState({}); // { definicionProductoId-calibre: cantidad }

    useEffect(() => {
        if (isOpen) {
            fetchContenedores();
            fetchStockCamara();
        }
    }, [isOpen]);

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

        const itemsToMove = Object.entries(movements)
            .filter(([_, qty]) => qty > 0)
            .map(([uniqueKey, qty]) => {
                // key format from render: `${item.definicionProductoId}-${item.calibre || 'null'}`
                const [defId, calibre] = uniqueKey.split('__');

                return {
                    definicionProductoId: Number(defId),
                    calibre: calibre === 'null' ? null : calibre,
                    cantidad: Number(qty)
                };
            });

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

    return (
        <div className="bg">
            <div className="popup" style={{ width: '900px', maxWidth: '98%' }}>
                <button className='close' onClick={onClose}>X</button>
                <h2 style={{ color: '#003366', marginBottom: '20px' }}>Traslado a Contenedor</h2>

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
                                <th style={{ textAlign: 'right' }}>Disponible (Kg)</th>
                                <th style={{ width: '150px' }}>Mover (Kg)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stockCamara.map((item, idx) => {
                                // Needs identifier for logic.
                                // item must have 'definicionProductoId' and 'calibre'. 
                                // Ensured by previous backend update.
                                const uniqueKey = `${item.definicionProductoId}__${item.calibre || 'null'}`;

                                return (
                                    <tr key={idx} className="hover-row">
                                        <td style={{ fontWeight: '500' }}>{item.productoNombre}</td>
                                        <td>{item.ubicacionNombre}</td>
                                        <td>{item.calibre || '-'}</td>
                                        <td style={{ textAlign: 'right', fontWeight: 'bold', color: '#155724' }}>{item.totalKilos}</td>
                                        <td>
                                            <input
                                                type="number"
                                                className="column-filter-input"
                                                style={{ textAlign: 'right', fontWeight: 'bold' }}
                                                min="0"
                                                max={item.totalKilos}
                                                placeholder="0"
                                                onChange={(e) => handleInputChange(uniqueKey, e.target.value)}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                            {stockCamara.length === 0 && (
                                <tr><td colSpan="5" className="no-data">No hay stock disponible en cámaras.</td></tr>
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
