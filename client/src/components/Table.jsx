import '../styles/table.css';

// columns: Array de objetos { header: "Nombre", accessor: "nombreCompleto" }
// data: Array de datos
// onRowClick: Función opcional al hacer click en una fila (para seleccionar)
// selectedRow: ID o RUT de la fila seleccionada actualmente

const Table = ({ columns, data, onRowClick, selectedId }) => {
    
    if (!data || data.length === 0) {
        return <div className="no-data">No hay datos para mostrar.</div>;
    }

    return (
        <div className="table-container-native">
            <table className="samar-table">
                <thead>
                    <tr>
                        {columns.map((col, index) => (
                            <th key={index} style={{ width: col.width }}>
                                {col.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => {

                        const isSelected = selectedId && (row.rut === selectedId || row.id === selectedId);
                        
                        return (
                            <tr 
                                key={rowIndex} 
                                onClick={() => onRowClick && onRowClick(row)}
                                className={isSelected ? 'selected-row' : ''}
                            >
                                {columns.map((col, colIndex) => (
                                    <td key={colIndex}>
                                        {/* Si hay una función render personalizada, úsala. Si no, muestra el texto */}
                                        {col.render ? col.render(row) : row[col.accessor]}
                                    </td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default Table;