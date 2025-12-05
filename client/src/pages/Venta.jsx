import React from 'react';
import { useForm } from 'react-hook-form';
import useVenta from '../hooks/venta/useVenta';
import '../styles/recepcion.css'; // Reutilizamos estilos por ahora
import '../styles/table.css';

const Venta = () => {
    const { productosAgrupados, ventas, loading, handleCreateVenta } = useVenta();
    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        const itemsToSell = [];

        productosAgrupados.forEach(prod => {
            const kilos = data[`kilos_${prod.key}`];
            const precio = data[`precio_${prod.key}`];

            if (kilos && Number(kilos) > 0) {
                itemsToSell.push({
                    definicionProductoId: prod.definicionId,
                    calibre: prod.calibre,
                    kilos: Number(kilos),
                    precio_kilo: Number(precio || 0)
                });
            }
        });

        if (itemsToSell.length === 0) {
            alert("Ingrese al menos una cantidad a vender.");
            return;
        }

        const ventaData = {
            cliente: data.cliente,
            items: itemsToSell
        };

        const success = await handleCreateVenta(ventaData);
        if (success) reset();
    };

    return (
        <div className="main-container">
            <div className="table-wrapper">
                <div className="top-table">
                    <h1 className="title-table">Salida de Productos / Ventas</h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>

                    {/* SECCIÓN DE FILTROS / CLIENTE */}
                    <div className="filter-section">
                        <div className="filter-row-2" style={{ width: '100%' }}>
                            <div className="filter-group">
                                <label>Cliente / Destino</label>
                                <input
                                    type="text"
                                    placeholder="Nombre del cliente"
                                    {...register("cliente", { required: "El cliente es obligatorio" })}
                                />
                                {errors.cliente && <span className="error-message visible">{errors.cliente.message}</span>}
                            </div>
                        </div>
                    </div>

                    {/* TABLA DE STOCK */}
                    <div className="table-container-native">
                        <h3 style={{ padding: '10px 15px', margin: 0, color: '#003366' }}>Stock Disponible</h3>
                        <table className="samar-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Calibre</th>
                                    <th>Stock (Kg)</th>
                                    <th>A Vender (Kg)</th>
                                    <th>Precio / Kg</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productosAgrupados.map(prod => (
                                    <tr key={prod.key}>
                                        <td style={{ textAlign: 'left', fontWeight: 'bold' }}>{prod.nombre}</td>
                                        <td>{prod.calibre || 'S/C'}</td>
                                        <td>{prod.pesoTotal.toFixed(2)}</td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="0.00"
                                                style={{ width: '100px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                                {...register(`kilos_${prod.key}`, { max: { value: prod.pesoTotal, message: "Excede stock" } })}
                                            />
                                            {errors[`kilos_${prod.key}`] && <span className="error-message visible">{errors[`kilos_${prod.key}`].message}</span>}
                                        </td>
                                        <td>
                                            <input
                                                type="number"
                                                step="0.01"
                                                placeholder="$"
                                                style={{ width: '100px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                                {...register(`precio_${prod.key}`)}
                                            />
                                        </td>
                                    </tr>
                                ))}
                                {productosAgrupados.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="no-data">No hay productos en stock.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                        <button type="submit" disabled={loading} className="btn-new" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                            {loading ? 'Registrando...' : 'Registrar Salida'}
                        </button>
                    </div>
                </form>

                {/* HISTORIAL DE VENTAS */}
                <div className="table-container-native" style={{ marginTop: '40px' }}>
                    <h3 style={{ padding: '10px 15px', margin: 0, color: '#003366', borderBottom: '1px solid #eee' }}>Historial de Salidas</h3>
                    <table className="samar-table">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Fecha</th>
                                <th>Cliente</th>
                                <th>Total</th>
                                <th>Detalles</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ventas.map(v => (
                                <tr key={v.id}>
                                    <td>{v.id}</td>
                                    <td>{new Date(v.fecha).toLocaleString()}</td>
                                    <td>{v.cliente}</td>
                                    <td>${v.total}</td>
                                    <td>
                                        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                            {v.detalles?.map(d => (
                                                <li key={d.id} style={{ fontSize: '0.85rem', marginBottom: '4px' }}>
                                                    {d.producto?.definicion?.nombre} ({d.peso}kg) - ${d.precio_unitario}/kg
                                                </li>
                                            ))}
                                        </ul>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Venta;
