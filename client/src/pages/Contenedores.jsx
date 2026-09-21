import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from '../services/root.service.js';
import Table from '../components/Table';
import '../styles/users.css';
import '../styles/pedidos.css';
import { deleteManyProduccion } from '../services/envasado.service';
import { showSuccessAlert, showErrorAlert, showToastError } from '../helpers/sweetAlert';
import Swal from 'sweetalert2';

const Contenedores = () => {
    const { user } = useAuth();
    const [availableStock, setAvailableStock] = useState([]);
    
    // Filtros Stock
    const [filters, setFilters] = useState({
        lote: '',
        producto: '',
        ubicacion: ''
    });
    const [sortOrder, setSortOrder] = useState('desc');

    useEffect(() => {
        fetchContenedorStock();
    }, []);

    const fetchContenedorStock = async () => {
        try {
            const response = await axios.get('/envasado/stock/contenedores');
            const data = response.data.data || [];

            const formatted = data
                .filter(item => Number(item.totalKilos) > 0)
                .map((item, index) => ({
                    ...item,
                    id: `${item.loteCodigo}-${item.definicionProductoId}-${item.calibre || 'null'}-${index}`
                }));

            setAvailableStock(formatted);
        } catch (error) {
            console.error("Error fetching stock contenedores", error);
        }
    };

    const handleViewIds = (ids) => {
        if (!ids || ids.length === 0) {
            Swal.fire({ title: 'Sin IDs', text: 'No hay cajas físicas registradas.', icon: 'info' });
            return;
        }
        
        // Grid de QRs para escanear de la pantalla
        const gridHtml = ids.map(id => `
            <div style="display: flex; flex-direction: column; alignItems: center; margin: 10px; background: white; padding: 10px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=PT-${id}" alt="QR PT-${id}" style="width: 120px; height: 120px;" />
                <span style="margin-top: 8px; font-weight: bold; font-family: monospace; font-size: 1.1rem; color: #003366;">PT-${id}</span>
            </div>
        `).join('');

        Swal.fire({
            title: 'QRs para Pruebas (Scanner)',
            html: `<div style="max-height: 400px; overflow-y: auto; text-align: center; padding: 10px; border: 1px solid #e2e8f0; border-radius: 4px; background: #f8fafc; display: flex; flex-wrap: wrap; justify-content: center;">
                    ${gridHtml}
                   </div>`,
            width: '600px',
            confirmButtonText: 'Cerrar',
            confirmButtonColor: '#003366'
        });
    };

    const columnsStock = [
        { header: "Lote", accessor: "loteCodigo" },
        { header: "Especie", accessor: "especieNombre" },
        { header: "Producto", accessor: "productoNombre" },
        { header: "Calibre", accessor: "calibre" },
        { header: "Cajas Disp.", accessor: "totalCantidad", width: "120px", render: r => (
            <div style={{ textAlign: 'center', fontWeight: 'bold' }}>
                {r.totalCantidad}
                <br/>
                <span 
                    onClick={(e) => { e.stopPropagation(); handleViewIds(r.ids); }}
                    style={{ fontSize: '0.75rem', fontWeight: 'normal', color: '#0284c7', cursor: 'pointer', textDecoration: 'underline' }}
                >
                    (ver IDs)
                </span>
            </div>
        )},
        { header: "Kg/Caja", render: r => <div style={{ textAlign: 'center' }}>{(Number(r.totalKilos) / (Number(r.totalCantidad) || 1)).toFixed(2)}</div> },
        { header: "Kilos Totales", accessor: "totalKilos", width: "120px", render: r => <div style={{ textAlign: 'right' }}>{r.totalKilos}</div> },
        { header: "Ubicación", accessor: "ubicacionNombre" }
    ];

    const filteredStock = useMemo(() => {
        let filtered = availableStock.filter(item => {
            return (
                (item.loteCodigo || '').toLowerCase().includes(filters.lote.toLowerCase()) &&
                (item.productoNombre || '').toLowerCase().includes(filters.producto.toLowerCase()) &&
                (item.ubicacionNombre || '').toLowerCase().includes(filters.ubicacion.toLowerCase())
            );
        });

        filtered.sort((a, b) => {
            const loteA = Number(a.loteId) || 0;
            const loteB = Number(b.loteId) || 0;
            
            if (loteA !== loteB) {
                return sortOrder === 'desc' ? loteB - loteA : loteA - loteB;
            }
            
            const contA = Number(a.contenedorId) || 0;
            const contB = Number(b.contenedorId) || 0;
            if (contA !== contB) {
                return sortOrder === 'desc' ? contB - contA : contA - contB;
            }
            
            return 0;
        });

        return filtered;
    }, [availableStock, filters, sortOrder]);

    return (
        <div className="main-container" style={{ position: 'relative' }}>
            <div className="table-wrapper">
                <div className="top-table" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <h1 className="title-table" style={{ margin: 0 }}>Gestión de Contenedores</h1>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px', marginTop: '20px' }}>
                    <div className="stock-section">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px', marginBottom: '10px' }}>
                            <h3 style={{ color: '#003366', margin: 0, fontSize: '1.1rem' }}>Inventario Disponible</h3>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <button
                                    onClick={() => window.open('/scanner', '_blank')}
                                    className="btn-new"
                                    style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#3b82f6', border: 'none' }}
                                >
                                    Gestión Contenedores
                                </button>
                            </div>
                        </div>
                        <div className="table-container-box">
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', flexWrap: 'wrap' }}>
                                <input
                                    placeholder="Filtrar Lote..."
                                    value={filters.lote}
                                    onChange={e => setFilters({ ...filters, lote: e.target.value })}
                                    className="search-input"
                                />
                                <input
                                    placeholder="Filtrar Producto..."
                                    value={filters.producto}
                                    onChange={e => setFilters({ ...filters, producto: e.target.value })}
                                    className="search-input"
                                />
                                <select
                                    value={filters.ubicacion}
                                    onChange={e => setFilters({ ...filters, ubicacion: e.target.value })}
                                    className="search-input"
                                >
                                    <option value="">Todas las ubicaciones...</option>
                                    {[...new Set(availableStock.map(i => i.ubicacionNombre).filter(Boolean))].sort().map(u => (
                                        <option key={u} value={u}>{u}</option>
                                    ))}
                                </select>
                                <select
                                    value={sortOrder}
                                    onChange={e => setSortOrder(e.target.value)}
                                    className="search-input"
                                >
                                    <option value="desc">Más recientes</option>
                                    <option value="asc">Más antiguos</option>
                                </select>
                                <button
                                    onClick={() => setFilters({ lote: '', producto: '', ubicacion: '' })}
                                    className="btn-cancel"
                                    style={{ padding: '6px 14px', whiteSpace: 'nowrap' }}
                                >
                                    Limpiar
                                </button>
                            </div>

                            <Table
                                columns={columnsStock}
                                data={filteredStock}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Contenedores;
