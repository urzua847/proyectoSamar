import '../styles/table.css';
import EmptyState from './EmptyState';

const Table = ({
    columns,
    data,
    onRowClick,
    onRowDoubleClick,
    selectedId,
    selectedIds = [],
    onSelectionChange,
    multiSelect = false,
    filters,
    onFilterChange,
    emptyTitle,
    emptyDescription,
    emptyActionLabel,
    onEmptyAction,
    pagination
}) => {

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
                                    onDoubleClick={() => onRowDoubleClick && onRowDoubleClick(row)}
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
                            <td colSpan={columns.length + (multiSelect ? 1 : 0)} style={{ padding: 0 }}>
                                <EmptyState
                                    title={emptyTitle || "No se encontraron registros"}
                                    description={emptyDescription || "No hay datos para mostrar con los criterios actuales."}
                                    actionLabel={emptyActionLabel}
                                    onAction={onEmptyAction}
                                />
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            
            {/* Pagination Controls */}
            {pagination && pagination.totalPages > 1 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderTop: '1px solid #e2e8f0',
                    backgroundColor: '#fff',
                    gap: '15px'
                }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                        Página {pagination.currentPage} de {pagination.totalPages}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            disabled={pagination.currentPage <= 1}
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: pagination.currentPage <= 1 ? '#f8fafc' : '#fff',
                                color: pagination.currentPage <= 1 ? '#cbd5e1' : '#334155',
                                cursor: pagination.currentPage <= 1 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                            }}
                        >
                            Anterior
                        </button>
                        <button 
                            disabled={pagination.currentPage >= pagination.totalPages}
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: pagination.currentPage >= pagination.totalPages ? '#f8fafc' : '#fff',
                                color: pagination.currentPage >= pagination.totalPages ? '#cbd5e1' : '#334155',
                                cursor: pagination.currentPage >= pagination.totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                            }}
                        >
                            Siguiente
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Table;