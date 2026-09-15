import React from 'react';

const styleSheet = `
@keyframes progress-bar-stripes {
    from { background-position: 1rem 0; }
    to { background-position: 0 0; }
}
`;

const ProgressBar = ({ total, yaIngresados, actual, restante, label, isExceededLocal }) => {
    const safeTotal = total > 0 ? total : 1; 
    let percentYa = ((yaIngresados || 0) / safeTotal) * 100;
    let percentActual = ((actual || 0) / safeTotal) * 100;
    
    if (percentYa > 100) percentYa = 100;
    if (percentYa + percentActual > 100) {
        percentActual = 100 - percentYa;
    }

    return (
        <div style={{ marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', alignItems: 'flex-end' }}>
                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.95rem', textTransform: 'uppercase' }}>{label}</span>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>Total: {(total || 0).toFixed(2)} kg</span>
            </div>
            
            {/* The Bar */}
            <div style={{ 
                height: '24px', 
                backgroundColor: '#f1f5f9', 
                borderRadius: '12px', 
                display: 'flex', 
                overflow: 'hidden',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)'
            }}>
                {percentYa > 0 && (
                    <div style={{ 
                        width: `${percentYa}%`, 
                        backgroundColor: '#475569',
                        transition: 'width 0.4s ease'
                    }} title={`Ya Ingresados: ${(yaIngresados || 0).toFixed(2)} kg`} />
                )}
                {percentActual > 0 && (
                    <div style={{ 
                        width: `${percentActual}%`, 
                        backgroundColor: isExceededLocal ? '#ef4444' : '#3b82f6',
                        backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.2) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.2) 50%, rgba(255,255,255,.2) 75%, transparent 75%, transparent)',
                        backgroundSize: '1rem 1rem',
                        animation: 'progress-bar-stripes 1s linear infinite',
                        transition: 'width 0.4s ease'
                    }} title={`Ingreso Actual: ${(actual || 0).toFixed(2)} kg`} />
                )}
            </div>

            {/* Sub-labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.85rem', alignItems: 'center' }}>
                <span style={{ color: '#64748b' }}>Ya ingresado: {(yaIngresados || 0).toFixed(2)} kg</span>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span style={{ color: '#0284c7', fontWeight: '700', background: '#f0f9ff', padding: '2px 8px', borderRadius: '6px' }}>
                        + {(actual || 0).toFixed(2)} kg
                    </span>
                    <span style={{ color: isExceededLocal ? '#ef4444' : '#16a34a', fontWeight: '700' }}>
                        Faltan: {(restante || 0).toFixed(2)} kg
                    </span>
                </div>
            </div>
        </div>
    );
};

export default function ProductionSummaryBar({
    isExceeded,
    totalProducido,
    totalCarneProducido,
    totalPinzasProducido,
    yaIngresados,
    yaIngresadosCarne,
    yaIngresadosPinzas,
    ingresoActual,
    ingresoActualCarne,
    ingresoActualPinzas,
    saldoRestante,
    saldoRestanteCarne,
    saldoRestantePinzas
}) {
    // Determine if we need to show breakdown bars or a generic one
    const showBreakdown = totalCarneProducido > 0 || totalPinzasProducido > 0;

    return (
        <div style={{
            background: '#ffffff',
            border: isExceeded ? '1px solid #fca5a5' : '1px solid transparent',
            borderRadius: '12px',
            padding: '24px 20px',
            marginBottom: '24px',
            transition: 'all 0.2s ease-in-out'
        }}>
            <style>{styleSheet}</style>

            {/* Contexto General Arriba */}
            <div style={{ marginBottom: '28px', paddingBottom: '20px', borderBottom: '2px dashed #e2e8f0', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '8px' }}>
                    Total Producido (Lote Actual)
                </div>
                <div style={{ fontSize: '2.2rem', fontWeight: '800', fontFamily: 'Consolas, "Courier New", monospace', color: '#0f172a', lineHeight: '1' }}>
                    {(totalProducido || 0).toFixed(2)} <span style={{ fontSize: '1.2rem', fontWeight: '600', color: '#64748b', fontFamily: 'inherit' }}>kg</span>
                </div>
            </div>

            {/* Barras de Progreso */}
            {showBreakdown ? (
                <>
                    {totalCarneProducido > 0 && (
                        <ProgressBar 
                            label="Carne Blanca" 
                            total={totalCarneProducido} 
                            yaIngresados={yaIngresadosCarne} 
                            actual={ingresoActualCarne} 
                            restante={saldoRestanteCarne} 
                            isExceededLocal={saldoRestanteCarne < 0}
                        />
                    )}
                    {totalPinzasProducido > 0 && (
                        <ProgressBar 
                            label="Pinzas" 
                            total={totalPinzasProducido} 
                            yaIngresados={yaIngresadosPinzas} 
                            actual={ingresoActualPinzas} 
                            restante={saldoRestantePinzas} 
                            isExceededLocal={saldoRestantePinzas < 0}
                        />
                    )}
                </>
            ) : (
                <ProgressBar 
                    label="Producción General" 
                    total={totalProducido} 
                    yaIngresados={yaIngresados} 
                    actual={ingresoActual} 
                    restante={saldoRestante} 
                    isExceededLocal={saldoRestante < 0}
                />
            )}

            {isExceeded && (
                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#dc2626',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: '#dc2626', color: 'white', fontWeight: 'bold', flexShrink: 0 }}>!</div>
                    <span>Atención: El saldo restante es negativo ({(saldoRestante || 0).toFixed(2)} kg). Estás ingresando más kilos de los que produjo el lote.</span>
                </div>
            )}
        </div>
    );
}
