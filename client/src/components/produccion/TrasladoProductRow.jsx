import React from 'react';

const TrasladoProductRow = ({
    item,
    idx,
    isSelectionMode,
    movements,
    selectionMovements,
    handleInputChange,
    handleSelectionInputChange
}) => {
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
};

export default TrasladoProductRow;
