import React from 'react';

const StockFilters = ({ filtersStock, handleFilterStockChange, uniqueLotes, uniqueProductos, uniqueUbicaciones, activeTab, setFiltersStock }) => {
    return (
        <div style={{ display: 'flex', gap: '5px', marginBottom: '10px', flexWrap: 'wrap' }}>
            <input
                list="lotes-list"
                name="loteCodigo"
                placeholder="Lote..."
                value={filtersStock.loteCodigo}
                onChange={handleFilterStockChange}
                className="search-input"
            />
            <datalist id="lotes-list">
                {uniqueLotes.map(l => <option key={l} value={l} />)}
            </datalist>

            <input
                list="productos-list"
                name="producto"
                placeholder="Producto..."
                value={filtersStock.producto}
                onChange={handleFilterStockChange}
                className="search-input"
            />
            <datalist id="productos-list">
                {uniqueProductos.map(p => <option key={p} value={p} />)}
            </datalist>

            <input
                name="calibre"
                placeholder="Calibre..."
                value={filtersStock.calibre}
                onChange={handleFilterStockChange}
                className="search-input"
            />

            {activeTab === 'granel' && (
                <select
                    name="ubicacion"
                    value={filtersStock.ubicacion}
                    onChange={handleFilterStockChange}
                    className="search-input"
                >
                    <option value="">Todas las cámaras...</option>
                    {uniqueUbicaciones.map(u => (
                        <option key={u} value={u}>{u}</option>
                    ))}
                </select>
            )}

            {activeTab === 'granel' && (
                <select
                    name="orderHora"
                    value={filtersStock.orderHora}
                    onChange={handleFilterStockChange}
                    className="search-input"
                    style={{ width: 'auto' }}
                >
                    <option value="desc">Más Recientes</option>
                    <option value="asc">Más Antiguos</option>
                </select>
            )}

            <button
                onClick={() => setFiltersStock({ loteCodigo: '', orderHora: 'desc', producto: '', calibre: '', ubicacion: '' })}
                className="btn-cancel"
                style={{ padding: '6px 14px', whiteSpace: 'nowrap' }}
            >
                Limpiar
            </button>
        </div>
    );
};

export default StockFilters;
