import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import useRecepcion from '../hooks/recepcion/useRecepcion';
import '../styles/popup.css';
import '../styles/recepcion.css';

export default function PopupRecepcion({ show, setShow, action, dataToEdit }) {
    const {
        proveedores, materiasPrimas,
        pesadas, setPesadas,
        pesoActual, setPesoActual,
        agregarPesada, eliminarUltimaPesada, pesoTotal
    } = useRecepcion();

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

    // EFECTO: Cargar datos si es edición
    // Corrección: Agregamos todas las dependencias necesarias al array
    useEffect(() => {
        if (dataToEdit) {
            setValue('proveedor', dataToEdit.proveedor?.id);
            setValue('materiaPrima', dataToEdit.materiaPrima?.id);
            setValue('numero_bandejas', dataToEdit.numero_bandejas);
            
            // Cargar pesadas históricas
            if (dataToEdit.detalle_pesadas) {
                const pesadasArray = Array.isArray(dataToEdit.detalle_pesadas) 
                    ? dataToEdit.detalle_pesadas.map(Number) 
                    : dataToEdit.detalle_pesadas.split(',').map(Number);
                setPesadas(pesadasArray);
            }
        } else {
            reset();
            setPesadas([]);
        }
    }, [dataToEdit, show, reset, setValue, setPesadas]); 

    const onSubmit = async (formData) => {
        const finalData = {
            ...formData,
            peso_bruto_kg: pesoTotal,
            pesadas: pesadas
        };
        action(finalData);
    };

    if (!show) return null;

    return (
        <div className="bg">
            <div className="popup" style={{ width: '900px', maxWidth: '95%' }}>
                <button className='close' onClick={() => setShow(false)}>X</button>
                <h2>{dataToEdit ? `Editar Lote ${dataToEdit.codigo}` : "Nueva Recepción"}</h2>
                
                <div className="content-wrapper" style={{ gap: '20px', alignItems: 'flex-start' }}>
                    {/* IZQUIERDA: FORMULARIO */}
                    <div className="form-section" style={{ flex: 1 }}>
                        <form className="form" onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', padding: 0, boxShadow: 'none', background: 'transparent' }}>
                            
                            <div className="container_inputs">
                                <label>Proveedor</label>
                                <select {...register("proveedor", { required: "Requerido" })}>
                                    <option value="">Seleccionar...</option>
                                    {proveedores.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombre}</option>
                                    ))}
                                </select>
                                {/* Corrección: Usamos 'errors' para mostrar mensajes */}
                                {errors.proveedor && <span className="error-message visible">{errors.proveedor.message}</span>}
                            </div>

                            <div className="container_inputs">
                                <label>Materia Prima</label>
                                <select {...register("materiaPrima", { required: "Requerido" })}>
                                    <option value="">Seleccionar...</option>
                                    {materiasPrimas.map(m => (
                                        <option key={m.id} value={m.id}>{m.nombre}</option>
                                    ))}
                                </select>
                                {errors.materiaPrima && <span className="error-message visible">{errors.materiaPrima.message}</span>}
                            </div>

                            <div className="container_inputs">
                                <label>N° Bandejas</label>
                                <input type="number" {...register("numero_bandejas", { required: "Requerido" })} />
                                {errors.numero_bandejas && <span className="error-message visible">{errors.numero_bandejas.message}</span>}
                            </div>

                            <button type="submit" style={{ marginTop: '20px' }}>
                                {dataToEdit ? "Guardar Cambios" : "Registrar Lote"}
                            </button>
                        </form>
                    </div>
                    
                    {/* DERECHA: CALCULADORA */}
                     <div className="weight-section" style={{ flex: 1, padding: '15px', border: '1px solid #ddd' }}>
                        <h3 style={{ marginTop: 0, color: '#003366' }}>Pesaje</h3>
                        
                         <div className="weight-display" style={{ padding: '15px', marginBottom: '15px' }}>
                            <span className="weight-label">Total:</span>
                            <span className="weight-value" style={{ fontSize: '2rem' }}>{pesoTotal.toFixed(2)} kg</span>
                        </div>

                        <div className="weight-controls">
                             <input type="number" step="0.1" placeholder="kg" value={pesoActual} onChange={(e) => setPesoActual(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && agregarPesada()} style={{ marginBottom: 0 }} />
                             <button type="button" onClick={agregarPesada} className="add-btn" style={{ margin: 0 }}>+</button>
                        </div>

                        <div className="weight-history" style={{ maxHeight: '150px', overflowY: 'auto' }}>
                             <ul style={{ padding: 0, listStyle: 'none' }}>
                                {pesadas.map((p, i) => (
                                    <li key={i} style={{ borderBottom: '1px solid #eee', padding: '5px', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>Tanda {i + 1}</span>
                                        <strong>{p} kg</strong>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        {/* Corrección: Usamos 'eliminarUltimaPesada' aquí */}
                        {pesadas.length > 0 && (
                            <button type="button" onClick={eliminarUltimaPesada} className="undo-btn" style={{ width: '100%', marginTop: '10px' }}>Deshacer última</button>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
}