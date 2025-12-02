import useProduccion from '../hooks/produccion/useProduccion';
import { useForm } from 'react-hook-form';
import { showSuccessAlert } from '../helpers/sweetAlert';
import '../styles/recepcion.css'; 

const Produccion = () => {
    const {
        lotes,
        productos,
        ubicaciones,
        calibresDisponibles,
        handleProductChange,
        handleCreateProduccion
    } = useProduccion();

    const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm();

    const onSubmit = async (data) => {
        const success = await handleCreateProduccion(data);
        if (success) reset();
    };

    return (
        <div className="recepcion-container"> {/* Reutilizamos contenedor */}
            <h1>Registro de Producción</h1>
            
            <div className="form-section" style={{ maxWidth: '600px', margin: '0 auto' }}>
                <form className="form" onSubmit={handleSubmit(onSubmit)}>
                    
                    {/* 1. LOTE DE ORIGEN */}
                    <div className="container_inputs">
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

                    {/* 2. PRODUCTO (Con lógica especial onChange) */}
                    <div className="container_inputs">
                        <label>Producto</label>
                        <select 
                            {...register("producto", { required: "Seleccione un producto" })}
                            onChange={(e) => handleProductChange(e, setValue)}
                        >
                            <option value="">-- Seleccione Producto --</option>
                            {productos.map(p => (
                                <option key={p.id} value={p.id}>{p.nombre}</option>
                            ))}
                        </select>
                        {errors.producto && <span className="error-message visible">{errors.producto.message}</span>}
                    </div>

                    {/* 3. CALIBRE (Condicional: Solo si hay calibres disponibles) */}
                    {calibresDisponibles.length > 0 && (
                        <div className="container_inputs">
                            <label>Calibre</label>
                            <select {...register("calibre", { required: "Seleccione calibre" })}>
                                <option value="">-- Seleccione Calibre --</option>
                                {calibresDisponibles.map((c, i) => (
                                    <option key={i} value={c}>{c}</option>
                                ))}
                            </select>
                            {errors.calibre && <span className="error-message visible">{errors.calibre.message}</span>}
                        </div>
                    )}

                    {/* 4. UBICACIÓN */}
                    <div className="container_inputs">
                        <label>Destino (Ubicación)</label>
                        <select {...register("ubicacion", { required: "Seleccione ubicación" })}>
                            <option value="">-- Seleccione Destino --</option>
                            {ubicaciones.map(u => (
                                <option key={u.id} value={u.id}>{u.nombre} ({u.tipo})</option>
                            ))}
                        </select>
                        {errors.ubicacion && <span className="error-message visible">{errors.ubicacion.message}</span>}
                    </div>

                    {/* 5. PESO NETO */}
                    <div className="container_inputs">
                        <label>Peso Neto (kg)</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            placeholder="Ej: 20.5"
                            {...register("peso", { required: "Ingrese el peso", min: 0.1 })} 
                        />
                        {errors.peso && <span className="error-message visible">{errors.peso.message}</span>}
                    </div>

                    <button type="submit">Guardar Producción</button>
                </form>
            </div>
        </div>
    );
};

export default Produccion;