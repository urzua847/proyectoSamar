import { useState } from 'react';
import '../styles/popup.css';

const PopupDespacho = ({ isOpen, onClose, cart, onRemoveItem, onConfirmVenta }) => {
    const [clientData, setClientData] = useState({
        cliente: '',
        n_guia_despacho: '', // Will be ignored by backend but kept for UI if needed or read-only
        tipo_venta: 'Nacional'
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirmVenta(clientData);
    };

    return (
        <div className="bg" onClick={onClose}>
            <div className="popup" onClick={(e) => e.stopPropagation()} style={{ width: '700px', maxWidth: '95%' }}>
                <button className="close" onClick={onClose}>&times;</button>
                <h2 style={{ color: '#003366', marginTop: 0 }}>Planilla de Despacho</h2>

                <form onSubmit={handleSubmit}>
                    <div className="filter-row-2" style={{ width: '100%', gap: '15px', marginBottom: '20px' }}>
                        <div className="filter-group">
                            <label>Cliente</label>
                            <input
                                required
                                value={clientData.cliente}
                                onChange={e => setClientData({ ...clientData, cliente: e.target.value })}
                                placeholder="Nombre Cliente"
                            />
                        </div>
                        <div className="filter-group">
                            <label>N° Guía (Auto)</label>
                            <input
                                disabled
                                placeholder="Generado autom."
                                style={{ backgroundColor: '#e9ecef', cursor: 'not-allowed' }}
                            />
                        </div>
                        <div className="filter-group">
                            <label>Tipo Venta</label>
                            <select
                                value={clientData.tipo_venta}
                                onChange={e => setClientData({ ...clientData, tipo_venta: e.target.value })}
                            >
                                <option value="Nacional">Nacional</option>
                                <option value="Exportación">Exportación</option>
                            </select>
                        </div>
                    </div>

                    <h3 style={{ fontSize: '1rem', color: '#555', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                        Items en Carrito ({cart.length})
                    </h3>

                    <div className="table-container-native" style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '20px' }}>
                        <table className="samar-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Calibre</th>
                                    <th>Lote</th>
                                    <th style={{ textAlign: 'right' }}>Cant. (Kg)</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {cart.map((item, idx) => (
                                    <tr key={idx}>
                                        <td>{item.productoNombre}</td>
                                        <td>{item.calibre || '-'}</td>
                                        <td>{item.loteCodigo || '-'}</td>
                                        <td style={{ textAlign: 'right' }}>{item.cantidad}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => onRemoveItem(idx)}
                                                style={{ background: 'none', border: 'none', color: '#dc3545', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.2rem' }}
                                                title="Eliminar"
                                            >
                                                &times;
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {cart.length === 0 && (
                                    <tr><td colSpan="5" className="no-data">Carrito vacío</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                        <button type="submit" className="btn-new" disabled={cart.length === 0}>
                            Confirmar Pedido
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PopupDespacho;
