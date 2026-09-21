import { useState } from 'react';

const ProgressiveForm = ({ availableStock, onAddToCart }) => {
    const [selectedEspecie, setSelectedEspecie] = useState('');
    const [selectedProductoId, setSelectedProductoId] = useState('');
    const [selectedCalibre, setSelectedCalibre] = useState('');
    const [pesoCaja, setPesoCaja] = useState('');
    const [cantidadCajas, setCantidadCajas] = useState('');

    const productosElaborados = availableStock.filter(p => p.tipo !== 'primario');
    const especies = [...new Set(productosElaborados.map(p => p.materiaPrima?.nombre).filter(Boolean))];
    const productosFiltrados = productosElaborados.filter(p => p.materiaPrima?.nombre === selectedEspecie);
    const calibresDelProducto = selectedProductoId ? (productosFiltrados.find(p => p.id === String(selectedProductoId))?.calibresList || []) : [];

    const handleAgregarItem = (e) => {
        e.preventDefault();
        const prod = productosFiltrados.find(p => p.id === String(selectedProductoId));
        if (!prod) return;

        const pCaja = parseFloat(pesoCaja);
        const cBultos = parseInt(cantidadCajas);

        onAddToCart(prod, selectedCalibre, pCaja, cBultos);

        // Limpiar el formulario y volver al paso inicial o conservar algunos datos
        setPesoCaja('');
        setCantidadCajas('');
    };

    return (
        <div className="progressive-form-container" style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, color: '#003366', fontSize: '1.2rem', marginBottom: '20px' }}>Agregar Ítem al Pedido</h3>
            
            <form onSubmit={handleAgregarItem}>
                <div style={{ marginBottom: '15px' }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>1. Especie (Materia Prima)</label>
                    <select required value={selectedEspecie} onChange={e => { setSelectedEspecie(e.target.value); setSelectedProductoId(''); setSelectedCalibre(''); setPesoCaja(''); setCantidadCajas(''); }} className="search-input" style={{ width: '100%', padding: '10px' }}>
                        <option value="">-- Seleccione Especie --</option>
                        {especies.map(e => <option key={e} value={e}>{e}</option>)}
                    </select>
                </div>

                {selectedEspecie && (
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>2. Producto Final</label>
                        <select required value={selectedProductoId} onChange={e => { setSelectedProductoId(e.target.value); setSelectedCalibre(''); setPesoCaja(''); setCantidadCajas(''); }} className="search-input" style={{ width: '100%', padding: '10px' }}>
                            <option value="">-- Seleccione Producto --</option>
                            {productosFiltrados.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                        </select>
                    </div>
                )}

                {selectedProductoId && (
                    <div style={{ marginBottom: '15px' }}>
                        <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>3. Calibre</label>
                        <select required value={selectedCalibre} onChange={e => setSelectedCalibre(e.target.value)} className="search-input" style={{ width: '100%', padding: '10px' }}>
                            <option value="">-- Seleccione Calibre --</option>
                            {calibresDelProducto.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                )}

                {selectedCalibre && (
                    <div style={{ marginBottom: '15px', display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>4. Peso Caja (Kg)</label>
                            <input required type="number" min="0.1" step="0.1" value={pesoCaja} onChange={e => setPesoCaja(e.target.value)} className="search-input" style={{ width: '100%', padding: '10px' }} placeholder="Ej: 10" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontWeight: 600, marginBottom: '5px', color: '#475569' }}>5. Cantidad Cajas</label>
                            <input required type="number" min="1" step="1" value={cantidadCajas} onChange={e => setCantidadCajas(e.target.value)} className="search-input" style={{ width: '100%', padding: '10px' }} placeholder="Ej: 100" />
                        </div>
                    </div>
                )}

                <button 
                    type="submit"
                    disabled={!selectedEspecie || !selectedProductoId || !selectedCalibre || !pesoCaja || !cantidadCajas}
                    className="btn-save" 
                    style={{ width: '100%', marginTop: '10px', padding: '12px', opacity: (!selectedEspecie || !selectedProductoId || !selectedCalibre || !pesoCaja || !cantidadCajas) ? 0.5 : 1 }}>
                    Añadir al Carrito
                </button>
            </form>
        </div>
    );
};

export default ProgressiveForm;
