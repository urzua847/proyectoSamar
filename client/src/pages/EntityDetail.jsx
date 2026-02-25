import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEntidadById } from '../services/entidad.service';
import { getRecepcionesByEntidad } from '../services/recepcion.service';
import { generateEntityPDF, generateLotPDF } from '../services/pdf.service';
import Table from '../components/Table';
import '../styles/form.css';

const EntityDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [entidad, setEntidad] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            if (id) {
                // Fetch Entidad Profile
                const entidadRes = await getEntidadById(id);
                if (entidadRes && entidadRes.data) {
                    setEntidad(entidadRes.data);
                } else if (entidadRes) {
                    setEntidad(entidadRes);
                }

                // Fetch History (All Recepciones and filter by provider/client)
                const entidadHistory = await getRecepcionesByEntidad(id);
                setHistory(entidadHistory);
            }
            setLoading(false);
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="main-container">Cargando...</div>;
    if (!entidad) return <div className="main-container">Entidad no encontrada</div>;

    // Calculations
    const totalEntregas = history.length;
    const kilosTotalesRecibidos = history.reduce((acc, curr) => acc + Number(curr.peso_bruto_kg || 0), 0);

    // Average Yield Calculation
    let validYieldsCount = 0;
    const userGlobalYield = history.reduce((acc, curr) => {
        if (curr.peso_total > 0 && curr.peso_bruto_kg > 0) {
            const y = (curr.peso_total / curr.peso_bruto_kg) * 100;
            validYieldsCount++;
            return acc + y;
        }
        return acc;
    }, 0);
    const averageYield = validYieldsCount > 0 ? (userGlobalYield / validYieldsCount).toFixed(2) : 0;


    const columns = [
        { header: "Lote", accessor: "codigo" },
        { header: "Fecha", accessor: "fechaFormateada" },
        { header: "Especie", accessor: "materiaPrimaNombre" },
        { header: "Peso Entrada", accessor: "peso_bruto_kg" },
        { header: "Peso Salida", accessor: "peso_total" },
        {
            header: "Rendimiento (%)",
            render: (row) => {
                const r = row.peso_total > 0 ? ((row.peso_total / row.peso_bruto_kg) * 100).toFixed(2) : '0.00';
                return `${r}%`;
            }
        },
        { header: "Estado", accessor: "estadoTexto" }
    ];

    return (
        <div className="main-container" style={{ padding: '2rem', paddingTop: '6rem', backgroundColor: '#f4f6f8', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', width: '100%', maxWidth: '1200px' }}>
                <h1 style={{ color: '#003366', margin: 0 }}>Ficha de {entidad.tipo}: {entidad.nombre}</h1>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: '0.6rem 1.2rem',
                            backgroundColor: '#6c757d',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.4rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: '600'
                        }}
                    >
                        &larr; Volver
                    </button>
                    <button
                        onClick={() => generateEntityPDF(entidad, history)}
                        style={{
                            padding: '0.6rem 1.2rem',
                            backgroundColor: '#003366',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.4rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: '600'
                        }}
                    >
                        📄 Generar PDF
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 40%) 1fr', gap: '1.5rem', marginBottom: '2rem', width: '100%', maxWidth: '1200px' }}>

                {/* Profile Card */}
                <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', height: '100%' }}>
                    <h2 style={{ color: '#003366', borderBottom: '2px solid #003366', paddingBottom: '0.5rem', marginTop: 0 }}>Información de Contacto</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1rem' }}>
                        <div><strong>RUT:</strong> {entidad.rut}</div>
                        <div><strong>Dirección:</strong> {entidad.direccion}</div>
                        <div><strong>Teléfono:</strong> {entidad.telefono}</div>
                        <div><strong>Email:</strong> {entidad.email}</div>
                        <div><strong>Giro:</strong> {entidad.giro || 'N/A'}</div>
                    </div>
                </div>

                {/* Global Stats - Now horizontal Cards next to Profile */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', height: 'fit-content' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div style={{ backgroundColor: '#e3f2fd', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.9rem', color: '#003366', marginBottom: '0.5rem' }}>Entregas Totales</span>
                            <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: 'bold', color: '#003366', lineHeight: 1 }}>{totalEntregas}</span>
                        </div>
                        <div style={{ backgroundColor: '#e3f2fd', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.9rem', color: '#003366', marginBottom: '0.5rem' }}>Kilos Totales</span>
                            <span style={{ display: 'block', fontSize: '1.8rem', fontWeight: 'bold', color: '#003366', lineHeight: 1 }}>{kilosTotalesRecibidos}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ backgroundColor: '#d4edda', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', justifyContent: 'center', width: '100%' }}>
                            <span style={{ display: 'block', fontSize: '0.9rem', color: '#155724', marginBottom: '0.5rem' }}>Rendimiento Promedio</span>
                            <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: 'bold', color: '#155724', lineHeight: 1 }}>{averageYield}%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                <h2 style={{ color: '#003366', marginBottom: '0.5rem' }}>Historial de Entregas</h2>
                <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '1rem' }}>
                    💡 Haz doble click sobre un lote para generar su reporte individual en PDF.
                </p>
                <Table
                    columns={columns}
                    data={history}
                    onRowClick={(row) => navigate(`/recepcion/${row.id}`)}
                    onRowDoubleClick={(row) => generateLotPDF(row)}
                />
            </div>

        </div>
    );
};

export default EntityDetail;
