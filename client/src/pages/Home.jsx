import { useState, useEffect } from 'react';
import axios from '../services/root.service.js';
import { format as formatTempo } from "@formkit/tempo";

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

  const tableHeaderStyle = { backgroundColor: '#003366', color: 'white', padding: '10px', textAlign: 'left' };
  const cellStyle = { padding: '8px', borderBottom: '1px solid #ddd' };
  const cardStyle = { backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden', padding: '15px' };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Cargando Dashboard...</div>;

  return (
    <div className="main-container" style={{ marginTop: '60px', padding: '20px' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1 style={{ color: '#003366' }}>Situación Actual de Planta</h1>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        <div style={cardStyle}>
          <h3 style={{ borderBottom: '2px solid #28a745', paddingBottom: '10px', color: '#28a745', marginTop: 0 }}>
            Últimos Lotes Recepcionados
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Fecha</th>
                  <th style={tableHeaderStyle}>Lote</th>
                  <th style={tableHeaderStyle}>Materia Prima</th>
                  <th style={tableHeaderStyle}>Kilos</th>
                </tr>
              </thead>
              <tbody>
                {data.ultimosLotes.length === 0 ? (
                  <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>Sin movimientos recientes.</td></tr>
                ) : (
                  data.ultimosLotes.map(lote => (
                    <tr key={lote.id}>
                      <td style={cellStyle}>{formatTempo(lote.createdAt, "DD/MM HH:mm")}</td>
                      <td style={{ ...cellStyle, fontWeight: 'bold', color: '#003366' }}>{lote.codigo}</td>
                      <td style={cellStyle}>{lote.materiaPrima?.nombre}</td>
                      <td style={{ ...cellStyle, textAlign: 'right' }}>{lote.peso_bruto_kg} kg</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={cardStyle}>
          <h3 style={{ borderBottom: '2px solid #17a2b8', paddingBottom: '10px', color: '#17a2b8', marginTop: 0 }}>
            Stock en Cámaras
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Producto</th>
                  <th style={tableHeaderStyle}>Calibre</th>
                  <th style={tableHeaderStyle}>Total Stock</th>
                </tr>
              </thead>
              <tbody>
                {data.stockCamaras.length === 0 ? (
                  <tr><td colSpan="3" style={{ padding: '20px', textAlign: 'center' }}>Cámaras vacías.</td></tr>
                ) : (
                  data.stockCamaras.map((item, idx) => (
                    <tr key={idx}>
                      <td style={cellStyle}>{item.productoNombre}</td>
                      <td style={cellStyle}>{item.calibre || '-'}</td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold' }}>{Number(item.totalKilos).toFixed(2)} Kg</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ ...cardStyle, gridColumn: '1 / -1' }}>
          <h3 style={{ borderBottom: '2px solid #ffc107', paddingBottom: '10px', color: '#d39e00', marginTop: 0 }}>
            Contenedores
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr>
                  <th style={tableHeaderStyle}>Contenedor / Ubicación</th>
                  <th style={tableHeaderStyle}>Producto</th>
                  <th style={tableHeaderStyle}>Calibre</th>
                  <th style={tableHeaderStyle}>Cajas</th>
                  <th style={tableHeaderStyle}>Kilos Totales</th>
                </tr>
              </thead>
              <tbody>
                {data.stockContenedores.length === 0 ? (
                  <tr><td colSpan="5" style={{ padding: '20px', textAlign: 'center' }}>No hay carga lista para despacho.</td></tr>
                ) : (
                  data.stockContenedores.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ ...cellStyle, fontWeight: 'bold' }}>{item.ubicacionNombre}</td>
                      <td style={cellStyle}>{item.productoNombre}</td>
                      <td style={cellStyle}>{item.calibre || '-'}</td>
                      <td style={{ ...cellStyle, textAlign: 'center' }}>{item.totalCantidad}</td>
                      <td style={{ ...cellStyle, textAlign: 'right', fontWeight: 'bold', color: '#28a745' }}>{Number(item.totalKilos).toFixed(2)} Kg</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;