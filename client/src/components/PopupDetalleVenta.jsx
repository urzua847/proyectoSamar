import '../styles/popup.css';

const PopupDetalleVenta = ({ isOpen, onClose, venta }) => {
    if (!isOpen || !venta) return null;

    const items = venta.details || []; // Assuming 'details' contains the items array

    // Calculate totals just in case
    const totalKilos = items.reduce((acc, curr) => acc + Number(curr.peso_neto_kg || 0), 0).toFixed(2);
    const totalItems = items.length;

    return (
        <div className="bg" onClick={onClose}>
            <div className="popup" onClick={(e) => e.stopPropagation()} style={{ width: '600px', maxWidth: '90%' }}>
                <button className="close" onClick={onClose}>&times;</button>

                <h2 style={{ color: '#003366', marginTop: 0 }}>Detalle de Venta</h2>

                <div style={{ marginBottom: '15px', color: '#555' }}>
                    <p><strong>Cliente:</strong> {venta.cliente}</p>
                    <p><strong>N° Guía:</strong> {venta.guia}</p>
                    <p><strong>Fecha:</strong> {venta.fecha}</p>
                    <p><strong>Total Kilos:</strong> {totalKilos} kg</p>
                </div>

                <div className="table-container-native" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <table className="samar-table">
                        <thead>
                            <tr>
                                <th>Producto</th>
                                <th>Calibre</th>
                                <th>Lote Origen</th>
                                <th style={{ textAlign: 'right' }}>Peso (Kg)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, index) => (
                                <tr key={item.id || index}>
                                    <td>{item.definicion?.nombre || 'Producto Desconocido'}</td>
                                    <td>{item.calibre || '-'}</td>
                                    <td>{item.loteDeOrigen?.codigo || '-'}</td>
                                    <td style={{ textAlign: 'right' }}>{Number(item.peso_neto_kg).toFixed(2)}</td>
                                </tr>
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="no-data">No hay items en esta venta.</td>
                                </tr>
                            )}
                        </tbody>
                        <tfoot>
                            <tr style={{ fontWeight: 'bold', backgroundColor: '#f8f9fa' }}>
                                <td colSpan="3" style={{ textAlign: 'right' }}>Total:</td>
                                <td style={{ textAlign: 'right' }}>{totalKilos}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button className="btn-edit" onClick={onClose} style={{ color: 'white' }}>Cerrar</button>
                </div>
            </div>
        </div>
    );
};

export default PopupDetalleVenta;
