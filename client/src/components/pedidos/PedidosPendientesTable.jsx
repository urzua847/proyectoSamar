import { Fragment } from 'react';
import ActionButton from '../ActionButton';

const PedidosPendientesTable = ({
    orderHistory,
    expandedRows,
    toggleRow,
    handleDeletePedido,
    handleLiberarCaja
}) => {
    const pendientes = orderHistory.filter(o => o.estado === 'Pendiente');

    if (pendientes.length === 0) return null;

    return (
        <div className="table-container-box" style={{ marginBottom: '20px' }}>
            <h3 style={{ color: '#003366', marginTop: '0', marginBottom: '15px', fontSize: '1.1rem' }}>Pedidos Pendientes</h3>
            <div className="table-responsive">
                <table className="samar-table">
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Guía</th>
                            <th>Total Cajas</th>
                            <th>Total Kilos</th>
                            <th style={{ textAlign: 'center' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendientes.map(pedido => {
                            const isExpanded = !!expandedRows[pedido.id];

                            const groupedDetails = (pedido.details || []).reduce((acc, curr) => {
                                const key = `${curr.productoNombre}-${curr.calibre}`;
                                if (!acc[key]) {
                                    acc[key] = {
                                        nombre: curr.productoNombre,
                                        calibre: curr.calibre,
                                        totalKilos: 0,
                                        totalCajas: 0,
                                        cajasAsignadas: 0
                                    };
                                }
                                acc[key].totalKilos += Number(curr.kilos_totales || 0);
                                acc[key].totalCajas += Number(curr.cantidad_bultos || 0);
                                acc[key].cajasAsignadas += Number(curr.cajas_asignadas || 0);
                                return acc;
                            }, {});
                            const productList = Object.values(groupedDetails);

                            return (
                                <Fragment key={pedido.id}>
                                    <tr onClick={() => toggleRow(pedido.id)} style={{ cursor: 'pointer', backgroundColor: isExpanded ? '#f8fafc' : 'transparent', transition: 'background-color 0.2s' }}>
                                        <td>
                                            <span style={{ marginRight: '8px', display: 'inline-block', transform: isExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', fontSize: '0.8rem', color: '#64748b' }}>▶</span>
                                            {pedido.fecha}
                                        </td>
                                        <td>{pedido.cliente}</td>
                                        <td>{pedido.guia}</td>
                                        <td>{pedido.totalItems}</td>
                                        <td>{pedido.totalKilos}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <ActionButton
                                                variant="delete"
                                                onClick={(e) => { e.stopPropagation(); handleDeletePedido(pedido.id); }}
                                                title="Eliminar Pedido"
                                            />
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr style={{ backgroundColor: '#f8fafc' }}>
                                            <td colSpan={6} style={{ padding: '0' }}>
                                                <div style={{ padding: '15px 40px', borderBottom: '2px solid #cbd5e1' }}>
                                                    {productList.length === 0 ? (
                                                        <p style={{ margin: 0, color: '#64748b', fontStyle: 'italic' }}>Sin productos registrados en este pedido.</p>
                                                    ) : (
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', borderRadius: '6px', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                                                            <thead style={{ backgroundColor: '#f1f5f9' }}>
                                                                <tr>
                                                                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>Producto</th>
                                                                    <th style={{ padding: '8px 12px', textAlign: 'left', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>Calibre</th>
                                                                    <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>Cajas (Asignadas / Total)</th>
                                                                    <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>Kilos/Caja</th>
                                                                    <th style={{ padding: '8px 12px', textAlign: 'center', borderBottom: '1px solid #e2e8f0', color: '#475569', fontSize: '0.85rem' }}>Total Kilos</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {productList.map((product, idx) => (
                                                                    <tr key={idx} style={{ borderBottom: idx === productList.length - 1 ? 'none' : '1px solid #e2e8f0' }}>
                                                                        <td style={{ padding: '8px 12px' }}>{product.nombre}</td>
                                                                        <td style={{ padding: '8px 12px' }}>{product.calibre}</td>
                                                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                                                                            <span style={{
                                                                                color: product.cajasAsignadas >= product.totalCajas ? '#16a34a' : '#d97706',
                                                                                fontWeight: 'bold'
                                                                            }}>
                                                                                {product.cajasAsignadas}
                                                                            </span> / {product.totalCajas}
                                                                        </td>
                                                                        <td style={{ padding: '8px 12px', textAlign: 'center' }}>{(product.totalKilos / product.totalCajas).toFixed(2)}</td>
                                                                        <td style={{ padding: '8px 12px', textAlign: 'center', fontWeight: '500' }}>{product.totalKilos.toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    )}

                                                    {/* Assigned boxes tags */}
                                                    <div style={{ marginTop: '15px' }}>
                                                        <h5 style={{ margin: '0 0 8px 0', color: '#334155', fontSize: '0.9rem' }}>Cajas Asignadas Físicamente:</h5>
                                                        {pedido.cajasFisicas?.length > 0 ? (
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                                {pedido.cajasFisicas.map(caja => (
                                                                    <span key={caja.id} style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500' }}>
                                                                        PT-{caja.id}
                                                                        <button
                                                                            onClick={(e) => { e.stopPropagation(); handleLiberarCaja(pedido.id, caja.id); }}
                                                                            style={{ marginLeft: '6px', background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '0', fontSize: '1.2rem', lineHeight: '0.8', fontWeight: 'bold' }}
                                                                            title="Liberar caja (Devolver a stock)"
                                                                        >
                                                                            &times;
                                                                        </button>
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8', fontStyle: 'italic' }}>Ninguna caja escaneada aún.</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PedidosPendientesTable;





