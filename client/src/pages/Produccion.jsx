import useProduccion from '../hooks/produccion/useProduccion';
import { useForm } from 'react-hook-form';
import { showSuccessAlert } from '../helpers/sweetAlert';
import '../styles/recepcion.css';
import '../styles/table.css';

const Produccion = () => {
    const {
        lotes,
        productos,
        ubicaciones,
        handleCreateProduccion
    } = useProduccion();

    const { register, handleSubmit, reset, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        // data.items será un objeto con keys como "prod_1_peso", "prod_1_calibre", etc.
        // Necesitamos transformarlo a un array limpio

        const itemsToSubmit = [];

        productos.forEach(prod => {
            const peso = data[`weight_${prod.id}`];
            const calibre = data[`calibre_${prod.id}`];
            const ubicacion = data[`ubicacion_${prod.id}`]; // O una ubicación global

            if (peso && Number(peso) > 0) {
                itemsToSubmit.push({
                    productoId: prod.id,
                    peso: peso,
                    calibre: calibre,
                    ubicacionId: ubicacion || data.ubicacionGlobal // Fallback a global si existe
                });
            }
        });

        if (itemsToSubmit.length === 0) {
            alert("Ingrese al menos un peso.");
            return;
        }

        const payload = {
            loteOrigen: data.loteOrigen,
            items: itemsToSubmit
        };

        const success = await handleCreateProduccion(payload);
        if (success) reset();
    };

    return (
        <div className="main-container">
            <div className="table-wrapper">
                <div className="top-table">
                    <h1 className="title-table">Registro de Producción</h1>
                </div>

                <form onSubmit={handleSubmit(onSubmit)}>

                    {/* SECCIÓN DE FILTROS / SELECCIÓN GLOBAL */}
                    <div className="filter-section">
                        <div className="filter-row-2" style={{ width: '100%' }}>
                            <div className="filter-group">
                                <label>Lote de Origen</label>
                                <select {...register("loteOrigen", { required: "Seleccione un lote" })}>
                                    <option value="">-- Seleccione Lote --</option>
                                    {lotes.map(l => (
                                        <option key={l.id} value={l.id}>
                                            {l.codigo} - {l.proveedor?.nombre} ({l.materiaPrima?.nombre})
                                        </option>
                                    ))}
                                </select>
                                {errors.loteOrigen && <span className="error-message visible">{errors.loteOrigen.message}</span>}
                            </div>

                            <div className="filter-group">
                                <label>Destino (Ubicación por defecto)</label>
                                <select {...register("ubicacionGlobal", { required: "Seleccione ubicación" })}>
                                    <option value="">-- Seleccione Destino --</option>
                                    {ubicaciones.map(u => (
                                        <option key={u.id} value={u.id}>{u.nombre} ({u.tipo})</option>
                                    ))}
                                </select>
                                {errors.ubicacionGlobal && <span className="error-message visible">{errors.ubicacionGlobal.message}</span>}
                            </div>
                        </div>
                    </div>

                    {/* TABLA DE PRODUCTOS */}
                    <div className="table-container-native">
                        <table className="samar-table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th>Calibre</th>
                                    <th>Peso (Kg)</th>
                                    <th>Ubicación (Opcional)</th>
                                </tr>
                            </thead>
                            <tbody>
                                {productos.map(prod => {
                                    const calibres = prod.calibres ? (Array.isArray(prod.calibres) ? prod.calibres : prod.calibres.split(',')) : [];

                                    return (
                                        <tr key={prod.id}>
                                            <td style={{ textAlign: 'left', fontWeight: 'bold' }}>{prod.nombre}</td>

                                            <td>
                                                {calibres.length > 0 ? (
                                                    <select {...register(`calibre_${prod.id}`)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                                        <option value="">--</option>
                                                        {calibres.map((c, i) => <option key={i} value={c}>{c}</option>)}
                                                    </select>
                                                ) : (
                                                    <span style={{ color: '#ccc' }}>N/A</span>
                                                )}
                                            </td>

                                            <td>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    placeholder="0.00"
                                                    style={{ width: '100px', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                                                    {...register(`weight_${prod.id}`)}
                                                />
                                            </td>

                                            <td>
                                                <select {...register(`ubicacion_${prod.id}`)} style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}>
                                                    <option value="">(Usar Global)</option>
                                                    {ubicaciones.map(u => (
                                                        <option key={u.id} value={u.id}>{u.nombre}</option>
                                                    ))}
                                                </select>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ marginTop: '20px', textAlign: 'right' }}>
                        <button type="submit" className="btn-new" style={{ fontSize: '1rem', padding: '12px 24px' }}>
                            Guardar Producción
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default Produccion;