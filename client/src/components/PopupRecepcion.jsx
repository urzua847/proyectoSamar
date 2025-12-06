import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import useRecepcion from '../hooks/recepcion/useRecepcion';
import '../styles/popup.css';
import '../styles/recepcion.css';

export default function PopupRecepcion({ show, setShow, action, dataToEdit }) {
    const {
        proveedores, materiasPrimas,
        pesadas, setPesadas,
        inputPeso, setInputPeso,
        inputBandejas, setInputBandejas,
        agregarTanda, eliminarUltimaTanda,
        pesoTotal, bandejasTotal
    } = useRecepcion();

    const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm();

    // Referencias para el foco (Enter para navegar)
    const bandejasRef = useRef(null);
    const pesoRef = useRef(null);

    // Cargar datos si es edición
    useEffect(() => {
        if (dataToEdit) {
            setValue('proveedor', dataToEdit.proveedor?.id);
            setValue('materiaPrima', dataToEdit.materiaPrima?.id);
            
            if (dataToEdit.detalle_pesadas) {
                const historial = Array.isArray(dataToEdit.detalle_pesadas) 
                    ? dataToEdit.detalle_pesadas 
                    : []; 
                setPesadas(historial);
            }
        } else {
            reset();
            setPesadas([]);
        }
    }, [dataToEdit, show, reset, setValue, setPesadas]);

    // Sincronizar totales calculados con el formulario (ocultos o readOnly)
    useEffect(() => {
        setValue('numero_bandejas', bandejasTotal);
        setValue('peso_bruto_kg', pesoTotal.toFixed(2));
    }, [bandejasTotal, pesoTotal, setValue]);

    // Manejo de Enter para agilidad
    const handleKeyDownBandejas = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputBandejas && inputBandejas > 0) pesoRef.current.focus();
        }
    };

    const handleKeyDownPeso = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputPeso && inputPeso > 0) {
                agregarTanda();
                setTimeout(() => bandejasRef.current.focus(), 10);
            }
        }
    };

    const onSubmit = async (formData) => {
        const finalData = {
            ...formData,
            peso_bruto_kg: Number(pesoTotal.toFixed(2)),
            numero_bandejas: Number(bandejasTotal),
            pesadas: pesadas
        };
        action(finalData);
    };

    if (!show) return null;

    return (
        <div className="bg">
            <div className="popup" style={{ width: '950px', maxWidth: '98%' }}>
                <button className='close' onClick={() => setShow(false)}>X</button>
                <h2 style={{ color: '#003366', marginBottom: '20px' }}>
                    {dataToEdit ? `Editar Lote ${dataToEdit.codigo}` : "Nueva Recepción"}
                </h2>
                
                <div className="content-wrapper" style={{ gap: '30px', alignItems: 'flex-start' }}>
                    
                    {/* --- IZQUIERDA: DATOS DEL LOTE --- */}
                    <div className="form-section" style={{ flex: 1 }}>
                        <form className="form" onSubmit={handleSubmit(onSubmit)} style={{ width: '100%', padding: 0, boxShadow: 'none', background: 'transparent' }}>
                            
                            <div className="container_inputs">
                                <label>Proveedor</label>
                                <select {...register("proveedor", { required: "Requerido" })}>
                                    <option value="">Seleccionar...</option>
                                    {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                                </select>
                                {errors.proveedor && <span className="error-message visible">{errors.proveedor.message}</span>}
                            </div>

                            <div className="container_inputs">
                                <label>Materia Prima</label>
                                <select {...register("materiaPrima", { required: "Requerido" })}>
                                    <option value="">Seleccionar...</option>
                                    {materiasPrimas.map(m => <option key={m.id} value={m.id}>{m.nombre}</option>)}
                                </select>
                                {errors.materiaPrima && <span className="error-message visible">{errors.materiaPrima.message}</span>}
                            </div>

                            {/* Totales Bloqueados (Visuales) */}
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <div className="container_inputs" style={{ flex: 1 }}>
                                    <label>Total Bandejas</label>
                                    <input 
                                        type="text" 
                                        value={bandejasTotal} 
                                        readOnly 
                                        style={{ backgroundColor: '#e9ecef', textAlign: 'center', fontWeight: 'bold' }} 
                                    />
                                </div>
                                <div className="container_inputs" style={{ flex: 1 }}>
                                    <label>Total Kilos</label>
                                    <input 
                                        type="text" 
                                        value={pesoTotal.toFixed(2)} 
                                        readOnly 
                                        style={{ backgroundColor: '#e9ecef', textAlign: 'center', fontWeight: 'bold' }} 
                                    />
                                </div>
                            </div>

                            <button type="submit" style={{ marginTop: '20px' }} disabled={pesadas.length === 0}>
                                {dataToEdit ? "Guardar Cambios" : "Registrar Lote"}
                            </button>
                        </form>
                    </div>
                    
                    {/* --- DERECHA: REGISTRO DE TANDAS (MEJORADO) --- */}
                     <div className="weight-section" style={{ flex: 1.2, padding: '20px', border: '1px solid #ddd', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ marginTop: 0, color: '#003366', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
                            Registro de Tandas
                        </h3>
                        
                        {/* Fila de Inputs */}
                        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
                             <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#555' }}>Bandejas</label>
                                <input 
                                    ref={bandejasRef}
                                    type="number" 
                                    placeholder="#" 
                                    value={inputBandejas} 
                                    onChange={(e) => setInputBandejas(e.target.value)} 
                                    onKeyDown={handleKeyDownBandejas}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} 
                                />
                             </div>
                             <div style={{ flex: 1 }}>
                                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#555' }}>Kilos</label>
                                <input 
                                    ref={pesoRef}
                                    type="number" 
                                    step="0.1" 
                                    placeholder="kg" 
                                    value={inputPeso} 
                                    onChange={(e) => setInputPeso(e.target.value)} 
                                    onKeyDown={handleKeyDownPeso}
                                    style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px' }} 
                                />
                             </div>
                        </div>

                        {/* Botón de Agregar (Ahora es ancho completo y más claro) */}
                        <button 
                            type="button" 
                            onClick={agregarTanda} 
                            className="add-btn" 
                            style={{ width: '100%', marginBottom: '15px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '5px' }}
                        >
                            <span style={{ fontSize: '1.2rem', lineHeight: '1' }}>+</span> Agregar Tanda
                        </button>

                        {/* Tabla de Historial */}
                        <div className="weight-history" style={{ flex: 1, maxHeight: '200px', overflowY: 'auto', border: '1px solid #eee', borderRadius: '5px' }}>
                             <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                 <thead style={{ background: '#f8f9fa', position: 'sticky', top: 0 }}>
                                     <tr>
                                         <th style={{ padding: '10px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>#</th>
                                         <th style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #ddd' }}>Bandejas</th>
                                         <th style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Peso</th>
                                     </tr>
                                 </thead>
                                 <tbody>
                                    {pesadas.length === 0 ? (
                                        <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center', color: '#999' }}>Ingresa datos para comenzar</td></tr>
                                    ) : (
                                        pesadas.map((p, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #eee' }}>
                                                <td style={{ padding: '8px 10px' }}>{i + 1}</td>
                                                <td style={{ padding: '8px 10px', textAlign: 'center' }}>{p.bandejas}</td>
                                                <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 'bold' }}>{p.peso} kg</td>
                                            </tr>
                                        ))
                                    )}
                                 </tbody>
                             </table>
                        </div>
                        
                        {pesadas.length > 0 && (
                            <button type="button" onClick={eliminarUltimaTanda} className="undo-btn" style={{ width: '100%', marginTop: '10px' }}>
                                Borrar última fila
                            </button>
                        )}
                     </div>
                </div>
            </div>
        </div>
    );
}