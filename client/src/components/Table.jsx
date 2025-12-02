import '../styles/table.css';

const Table = ({ columns, data, onRowClick, selectedId, filters, onFilterChange }) => {
    
    // Validación de seguridad para que no falle si data es null
    const safeData = data || [];

    return (
        <div className="table-container-native">
            <table className="samar-table">
                <thead>
                    {/* Fila de Títulos */}
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} style={{ width: col.width }}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                    
                    {/* Fila de Filtros (Solo si se activa) */}
                    {onFilterChange && (
                        <tr className="filter-row">
                            {columns.map((col, index) => (
                                <th key={`filter-${index}`} className="filter-cell">
                                    {col.accessor ? (
                                        <input
                                            type="text"
                                            className="column-filter-input"
                                            placeholder="..."
                                            value={filters?.[col.accessor] || ''}
                                            onChange={(e) => onFilterChange(col.accessor, e.target.value)}
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                    ) : null}
                                </th>
                            ))}
                        </tr>
                    )}
                </thead>
                <tbody>
                    {safeData.length > 0 ? (
                        safeData.map((row, rowIndex) => {
                            const isSelected = selectedId && (row.id === selectedId);
                            return (
                                <tr 
                                    key={rowIndex} 
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={isSelected ? 'selected-row' : ''}
                                >
                                    {columns.map((col, colIndex) => (
                                        <td key={colIndex}>
                                            {col.render ? col.render(row) : row[col.accessor]}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })
                    ) : (
                        <tr>
                            <td colSpan={columns.length} className="no-data">
                                No se encontraron datos.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default Table;