import { useState, useEffect, useRef } from 'react';
import axios from '../services/root.service.js';
import { getUbicaciones } from '../services/catalogos.service.js';
import { showErrorAlert, showSuccessAlert, showToastSuccess, showToastError, showToastWarning } from '../helpers/sweetAlert';
import { useAuth } from '../context/AuthContext';
import { format as formatTempo } from "@formkit/tempo";
import CameraScanner from '../components/produccion/CameraScanner';

const ScannerCarga = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('entrada'); // 'entrada' | 'salida'
    const [scannerMode, setScannerMode] = useState(localStorage.getItem('scannerMode') || 'pistola'); // 'pistola' | 'camara'
    
    // Bloqueo de concurrencia para evitar que se procesen múltiples códigos a la vez en procesos de confirmación
    const [isConfirming, setIsConfirming] = useState(false);

    useEffect(() => {
        localStorage.setItem('scannerMode', scannerMode);
    }, [scannerMode]);

    // --- ENTRADA (Carga a Contenedor) ---
    const [contenedores, setContenedores] = useState([]);
    const [destinoId, setDestinoId] = useState('');
    const [inputValueEntrada, setInputValueEntrada] = useState('');
    const [pendientesEntrada, setPendientesEntrada] = useState([]);
    const [cajasCargadasEntrada, setCajasCargadasEntrada] = useState(0);
    const inputRefEntrada = useRef(null);

    // --- SALIDA (Despacho / Picking) ---
    const [pedidosPendientes, setPedidosPendientes] = useState([]);
    const [pedidoSeleccionadoId, setPedidoSeleccionadoId] = useState('');
    const [pedidoDetalle, setPedidoDetalle] = useState(null);
    const [inputValueSalida, setInputValueSalida] = useState('');
    const [pendientesSalida, setPendientesSalida] = useState([]);
    const [cajasDespachadas, setCajasDespachadas] = useState(0);
    const inputRefSalida = useRef(null);
    const [isClosing, setIsClosing] = useState(false);

    useEffect(() => {
        getUbicaciones().then(data => {
            if (data) setContenedores(data.filter(u => u.tipo === 'contenedor'));
        });
        fetchPedidosPendientes();
    }, []);

    const fetchPedidosPendientes = async () => {
        try {
            const response = await axios.get('/pedidos?estado=Pendiente');
            const data = response.data.data.data || [];
            setPedidosPendientes(data);
        } catch (error) {
            console.error("Error fetching pedidos", error);
        }
    };

    useEffect(() => {
        if (pedidoSeleccionadoId) {
            const pedido = pedidosPendientes.find(p => p.id === parseInt(pedidoSeleccionadoId));
            setPedidoDetalle(pedido || null);
        } else {
            setPedidoDetalle(null);
        }
        setCajasDespachadas(0);
        setPendientesSalida([]);
    }, [pedidoSeleccionadoId, pedidosPendientes]);

    // Focus management
    useEffect(() => {
        if (activeTab === 'entrada' && destinoId && inputRefEntrada.current) {
            inputRefEntrada.current.focus();
        }
        if (activeTab === 'salida' && pedidoSeleccionadoId && inputRefSalida.current) {
            inputRefSalida.current.focus();
        }
    }, [activeTab, destinoId, pedidoSeleccionadoId, scannerMode]);

    // --- LOGICA DE ENTRADA ---
    const processScanEntrada = (scanValue) => {
        if (!destinoId) {
            showErrorAlert('Error', 'Selecciona un contenedor primero');
            setInputValueEntrada('');
            return;
        }
        if (!scanValue) return;

        setPendientesEntrada(prev => {
            if (prev.includes(scanValue)) {
                showToastWarning(`Caja ${scanValue} ya está en la lista.`);
                return prev; // No lo agrega si ya existe
            }
            return [scanValue, ...prev];
        });

        setInputValueEntrada('');
        if (inputRefEntrada.current && scannerMode === 'pistola') inputRefEntrada.current.focus();
    };

    const handleScanEntrada = (e) => {
        if (e) e.preventDefault();
        processScanEntrada(inputValueEntrada.trim());
    };

    const removePendienteEntrada = (val) => {
        setPendientesEntrada(prev => prev.filter(v => v !== val));
    };

    const handleConfirmarEntrada = async () => {
        if (pendientesEntrada.length === 0) return;
        setIsConfirming(true);
        let successCount = 0;
        let errors = [];

        for (const scanValue of pendientesEntrada) {
            try {
                const response = await axios.post('/traslado/scan', { boxId: scanValue, destinoId: Number(destinoId) });
                if (response.data.status === 'Success') {
                    successCount++;
                } else {
                    errors.push(`${scanValue}: ${response.data.message || 'Error desconocido'}`);
                }
            } catch (error) {
                errors.push(`${scanValue}: ${error.response?.data?.message || 'Error de red'}`);
            }
        }
        
        setCajasCargadasEntrada(prev => prev + successCount);
        
        if (errors.length === 0) {
            showSuccessAlert('Carga Completa', `Se trasladaron exitosamente ${successCount} cajas.`);
            setPendientesEntrada([]);
        } else {
            showErrorAlert('Carga Parcial', `Se trasladaron ${successCount} cajas, pero fallaron las siguientes:\n${errors.join('\n')}`);
            setPendientesEntrada([]);
        }
        
        setIsConfirming(false);
    };

    // --- LOGICA DE SALIDA ---
    const processScanSalida = (scanValue) => {
        if (!pedidoSeleccionadoId) {
            showErrorAlert('Error', 'Selecciona un pedido primero');
            setInputValueSalida('');
            return;
        }
        if (!scanValue) return;

        setPendientesSalida(prev => {
            if (prev.includes(scanValue)) {
                showToastWarning(`Caja ${scanValue} ya está en la lista.`);
                return prev;
            }
            return [scanValue, ...prev];
        });

        setInputValueSalida('');
        if (inputRefSalida.current && scannerMode === 'pistola') inputRefSalida.current.focus();
    };

    const handleScanSalida = (e) => {
        if (e) e.preventDefault();
        processScanSalida(inputValueSalida.trim());
    };

    const removePendienteSalida = (val) => {
        setPendientesSalida(prev => prev.filter(v => v !== val));
    };

    const handleConfirmarSalida = async () => {
        if (pendientesSalida.length === 0) return;
        setIsConfirming(true);
        let successCount = 0;
        let errors = [];

        for (const scanValue of pendientesSalida) {
            try {
                const response = await axios.post(`/pedidos/${pedidoSeleccionadoId}/despachar`, { 
                    cajaId: scanValue,
                    cerrarPedido: false 
                });
                successCount++;
            } catch (error) {
                const msg = error.response?.data?.message || 'Error';
                errors.push(`${scanValue}: ${msg}`);
            }
        }
        
        setCajasDespachadas(prev => prev + successCount);
        fetchPedidosPendientes(); // Refresh counts in UI
        
        if (errors.length === 0) {
            showSuccessAlert('Despacho Exitoso', `Se agregaron ${successCount} cajas al pedido.`);
            setPendientesSalida([]);
        } else {
            showErrorAlert('Despacho Parcial', `Se agregaron ${successCount} cajas, pero fallaron las siguientes:\n${errors.join('\n')}`);
            setPendientesSalida([]);
        }
        
        setIsConfirming(false);
    };

    const handleCerrarPedido = async () => {
        if (!pedidoSeleccionadoId) return;
        if (pendientesSalida.length > 0) {
            showErrorAlert('Atención', 'Tienes cajas en la cola sin confirmar. Confirma el despacho primero antes de cerrar.');
            return;
        }
        setIsClosing(true);
        try {
            await axios.post(`/pedidos/${pedidoSeleccionadoId}/despachar`, { 
                cerrarPedido: true 
            });
            showSuccessAlert('Éxito', 'Pedido cerrado y despachado correctamente.');
            setPedidoSeleccionadoId('');
            fetchPedidosPendientes();
        } catch (error) {
            showErrorAlert('Error', error.response?.data?.message || 'Error al cerrar el pedido');
        } finally {
            setIsClosing(false);
        }
    };

    return (
        <div className="main-container">
            <div className="table-wrapper" style={{ maxWidth: '800px', margin: '0 auto', display: 'block' }}>
                <div className="top-table" style={{ justifyContent: 'center', marginBottom: '20px' }}>
                    <h1 className="title-table">Escáner de Logística</h1>
                </div>
            
                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
                    {/* Selector de Modo */}
                    <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => setScannerMode('pistola')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: scannerMode === 'pistola' ? '#003366' : '#e2e8f0',
                                color: scannerMode === 'pistola' ? '#ffffff' : '#334155',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Modo Pistola
                        </button>
                        <button 
                            onClick={() => setScannerMode('camara')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: scannerMode === 'camara' ? '#003366' : '#e2e8f0',
                                color: scannerMode === 'camara' ? '#ffffff' : '#334155',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            Modo Cámara
                        </button>
                    </div>

                    {/* Tabs */}
                    <div style={{ display: 'flex', gap: '10px', marginLeft: '20px', paddingLeft: '20px', borderLeft: '2px solid #e2e8f0' }}>
                        <button 
                            onClick={() => setActiveTab('entrada')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: activeTab === 'entrada' ? '#003366' : '#e2e8f0',
                                color: activeTab === 'entrada' ? '#ffffff' : '#334155',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            ENTRADA (A Contenedor)
                        </button>
                        <button 
                            onClick={() => setActiveTab('salida')}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: activeTab === 'salida' ? '#003366' : '#e2e8f0',
                                color: activeTab === 'salida' ? '#ffffff' : '#334155',
                                border: 'none',
                                borderRadius: '4px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            SALIDA (Despacho)
                        </button>
                    </div>
                </div>

                <div className="table-container-box">
                    
                    {activeTab === 'entrada' && (
                    <div className="fade-in">
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#003366', fontSize: '1.1rem' }}>1. Seleccionar Contenedor Destino</label>
                            <select 
                                value={destinoId} 
                                onChange={e => setDestinoId(e.target.value)}
                                className="search-input"
                                style={{ width: '100%', padding: '12px', fontSize: '1.1rem' }}
                            >
                                <option value="">-- Elija un contenedor --</option>
                                {contenedores.map(c => (
                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                ))}
                            </select>
                        </div>

                        {destinoId && (
                            <div style={{ padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '15px', color: '#003366', fontSize: '1.1rem' }}>2. Escanear Código de Caja</label>
                                {scannerMode === 'pistola' ? (
                                    <form onSubmit={handleScanEntrada}>
                                        <input 
                                            ref={inputRefEntrada}
                                            type="text"
                                            value={inputValueEntrada}
                                            onChange={e => setInputValueEntrada(e.target.value)}
                                            placeholder="PT-0000"
                                            disabled={isConfirming}
                                            className="search-input"
                                            style={{ width: '100%', maxWidth: '400px', padding: '15px', fontSize: '1.5rem', textAlign: 'center', marginBottom: '15px' }}
                                            autoFocus
                                        />
                                        <button type="submit" style={{ display: 'none' }}>Scan</button>
                                    </form>
                                ) : (
                                    <div style={{ marginBottom: '15px', maxWidth: '400px', margin: '0 auto' }}>
                                        <CameraScanner 
                                            onScanSuccess={(decodedText) => {
                                                processScanEntrada(decodedText.trim());
                                            }}
                                        />
                                    </div>
                                )}
                                
                                {pendientesEntrada.length > 0 && (
                                    <div style={{ marginTop: '20px', textAlign: 'left', maxWidth: '400px', margin: '20px auto 0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <h3 style={{ fontSize: '1.1rem', color: '#003366', margin: 0 }}>Cola de Escaneo</h3>
                                            <span style={{ backgroundColor: '#003366', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>{pendientesEntrada.length} items</span>
                                        </div>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff' }}>
                                            {pendientesEntrada.map(val => (
                                                <div key={val} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#334155' }}>{val}</span>
                                                    <button onClick={() => removePendienteEntrada(val)} className="btn-cancel" style={{ padding: '4px 8px', minWidth: 'auto', fontSize: '0.9rem' }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={handleConfirmarEntrada}
                                            disabled={isConfirming}
                                            className="btn-new"
                                            style={{ width: '100%', marginTop: '15px', padding: '12px', fontSize: '1.1rem' }}
                                        >
                                            {isConfirming ? 'Procesando...' : `Confirmar Ingreso (${pendientesEntrada.length})`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        <div style={{ marginTop: '30px', textAlign: 'center', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
                            <h2 style={{ margin: 0, color: '#003366', fontSize: '1.2rem' }}>Cajas Cargadas (Sesión Actual)</h2>
                            <span style={{ fontSize: '4rem', fontWeight: 'bold', color: '#10b981', display: 'block', marginTop: '10px' }}>{cajasCargadasEntrada}</span>
                        </div>
                    </div>
                )}

                {activeTab === 'salida' && (
                    <div className="fade-in">
                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#003366', fontSize: '1.1rem' }}>1. Seleccionar Pedido (Pendiente)</label>
                            <select 
                                value={pedidoSeleccionadoId} 
                                onChange={e => setPedidoSeleccionadoId(e.target.value)}
                                className="search-input"
                                style={{ width: '100%', padding: '12px', fontSize: '1.1rem' }}
                            >
                                <option value="">-- Seleccionar Pedido --</option>
                                {pedidosPendientes.map(p => (
                                    <option key={p.id} value={p.id}>ID: {p.id} - {p.cliente} ({p.numero_guia || 'Sin Guía'})</option>
                                ))}
                            </select>
                        </div>

                        {pedidoDetalle && (
                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <h3 style={{ marginTop: 0, color: '#003366', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>Detalle del Plan de Despacho</h3>
                                {pedidoDetalle.detalles?.map(det => {
                                    const definicion = det.definicion_producto?.nombre || 'Producto Desconocido';
                                    const calibre = det.tipo_formato || 'N/A';
                                    const meta = det.cantidad_bultos;
                                    const escaneadas = det.cajas_asignadas || 0;
                                    const isComplete = escaneadas >= meta;
                                    
                                    return (
                                        <div key={det.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                                            <div>
                                                <div style={{ fontWeight: 'bold', color: '#334155' }}>{definicion}</div>
                                                <div style={{ fontSize: '0.9rem', color: '#64748b' }}>Calibre: {calibre}</div>
                                                  {det.kilos_totales ? <div style={{ fontSize: '0.85rem', color: '#0284c7', marginTop: '2px' }}>Peso: {det.kilos_totales} kg</div> : null}
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: isComplete ? '#10b981' : '#f59e0b' }}>
                                                    {escaneadas} / {meta} cajas
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {pedidoSeleccionadoId && (
                            <div style={{ padding: '20px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', textAlign: 'center' }}>
                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '15px', color: '#003366', fontSize: '1.1rem' }}>2. Escanear Caja para Despacho</label>
                                {scannerMode === 'pistola' ? (
                                    <form onSubmit={handleScanSalida}>
                                        <input 
                                            ref={inputRefSalida}
                                            type="text"
                                            value={inputValueSalida}
                                            onChange={e => setInputValueSalida(e.target.value)}
                                            placeholder="PT-0000"
                                            disabled={isConfirming || isClosing}
                                            className="search-input"
                                            style={{ width: '100%', maxWidth: '400px', padding: '15px', fontSize: '1.5rem', textAlign: 'center', marginBottom: '15px' }}
                                            autoFocus
                                        />
                                        <button type="submit" style={{ display: 'none' }}>Scan</button>
                                    </form>
                                ) : (
                                    <div style={{ marginBottom: '15px', maxWidth: '400px', margin: '0 auto' }}>
                                        <CameraScanner 
                                            onScanSuccess={(decodedText) => {
                                                processScanSalida(decodedText.trim());
                                            }}
                                        />
                                    </div>
                                )}

                                {pendientesSalida.length > 0 && (
                                    <div style={{ marginTop: '20px', textAlign: 'left', maxWidth: '400px', margin: '20px auto 0' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                            <h3 style={{ fontSize: '1.1rem', color: '#003366', margin: 0 }}>Cola de Escaneo</h3>
                                            <span style={{ backgroundColor: '#003366', color: 'white', padding: '4px 10px', borderRadius: '12px', fontSize: '0.9rem', fontWeight: 'bold' }}>{pendientesSalida.length} items</span>
                                        </div>
                                        <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #cbd5e1', borderRadius: '4px', backgroundColor: '#fff' }}>
                                            {pendientesSalida.map(val => (
                                                <div key={val} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#334155' }}>{val}</span>
                                                    <button onClick={() => removePendienteSalida(val)} className="btn-cancel" style={{ padding: '4px 8px', minWidth: 'auto', fontSize: '0.9rem' }}>✕</button>
                                                </div>
                                            ))}
                                        </div>
                                        <button 
                                            onClick={handleConfirmarSalida}
                                            disabled={isConfirming || isClosing}
                                            className="btn-new"
                                            style={{ width: '100%', marginTop: '15px', padding: '12px', fontSize: '1.1rem' }}
                                        >
                                            {isConfirming ? 'Procesando...' : `Confirmar Salida (${pendientesSalida.length})`}
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {pedidoSeleccionadoId && (() => {
                            const isComplete = pedidoDetalle?.detalles?.every(det => (det.cajas_asignadas || 0) >= det.cantidad_bultos);
                            const isAdmin = user?.rol === 'administrador';
                            
                            return (
                                <div style={{ marginTop: '30px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div style={{ textAlign: 'center', borderTop: '2px solid #e2e8f0', paddingTop: '20px' }}>
                                        <h2 style={{ margin: 0, color: '#003366', fontSize: '1.2rem' }}>Cajas Despachadas (Sesión Actual)</h2>
                                        <span style={{ fontSize: '4rem', fontWeight: 'bold', color: '#10b981', display: 'block', marginTop: '10px' }}>{cajasDespachadas}</span>
                                    </div>
                                    
                                    {isComplete ? (
                                        <button 
                                            onClick={handleCerrarPedido}
                                            disabled={isClosing || isConfirming}
                                            className="btn-new"
                                            style={{ width: '100%', padding: '12px', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto' }}
                                        >
                                            {isClosing ? 'Cerrando...' : 'Finalizar y Cerrar Pedido'}
                                        </button>
                                    ) : (
                                        isAdmin ? (
                                            <button 
                                                onClick={handleCerrarPedido}
                                                disabled={isClosing || isConfirming}
                                                className="btn-cancel"
                                                style={{ width: '100%', padding: '12px', fontSize: '1.1rem', maxWidth: '400px', margin: '0 auto' }}
                                            >
                                                {isClosing ? 'Cerrando...' : 'Forzar Cierre (Pedido Incompleto)'}
                                            </button>
                                        ) : (
                                            <div style={{ padding: '15px', backgroundColor: '#fef3c7', color: '#92400e', borderRadius: '4px', textAlign: 'center', fontSize: '0.9rem', border: '1px solid #fde68a', maxWidth: '600px', margin: '0 auto' }}>
                                                ⚠️ El pedido está incompleto. Siga escaneando o solicite a un <strong>Administrador</strong> para forzar el cierre.
                                            </div>
                                        )
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                )}
                </div>
            </div>
            <style>{`
                .fade-in {
                    animation: fadeIn 0.4s ease-in-out;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default ScannerCarga;
