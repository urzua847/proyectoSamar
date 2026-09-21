import React from 'react';
import ActionButton from '../ActionButton';

export const getColumnsGranel = (handleDeleteRow, user) => [
    { header: "Lote", accessor: "loteCodigo" },
    { header: "Especie", accessor: "materiaPrimaNombre" },
    { header: "Producto", accessor: "productoFinalNombre" },
    { header: "Calibre", accessor: "calibre" },
    { header: "Cantidad (Bolsas/Unidades)", accessor: "cantidad" },
    { header: "Kilos Totales", accessor: "peso_neto_kg" },
    { header: "Cámara", accessor: "ubicacionNombre" },
    { header: "Hora Ingreso", accessor: "horaIngreso" },
    { 
        header: "Tiempo en Cámara", 
        render: (row) => (
            <span style={{ 
                padding: '4px 8px', 
                borderRadius: '4px', 
                backgroundColor: row.horasEnCamara > 48 ? '#fee2e2' : '#f1f5f9', 
                color: row.horasEnCamara > 48 ? '#ef4444' : '#475569',
                fontWeight: row.horasEnCamara > 48 ? 'bold' : 'normal'
            }}>
                {row.horasEnCamara} hrs
            </span>
        )
    },
    {
        header: "Acciones",
        render: (row) => (
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                {user?.rol === 'administrador' && (
                    <ActionButton
                        variant="delete"
                        title="Eliminar"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(row);
                        }}
                    />
                )}
            </div>
        )
    }
];

export const getColumnsTransito = (handleDeleteRow, user, handlePrintQR) => [
    { header: "Lote", accessor: "loteCodigo" },
    { header: "Producto", accessor: "productoNombre" },
    { header: "Calibre", accessor: "calibre" },
    { header: "Cajas Disponibles", accessor: "cantidad" },
    { 
        header: "Códigos de Caja", 
        render: (row) => {
            const prefix = "PT-";
            if (row.ids && row.ids.length > 0) {
                if (row.ids.length > 3) {
                    return `${prefix}${row.ids[0]} ... ${prefix}${row.ids[row.ids.length - 1]} (${row.ids.length} cajas)`;
                }
                return row.ids.map(id => `${prefix}${id}`).join(', ');
            }
            return `${prefix}${row.id}`;
        }
    },
    { header: "Kilos Totales", accessor: "peso_neto_kg" },
    { header: "Ubicación", accessor: "ubicacionNombre" },
    {
        header: "Acciones",
        render: (row) => (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                <ActionButton
                    variant="view"
                    title="Imprimir QRs"
                    onClick={(e) => {
                        e.stopPropagation();
                        handlePrintQR && handlePrintQR(row);
                    }}
                />
                {user?.rol === 'administrador' && (
                    <ActionButton
                        variant="delete"
                        title="Desarmar Caja y devolver a cámara"
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteRow(row);
                        }}
                    />
                )}
            </div>
        )
    }
];
