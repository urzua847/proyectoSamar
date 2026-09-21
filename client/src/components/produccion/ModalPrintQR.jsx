import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const ModalPrintQR = ({ isOpen, onClose, selectedRow }) => {
    const printRef = useRef();

    if (!isOpen || !selectedRow) return null;

    const handlePrint = () => {
        const printContent = printRef.current.innerHTML;
        const originalContent = document.body.innerHTML;

        document.body.innerHTML = `
            <div style="padding: 20px;">
                ${printContent}
            </div>
        `;
        
        window.print();
        
        document.body.innerHTML = originalContent;
        window.location.reload(); // Reload to restore event listeners
    };

    // Obtenemos los IDs reales de las cajas (PT-XXXX)
    // En la vista de Tránsito, vienen agrupados en row.ids
    const boxIds = selectedRow.ids && selectedRow.ids.length > 0 
        ? selectedRow.ids.map(id => `PT-${id}`)
        : [`PT-${selectedRow.id || selectedRow.contenedorId || 'N/A'}`];

    return (
        <div className="bg" onClick={onClose} style={{ zIndex: 1000, position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div className="popup" onClick={(e) => e.stopPropagation()} style={{ width: '800px', maxWidth: '95%', maxHeight: '90vh', overflowY: 'auto', backgroundColor: 'white', borderRadius: '8px', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '10px', marginBottom: '20px' }}>
                    <h2 style={{ color: '#003366', margin: 0 }}>Rotulado de Cajas - Lote {selectedRow.loteCodigo}</h2>
                    <button className="btn-close-x" onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>&times;</button>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                    <button 
                        onClick={handlePrint}
                        className="btn-save"
                        style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        🖨️ Imprimir QRs ({boxIds.length})
                    </button>
                </div>

                <div 
                    ref={printRef} 
                    style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', 
                        gap: '20px', 
                        backgroundColor: '#f8fafc', 
                        padding: '20px', 
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0' 
                    }}
                >
                    {boxIds.map((boxId, index) => (
                        <div key={index} className="qr-ticket" style={{ 
                            backgroundColor: 'white', 
                            padding: '15px', 
                            borderRadius: '8px', 
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            border: '1px dashed #cbd5e1',
                            pageBreakInside: 'avoid'
                        }}>
                            <div style={{ marginBottom: '15px', textAlign: 'center' }}>
                                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#0f172a', marginBottom: '5px' }}>{selectedRow.productoNombre}</div>
                                <div style={{ fontSize: '0.9rem', color: '#475569' }}>Lote: {selectedRow.loteCodigo} | Calibre: {selectedRow.calibre || 'N/A'}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#0369a1', marginTop: '5px' }}>{boxId}</div>
                            </div>
                            
                            <QRCodeSVG 
                                value={boxId}
                                size={120}
                                level="M"
                            />
                            
                            <div style={{ marginTop: '10px', fontSize: '0.8rem', color: '#94a3b8' }}>
                                R.V. Inversiones
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ModalPrintQR;
