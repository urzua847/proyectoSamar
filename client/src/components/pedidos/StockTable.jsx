import Table from '../../components/Table';
import { useState } from 'react';

const StockActionCell = ({ item, onAdd }) => {
    const [qty, setQty] = useState('');

    const handleAdd = () => {
        if (!qty || Number(qty) <= 0) return; // Validación simple, el padre puede hacer alert
        if (Number(qty) > Number(item.totalCantidad)) return;
        onAdd(Number(qty));
        setQty('');
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <input
                type="number"
                min="1"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                placeholder="0"
                className="input-qty-stock"
                onClick={(e) => e.stopPropagation()}
            />
            <button
                onClick={(e) => { e.stopPropagation(); handleAdd(); }}
                className="btn-add-stock"
                title="Agregar al pedido"
            >
                +
            </button>
        </div>
    );
};

const StockTable = ({
    availableStock,
    filters,
    setFilters,
    selectedIds,
    setSelectedIds,
    handleBulkDelete,
    handleDeleteRow,
    setItemToAdd // O handleAddToCart directo, en el Pedidos actual se usa `setItemToAdd`
}) => {

    const columnsStock = [
        { header: "ID Producto", accessor: "id", width: "80px" },
        { header: "Producto", accessor: "nombre" },
        { header: "Materia Prima", render: r => r.materiaPrima?.nombre || '-' },
        { header: "Origen", accessor: "origen" },
        {
            header: "Agregar a Pedido",
            width: "300px",
            render: (row) => {
                if (!row.calibresList || row.calibresList.length === 0) {
                    return <span style={{ color: '#94a3b8' }}>Sin calibres</span>;
                }
                return (
                    <div onClick={e => e.stopPropagation()} style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                        {row.calibresList.map(calibre => (
                            <div key={calibre} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ width: '80px', fontWeight: 'bold' }}>{calibre}</span>
                                <input
                                    type="number"
                                    placeholder="Cajas"
                                    min="1"
                                    style={{ width: '70px', padding: '4px', textAlign: 'center', border: '1px solid #ccc', borderRadius: '4px' }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && e.target.value) {
                                            // Llama a una función expuesta por Pedidos
                                            setItemToAdd({ row, calibre, qty: e.target.value });
                                            e.target.value = '';
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (e.target.value) {
                                            setItemToAdd({ row, calibre, qty: e.target.value });
                                            e.target.value = '';
                                        }
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                );
            }
        }
    ];

    return (
        <div className="table-container-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="Buscar por lote..."
                        value={filters.lote}
                        onChange={(e) => setFilters({ ...filters, lote: e.target.value })}
                        className="search-input"
                    />
                    <input
                        type="text"
                        placeholder="Buscar por producto..."
                        value={filters.producto}
                        onChange={(e) => setFilters({ ...filters, producto: e.target.value })}
                        className="search-input"
                    />
                    <button
                        onClick={() => setFilters({ lote: '', producto: '', ubicacion: '' })}
                        className="btn-cancel"
                        style={{ padding: '8px 16px' }}
                    >
                        Limpiar Filtros
                    </button>
                </div>

                {selectedIds.length > 0 && (
                    <button onClick={handleBulkDelete} className="btn-delete" style={{ padding: '8px 16px' }}>
                        Eliminar Seleccionados ({selectedIds.length})
                    </button>
                )}
            </div>

            <Table
                data={availableStock}
                columns={columnsStock}
                selectable={true}
                onSelectionChange={setSelectedIds}
                onDelete={handleDeleteRow}
            />
        </div>
    );
};

export default StockTable;
