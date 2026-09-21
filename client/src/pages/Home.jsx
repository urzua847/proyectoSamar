import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../services/root.service.js';
import { format as formatTempo } from "@formkit/tempo";
import Table from '../components/Table';
import '../components/AuditDashboard.css';
import '../styles/users.css';

const Home = () => {
  const navigate = useNavigate();
  const user = JSON.parse(sessionStorage.getItem('usuario'));
  const [data, setData] = useState({
    ultimosLotes: [],
    stockCamaras: [],
    stockContenedores: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await axios.get('/dashboard');
      if (response.data.data) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  // --- CALCULATED KPIs ---
  const totalStockCamaras = useMemo(() =>
    data.stockCamaras.reduce((acc, curr) => acc + Number(curr.totalKilos || 0), 0)
    , [data.stockCamaras]);

  const totalStockContenedores = useMemo(() =>
    data.stockContenedores.reduce((acc, curr) => acc + Number(curr.totalKilos || 0), 0)
    , [data.stockContenedores]);

  const ultimoLote = data.ultimosLotes.length > 0 ? data.ultimosLotes[0] : null;

  // --- COLUMNS FOR TABLES ---
  const columnsLotes = [
    { header: "Fecha", accessor: "createdAt", render: (row) => formatTempo(row.createdAt, "DD/MM HH:mm") },
    { 
      header: "Lote", 
      accessor: "codigo", 
      render: (row) => (
        <span 
          onClick={() => navigate(`/recepcion/${row.id}`)}
          style={{ fontWeight: 'bold', color: '#1a6bbf', cursor: 'pointer', textDecoration: 'underline' }}
          title="Ver detalle del lote"
        >
          {row.codigo}
        </span>
      ) 
    },
    { header: "Materia Prima", accessor: "materiaPrima.nombre", render: (row) => row.materiaPrima?.nombre },
    { header: "Proveedor", accessor: "proveedor.nombre", render: (row) => row.proveedor?.nombre },
    { header: "Kilos", accessor: "peso_bruto_kg", render: (row) => <span style={{ fontWeight: 'bold' }}>{Number(row.peso_bruto_kg).toLocaleString('es-CL')} kg</span> }
  ];

  const columnsCamaras = [
    { header: "Producto", accessor: "productoNombre" },
    { header: "Calibre", accessor: "calibre" },
    { header: "Stock Total", accessor: "totalKilos", render: (row) => `${Number(row.totalKilos).toLocaleString('es-CL')} kg` }
  ];

  const columnsContenedores = [
    { header: "Ubicación", accessor: "ubicacionNombre", render: (row) => <span style={{ fontWeight: 'bold' }}>{row.ubicacionNombre}</span> },
    { header: "Producto", accessor: "productoNombre" },
    { header: "Calibre", accessor: "calibre" },
    { header: "Cajas", accessor: "totalCantidad" },
    { header: "Kilos", accessor: "totalKilos", render: (row) => <span style={{ color: '#10b981', fontWeight: 'bold' }}>{Number(row.totalKilos).toLocaleString('es-CL')} kg</span> }
  ];

  if (loading) return (
    <div className="main-container" style={{ display: 'flex', justifyContent: 'center', padding: '50px' }}>
      <div className="audit-dashboard-loading">Cargando Dashboard...</div>
    </div>
  );

  return (
    <div className="main-container">
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%' }}>

        <header style={{ marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="title-table" style={{ margin: 0 }}>Panel de Control</h1>
            <p style={{ color: '#64748b', margin: '5px 0 0 0' }}></p>
          </div>
          <button 
            onClick={() => navigate('/scanner')} 
            style={{ 
              backgroundColor: '#003366', 
              color: 'white', 
              padding: '10px 20px', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer', 
              fontWeight: 'bold', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Acceder al Escáner
          </button>
        </header>

        {/* --- KPI CARDS --- */}
        <div className="audit-stats" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>

          {/* 1. ÚLTIMO INGRESO */}
          <div className="stat-card">
            <div className="stat-card__content">
              <h3>Último Ingreso</h3>
              <p className="stat-card__value" style={{ fontSize: '1.2rem' }}>
                {ultimoLote ? (
                  <>
                    <span 
                      onClick={() => navigate(`/recepcion/${ultimoLote.id}`)}
                      style={{ cursor: 'pointer', color: '#1a6bbf', textDecoration: 'underline' }}
                      title="Ver detalle del lote"
                    >
                      {ultimoLote.codigo}
                    </span>
                    <br />
                    <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: 'var(--text-secondary, #64748b)' }}>
                      {Number(ultimoLote.peso_bruto_kg).toLocaleString('es-CL')} kg ({ultimoLote.materiaPrima?.nombre})
                    </span>
                  </>
                ) : 'Sin datos'}
              </p>
            </div>
            <div className="stat-card__icon" style={{ color: 'var(--success-color, #10b981)' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* 2. STOCK EN CÁMARAS */}
          <div className="stat-card">
            <div className="stat-card__content">
              <h3>Stock en Cámaras</h3>
              <p className="stat-card__value">{totalStockCamaras.toLocaleString('es-CL')} <span style={{ fontSize: '1rem', color: 'var(--text-secondary, #64748b)' }}>kg</span></p>
            </div>
            <div className="stat-card__icon" style={{ color: 'var(--info-color, #3b82f6)' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
          </div>

          {/* 3. STOCK EN CONTENEDORES */}
          <div className="stat-card">
            <div className="stat-card__content">
              <h3>Stock en Contenedores</h3>
              <p className="stat-card__value">{totalStockContenedores.toLocaleString('es-CL')} <span style={{ fontSize: '1rem', color: 'var(--text-secondary, #64748b)' }}>kg</span></p>
            </div>
            <div className="stat-card__icon" style={{ color: 'var(--warning-color, #f59e0b)' }}>
              <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
          </div>
        </div>

        {/* --- GRID DE TABLAS --- */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))',
          gap: '24px',
          width: '100%'
        }}>

          {/* TABLA 1: ÚLTIMOS LOTES */}
          <div className="table-container-box" style={{ marginTop: 0 }}>
            <h3 style={{ color: '#003366', marginTop: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Últimos Lotes Recepcionados
            </h3>
            <Table columns={columnsLotes} data={data.ultimosLotes} />
          </div>

          {/* TABLA 2: STOCK CÁMARAS */}
          <div className="table-container-box" style={{ marginTop: 0 }}>
            <h3 style={{ color: '#003366', marginTop: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Resumen Cámaras
            </h3>
            <Table columns={columnsCamaras} data={data.stockCamaras} />
          </div>

          {/* TABLA 3: CONTENEDORES (Full Width si es necesario) */}
          <div className="table-container-box" style={{ marginTop: 0, gridColumn: '1 / -1' }}>
            <h3 style={{ color: '#003366', marginTop: 0, marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              Carga en Contenedores
            </h3>
            <Table columns={columnsContenedores} data={data.stockContenedores} />
          </div>

        </div>
      </div>
    </div>
  );
};

export default Home;