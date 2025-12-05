import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import useRecepcion from '../hooks/recepcion/useRecepcion';
import '../styles/popup.css';
import '../styles/recepcion.css';

export default function PopupRecepcion({ show, setShow, action, dataToEdit }) {
    const {
        proveedores, materiasPrimas,
        pesadas, setPesadas,
        pesoActual, setPesoActual,
        cajasActual, setCajasActual,
        agregarPesada, eliminarUltimaPesada,
        pesoTotal, totalBandejas
    } = useRecepcion();

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();
    const cajasInputRef = useRef(null);

    // Wrapper para agregar pesada y devolver el foco
    const handleAgregarPesada = () => {
        const success = agregarPesada();
        if (success !== false) { // Asumiendo que agregarPesada devuelve algo o simplemente no falla
            // Pequeño timeout para asegurar que el renderizado ocurra (opcional pero seguro)
            setTimeout(() => {
                cajasInputRef.current?.focus();
            }, 0);
        }
    };

    useEffect(() => {
        if (dataToEdit) {
            setValue('proveedor', dataToEdit.proveedor?.id);
            setValue('materiaPrima', dataToEdit.materiaPrima?.id);

            if (dataToEdit.detalle_pesadas) {
                // Handle both array (from DB) and string (legacy/csv) if needed
                let pesadasArray = [];
                if (Array.isArray(dataToEdit.detalle_pesadas)) {
                    pesadasArray = dataToEdit.detalle_pesadas;
                } else if (typeof dataToEdit.detalle_pesadas === 'string') {
                    // Fallback for old string format "10,20,30" -> convert to dummy objects
                    // This is temporary until all data is migrated
                    pesadasArray = dataToEdit.detalle_pesadas.split(',').map(p => ({ cajas: 0, kilos: Number(p) }));
                }
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
            numero_bandejas: totalBandejas,
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

                            {/* Total Bandejas (Read Only) */}
                            <div className="container_inputs">
                                <label>Total Bandejas</label>
                                <input type="number" value={totalBandejas} readOnly disabled style={{ backgroundColor: '#f0f0f0' }} />
                            </div>

                            {/* Total Peso (Read Only) */}
                            <div className="container_inputs">
                                <label>Total Kilos</label>
                                <input type="number" value={pesoTotal.toFixed(2)} readOnly disabled style={{ backgroundColor: '#f0f0f0' }} />
                            </div>

                            <button type="submit" style={{ marginTop: '20px' }}>
                                {dataToEdit ? "Guardar Cambios" : "Registrar Lote"}
                            </button>
                        </form>
                    </div>

                    {/* DERECHA: REGISTRO DE TANDAS */}
                    <div className="weight-section" style={{ flex: 1, padding: '15px', border: '1px solid #ddd' }}>
                        <h3 style={{ marginTop: 0, color: '#003366' }}>Registro de Tandas</h3>

                        <div className="weight-controls" style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.8rem' }}>Cajas</label>
                                <input
                                    ref={cajasInputRef}
                                    type="number"
                                    placeholder="Cant."
                                    value={cajasActual}
                                    onChange={(e) => setCajasActual(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAgregarPesada()}
                                    style={{ marginBottom: 0, width: '100%' }}
                                />
                            </div>
                            <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.8rem' }}>Kilos</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="Kg"
                                    value={pesoActual}
                                    onChange={(e) => setPesoActual(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAgregarPesada()}
                                    style={{ marginBottom: 0, width: '100%' }}
                                />
                            </div>
                            <button type="button" onClick={handleAgregarPesada} className="add-btn" style={{ margin: 0, alignSelf: 'flex-end', height: '38px' }}>+</button>
                        </div>

                        <div className="weight-history" style={{ maxHeight: '250px', overflowY: 'auto', border: '1px solid #eee' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                <thead style={{ background: '#f9f9f9' }}>
                                    <tr>
                                        <th style={{ padding: '8px', textAlign: 'left' }}>#</th>
                                        <th style={{ padding: '8px', textAlign: 'center' }}>Cajas</th>
                                        <th style={{ padding: '8px', textAlign: 'right' }}>Kilos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pesadas.map((p, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                            <td style={{ padding: '8px' }}>{i + 1}</td>
                                            <td style={{ padding: '8px', textAlign: 'center' }}>{p.cajas}</td>
                                            <td style={{ padding: '8px', textAlign: 'right' }}>{p.kilos}</td>
                                        </tr>
                                    ))}
                                    {pesadas.length === 0 && (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#888' }}>
                                                Sin tandas registradas
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {pesadas.length > 0 && (
                            <button type="button" onClick={eliminarUltimaPesada} className="undo-btn" style={{ width: '100%', marginTop: '10px' }}>Deshacer última tanda</button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}