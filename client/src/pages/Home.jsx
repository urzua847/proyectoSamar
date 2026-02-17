import { useState, useEffect, useMemo } from 'react';
import axios from '../services/root.service.js';
import { format as formatTempo } from "@formkit/tempo";
import Table from '../components/Table';
import '../components/AuditDashboard.css';
import '../styles/users.css';

const Home = () => {
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
    { header: "Lote", accessor: "codigo", render: (row) => <span style={{ fontWeight: 'bold', color: '#003366' }}>{row.codigo}</span> },
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
                    {ultimoLote.codigo} <br />
                    <span style={{ fontSize: '0.9rem', fontWeight: 'normal', color: '#64748b' }}>
                      {Number(ultimoLote.peso_bruto_kg).toLocaleString('es-CL')} kg ({ultimoLote.materiaPrima?.nombre})
                    </span>
                  </>
                ) : 'Sin datos'}
              </p>
            </div>
          </div>

          {/* 2. STOCK EN CÁMARAS */}
          <div className="stat-card">
            <div className="stat-card__content">
              <h3>Stock en Cámaras</h3>
              <p className="stat-card__value">{totalStockCamaras.toLocaleString('es-CL')} <span style={{ fontSize: '1rem', color: '#64748b' }}>kg</span></p>
            </div>
          </div>

          {/* 3. STOCK EN CONTENEDORES */}
          <div className="stat-card">
            <div className="stat-card__content">
              <h3>Stock en Contenedores</h3>
              <p className="stat-card__value">{totalStockContenedores.toLocaleString('es-CL')} <span style={{ fontSize: '1rem', color: '#64748b' }}>kg</span></p>
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