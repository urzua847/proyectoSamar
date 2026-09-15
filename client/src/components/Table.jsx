import { useState, useEffect } from 'react';
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

    // Paginación local automática
    const ITEMS_PER_PAGE = 30;
    const [localPage, setLocalPage] = useState(1);

    // Si la data cambia (ej. por filtros externos), reiniciamos la página local
    useEffect(() => {
        setLocalPage(1);
    }, [data]);

    const isLocalPagination = !pagination && safeData.length > ITEMS_PER_PAGE;
    
    let displayData = safeData;
    let activePagination = pagination;

    if (isLocalPagination) {
        const totalPages = Math.ceil(safeData.length / ITEMS_PER_PAGE);
        displayData = safeData.slice((localPage - 1) * ITEMS_PER_PAGE, localPage * ITEMS_PER_PAGE);
        activePagination = {
            currentPage: localPage,
            totalPages: totalPages,
            onPageChange: (page) => setLocalPage(page)
        };
    }

    const handleSelectAll = (e) => {
        if (!onSelectionChange) return;
        if (e.target.checked) {
            const allIds = displayData.map(row => row.id);
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

    const isAllSelected = displayData.length > 0 && selectedIds.length === displayData.length;

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
                    {displayData.length > 0 ? (
                        displayData.map((row, rowIndex) => {
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
            {activePagination && activePagination.totalPages > 1 && (
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
                        Página {activePagination.currentPage} de {activePagination.totalPages}
                    </span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                            disabled={activePagination.currentPage <= 1}
                            onClick={() => activePagination.onPageChange(activePagination.currentPage - 1)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: activePagination.currentPage <= 1 ? '#f8fafc' : '#fff',
                                color: activePagination.currentPage <= 1 ? '#cbd5e1' : '#334155',
                                cursor: activePagination.currentPage <= 1 ? 'not-allowed' : 'pointer',
                                fontSize: '0.85rem',
                                fontWeight: '500',
                                transition: 'all 0.2s'
                            }}
                        >
                            Anterior
                        </button>
                        <button 
                            disabled={activePagination.currentPage >= activePagination.totalPages}
                            onClick={() => activePagination.onPageChange(activePagination.currentPage + 1)}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid #e2e8f0',
                                backgroundColor: activePagination.currentPage >= activePagination.totalPages ? '#f8fafc' : '#fff',
                                color: activePagination.currentPage >= activePagination.totalPages ? '#cbd5e1' : '#334155',
                                cursor: activePagination.currentPage >= activePagination.totalPages ? 'not-allowed' : 'pointer',
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