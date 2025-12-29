import '../styles/table.css';

const Table = ({ columns, data, onRowClick, selectedId, selectedIds = [], onSelectionChange, multiSelect = false, filters, onFilterChange }) => {

    // Validación de seguridad
    const safeData = data || [];

    const handleSelectAll = (e) => {
        if (!onSelectionChange) return;
        if (e.target.checked) {
            const allIds = safeData.map(row => row.id);
            onSelectionChange(allIds);
        } else {
            onSelectionChange([]);
        }
    };

    const handleRowCheckboxChange = (e, rowId) => {
        if (!onSelectionChange) return;
        e.stopPropagation();

        if (e.target.checked) {
            onSelectionChange([...selectedIds, rowId]);
        } else {
            onSelectionChange(selectedIds.filter(id => id !== rowId));
        }
    };

    const isAllSelected = safeData.length > 0 && selectedIds.length === safeData.length;

    return (
        <div className="table-container-native">
            <table className="samar-table">
                <thead>
                    <tr>
                        {/* Checkbox Header */}
                        {multiSelect && (
                            <th style={{ width: '40px', textAlign: 'center' }}>
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={isAllSelected}
                                    style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                />
                            </th>
                        )}
                        {columns.map((col, index) => (
                            <th key={index} style={{ width: col.width }}>
                                {col.header}
                            </th>
                        ))}
                    </tr>

                    {onFilterChange && (
                        <tr className="filter-row">
                            {/* Checkbox Placeholder for Filter Row */}
                            {multiSelect && <th className="filter-cell"></th>}
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
                            const isSingleSelected = selectedId && (row.id === selectedId);
                            const isMultiSelected = multiSelect && selectedIds.includes(row.id);

                            const isSelected = isSingleSelected || isMultiSelected;

                            return (
                                <tr
                                    key={rowIndex}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    className={isSelected ? 'selected-row' : ''}
                                >
                                    {multiSelect && (
                                        <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="checkbox"
                                                checked={isMultiSelected}
                                                onChange={(e) => handleRowCheckboxChange(e, row.id)}
                                                style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                            />
                                        </td>
                                    )}
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
                            <td colSpan={columns.length + (multiSelect ? 1 : 0)} className="no-data">
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