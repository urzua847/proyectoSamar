import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEntidadById } from '../services/entidad.service';
import { getRecepcionesByEntidad } from '../services/recepcion.service';
import { generateEntityPDF, generateLotPDF } from '../services/pdf.service';
import Table from '../components/Table';
import axios from '../services/root.service.js';
import { format as formatTempo } from "@formkit/tempo";
import '../styles/form.css';

const EntityDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [entidad, setEntidad] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15;

    useEffect(() => {
        const fetchData = async () => {
            if (id) {
                // Fetch Entidad Profile
                const entidadRes = await getEntidadById(id);
                let currentEntidad = null;
                if (entidadRes && entidadRes.data) {
                    currentEntidad = entidadRes.data;
                    setEntidad(entidadRes.data);
                } else if (entidadRes) {
                    currentEntidad = entidadRes;
                    setEntidad(entidadRes);
                }

                if (currentEntidad) {
                    const tipo = String(currentEntidad.tipo).toLowerCase();
                    if (tipo === 'proveedor') {
                        // Fetch Recepciones
                        const entidadHistory = await getRecepcionesByEntidad(id);
                        setHistory(entidadHistory || []);
                    } else if (tipo === 'cliente') {
                        // Fetch Pedidos para este cliente
                        try {
                            const response = await axios.get(`/pedidos?cliente=${encodeURIComponent(currentEntidad.nombre)}&limit=1000`);
                            const responseData = response.data.data;
                            const rawData = responseData.data || responseData;
                            if (Array.isArray(rawData)) {
                                const formatted = rawData.map(v => ({
                                    id: v.id,
                                    fecha: formatTempo(v.fecha, "DD-MM-YYYY HH:mm"),
                                    guia: v.numero_guia || '-',
                                    estado: v.estado,
                                    totalItems: v.detalles?.length || 0,
                                    totalKilos: v.detalles?.reduce((acc, curr) => acc + Number(curr.kilos_totales), 0).toFixed(2),
                                    totalCajas: v.detalles?.reduce((acc, curr) => acc + Number(curr.cantidad_bultos), 0)
                                }));
                                setHistory(formatted);
                            }
                        } catch (error) {
                            console.error("Error fetching client history", error);
                            setHistory([]);
                        }
                    }
                }
            }
            setLoading(false);
        };
        fetchData();
    }, [id]);

    if (loading) return <div className="main-container">Cargando...</div>;
    if (!entidad) return <div className="main-container">Entidad no encontrada</div>;

    // Calculations
    const isProveedor = String(entidad.tipo).toLowerCase() === 'proveedor';

    // Calculations Proveedor
    const totalEntregas = history.length;
    const kilosTotalesRecibidos = history.reduce((acc, curr) => acc + Number(curr.peso_bruto_kg || 0), 0);

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

    // Calculations Cliente
    const kilosTotalesDespachados = history.reduce((acc, curr) => acc + Number(curr.totalKilos || 0), 0).toFixed(2);
    const cajasTotales = history.reduce((acc, curr) => acc + Number(curr.totalCajas || 0), 0);

    const columnsProveedor = [
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

    const columnsCliente = [
        { header: "ID Pedido", accessor: "id" },
        { header: "N° Guía", accessor: "guia" },
        { header: "Fecha", accessor: "fecha" },
        { header: "Total Kilos", accessor: "totalKilos" },
        { header: "Total Cajas", accessor: "totalCajas" },
        { header: "Estado", render: row => (
            <span style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: '#dbeafe', color: '#1e40af', fontSize: '0.85rem' }}>
                {row.estado}
            </span>
        )}
    ];

    const columns = isProveedor ? columnsProveedor : columnsCliente;

    // Pagination logic
    const totalPages = Math.ceil(history.length / itemsPerPage);
    const paginatedHistory = history.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="main-container" style={{ padding: '2rem', paddingTop: '6rem', backgroundColor: '#f8fafc', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', width: '100%', maxWidth: '1200px' }}>
                <h1 style={{ color: '#0f172a', margin: 0, fontSize: '1.75rem', fontWeight: '600', letterSpacing: '-0.02em' }}>
                    Ficha de {entidad.tipo}: <span style={{ color: '#3b82f6' }}>{entidad.nombre}</span>
                </h1>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                    <button
                        onClick={() => navigate(-1)}
                        style={{
                            padding: '0.6rem 1rem',
                            backgroundColor: 'white',
                            color: '#475569',
                            border: '1px solid #e2e8f0',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: '500',
                            fontSize: '0.9rem',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; e.currentTarget.style.color = '#0f172a'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; e.currentTarget.style.color = '#475569'; }}
                    >
                        &larr; Volver
                    </button>
                    <button
                        onClick={() => generateEntityPDF(entidad, history)}
                        style={{
                            padding: '0.6rem 1rem',
                            backgroundColor: '#2563eb',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontWeight: '500',
                            fontSize: '0.9rem',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#2563eb'; }}
                    >
                        📄 Generar PDF
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 35%) 1fr', gap: '1.5rem', marginBottom: '2rem', width: '100%', maxWidth: '1200px' }}>

                {/* Profile Card */}
                <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)', height: '100%' }}>
                    <h2 style={{ color: '#0f172a', fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem', marginTop: 0 }}>
                        Información de Contacto
                    </h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>RUT</span>
                            <span style={{ color: '#1e293b', fontSize: '0.95rem' }}>{entidad.rut}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Dirección</span>
                            <span style={{ color: '#1e293b', fontSize: '0.95rem' }}>{entidad.direccion}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Teléfono</span>
                            <span style={{ color: '#1e293b', fontSize: '0.95rem' }}>{entidad.telefono}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Email</span>
                            <span style={{ color: '#1e293b', fontSize: '0.95rem' }}>{entidad.email}</span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '600' }}>Giro</span>
                            <span style={{ color: '#1e293b', fontSize: '0.95rem' }}>{entidad.giro || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Global Stats */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', height: '50%' }}>
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: '500', marginBottom: '0.5rem' }}>
                                {isProveedor ? 'Entregas Totales' : 'Pedidos Totales'}
                            </span>
                            <span style={{ display: 'block', fontSize: '2rem', fontWeight: '600', color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                {history.length}
                            </span>
                        </div>
                        <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: '#64748b', fontWeight: '500', marginBottom: '0.5rem' }}>
                                {isProveedor ? 'Kilos Recibidos' : 'Kilos Despachados'}
                            </span>
                            <span style={{ display: 'block', fontSize: '2rem', fontWeight: '600', color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                {isProveedor ? kilosTotalesRecibidos : kilosTotalesDespachados} <span style={{ fontSize: '1rem', color: '#94a3b8', fontWeight: 'normal' }}>kg</span>
                            </span>
                        </div>
                    </div>
                    
                    {isProveedor && (
                        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '50%' }}>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: '#166534', fontWeight: '500', marginBottom: '0.5rem' }}>
                                Rendimiento Promedio
                            </span>
                            <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: '600', color: '#15803d', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                {averageYield}%
                            </span>
                        </div>
                    )}
                    
                    {!isProveedor && (
                        <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', padding: '24px', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '50%' }}>
                            <span style={{ display: 'block', fontSize: '0.85rem', color: '#166534', fontWeight: '500', marginBottom: '0.5rem' }}>
                                Cajas Totales
                            </span>
                            <span style={{ display: 'block', fontSize: '2.5rem', fontWeight: '600', color: '#15803d', letterSpacing: '-0.02em', lineHeight: 1 }}>
                                {cajasTotales}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* History Table */}
            <div style={{ width: '100%', maxWidth: '1200px', backgroundColor: 'white', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgba(0,0,0,0.02)' }}>
                <h2 style={{ color: '#0f172a', fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', marginTop: 0 }}>
                    {isProveedor ? 'Historial de Entregas' : 'Historial de Pedidos'}
                </h2>
                {isProveedor && (
                    <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ color: '#3b82f6' }}>💡</span> Haz doble click sobre un lote para generar su reporte individual en PDF.
                    </p>
                )}
                
                {/* A Wrapper specifically for the table to reset any aggressive default padding from Table component if needed */}
                <div style={{ overflowX: 'auto', margin: '0 -10px' }}>
                    <div style={{ padding: '0 10px' }}>
                        <Table
                            columns={columns}
                            data={paginatedHistory}
                            onRowClick={(row) => isProveedor ? navigate(`/recepcion/${row.id}`) : null}
                            onRowDoubleClick={(row) => isProveedor ? generateLotPDF(row) : null}
                            pagination={{
                                currentPage,
                                totalPages,
                                onPageChange: (page) => setCurrentPage(page)
                            }}
                        />
                    </div>
                </div>
            </div>

        </div>
    );
};

export default EntityDetail;
