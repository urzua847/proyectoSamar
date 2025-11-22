import useRecepcion from '../hooks/recepcion/useRecepcion';
import Form from '../components/Form';
import '../styles/recepcion.css'; 

const Recepcion = () => {
    const {
        proveedores,
        materiasPrimas,
        pesadas,
        pesoActual,
        setPesoActual,
        agregarPesada,
        eliminarUltimaPesada,
        pesoTotal,
        handleCreateLote
    } = useRecepcion();

    const formFields = [
        {
            label: "Proveedor",
            name: "proveedor",
            fieldType: 'select',
            options: proveedores.map(p => ({ value: p.id, label: p.nombre })),
            required: true,
        },
        {
            label: "Materia Prima",
            name: "materiaPrima",
            fieldType: 'select',
            options: materiasPrimas.map(m => ({ value: m.id, label: m.nombre })),
            required: true,
        },
        {
            label: "Número de Bandejas",
            name: "numero_bandejas",
            fieldType: 'input',
            type: "number",
            required: true,
        }
    ];

    return (
        <div className="recepcion-container">
            <h1>Recepción de Materia Prima</h1>
            
            <div className="content-wrapper">
                {/* COLUMNA IZQUIERDA: DATOS GENERALES */}
                <div className="form-section">
                    <Form
                        title="Datos del Lote"
                        fields={formFields}
                        buttonText="Guardar Lote Completo"
                        onSubmit={handleCreateLote}
                    />
                </div>

                {/* COLUMNA DERECHA: CALCULADORA DE PESO */}
                <div className="weight-section">
                    <h2>Pesaje de Bandejas</h2>
                    <div className="weight-display">
                        <span className="weight-label">Peso Total Acumulado:</span>
                        <span className="weight-value">{pesoTotal.toFixed(2)} kg</span>
                    </div>

                    <div className="weight-controls">
                        <input
                            type="number"
                            placeholder="Peso tanda (kg)"
                            value={pesoActual}
                            onChange={(e) => setPesoActual(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && agregarPesada()}
                        />
                        <button type="button" onClick={agregarPesada} className="add-btn">
                            + Añadir
                        </button>
                    </div>

                    <div className="weight-history">
                        <h3>Historial de Pesadas:</h3>
                        <ul>
                            {pesadas.map((p, i) => (
                                <li key={i}>Tanda {i + 1}: <strong>{p} kg</strong></li>
                            ))}
                        </ul>
                        {pesadas.length > 0 && (
                            <button type="button" onClick={eliminarUltimaPesada} className="undo-btn">
                                Deshacer última
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Recepcion;