import { Fragment } from 'react';
import ActionButton from '../ActionButton';

const CartPanel = ({
    cart,
    header,
    setHeader,
    clientesList,
    handleRemoveFromCart,
    handleConfirmPedido,
    isCartOpen,
    setIsCartOpen,
    totalBultosGlobal,
    totalKilosGlobal
}) => {
    if (!isCartOpen) return null;

    return (
        <div className="order-panel">
            <div className="order-panel__header">
                <h3>Resumen de Pedido</h3>
                <button className="btn-close-x" onClick={() => setIsCartOpen(false)}>&times;</button>
            </div>

            <div className="order-panel__content">
                {cart.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#64748b', marginTop: '20px' }}>No hay ítems en el pedido.</p>
                ) : (
                    <div>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', marginBottom: '15px' }}>
                            {cart.map((c, idx) => (
                                <div key={idx} style={{ padding: '10px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div>
                                        <div style={{ fontWeight: 'bold' }}>{c.nombre}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                                            Calibre: {c.calibreSeleccionado} | {c.cantidadBultos} cajas x {c.pesoCaja} kg = {c.subtotalKilos} kg
                                        </div>
                                    </div>
                                    <ActionButton 
                                        variant="delete" 
                                        onClick={() => handleRemoveFromCart(c.uniqueCartId)} 
                                        title="Eliminar ítem" 
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="order-summary__totals" style={{ display: 'flex', justifyContent: 'space-between', padding: '15px 0', borderTop: '1px solid #e2e8f0', fontWeight: 'bold' }}>
                            <span>Total Cajas: {totalBultosGlobal}</span>
                            <span>Total Kg: {totalKilosGlobal}</span>
                        </div>

                        <form onSubmit={handleConfirmPedido} style={{ display: 'grid', gap: '15px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 600 }}>Cliente</label>
                                <select
                                    required
                                    value={header.cliente}
                                    onChange={e => setHeader({ ...header, cliente: e.target.value })}
                                    className="search-input"
                                    style={{ width: '100%', padding: '10px' }}
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {clientesList.map(c => (
                                        <option key={c.id} value={c.nombre}>{c.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 600 }}>Tipo de Documento</label>
                                <select
                                    required
                                    value={header.tipo_documento}
                                    onChange={e => setHeader({ ...header, tipo_documento: e.target.value })}
                                    className="search-input"
                                    style={{ width: '100%', padding: '10px' }}
                                >
                                    <option value="Guía de Despacho">Guía de Despacho</option>
                                    <option value="Factura">Factura</option>
                                    <option value="Boleta">Boleta</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '5px', fontSize: '0.9rem', fontWeight: 600 }}>N° de Documento</label>
                                <input
                                    required
                                    placeholder="Ej: 123456"
                                    value={header.numero_documento}
                                    onChange={e => setHeader({ ...header, numero_documento: e.target.value })}
                                    className="search-input"
                                    style={{ width: '100%', padding: '10px' }}
                                />
                            </div>

                            <button type="submit" disabled={cart.length === 0} className="btn-save" style={{ marginTop: '10px', padding: '12px' }}>
                                Confirmar Pedido
                            </button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CartPanel;
