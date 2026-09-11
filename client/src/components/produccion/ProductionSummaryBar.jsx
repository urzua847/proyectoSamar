import React from 'react';

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
    return (
        <div style={{
            background: '#f8fafc',
            border: isExceeded ? '1px solid #fca5a5' : '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            boxShadow: isExceeded ? '0 4px 14px rgba(239, 68, 68, 0.08)' : '0 2px 4px rgba(0,0,0,0.02)',
            transition: 'all 0.2s ease-in-out'
        }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px 16px', alignItems: 'start' }}>
                {/* Total Producido */}
                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '10px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '4px' }}>
                        Total Producido
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'Consolas, "Courier New", monospace', color: '#0f172a' }}>
                        {(totalProducido || 0).toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', fontFamily: 'inherit' }}>kg</span>
                    </div>
                    {(totalCarneProducido > 0 || totalPinzasProducido > 0) && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'flex', gap: '4px', flexDirection: 'column' }}>
                            {totalCarneProducido > 0 && <span style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>Blanca: {totalCarneProducido.toFixed(2)} kg</span>}
                            {totalPinzasProducido > 0 && <span style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>Pinzas: {totalPinzasProducido.toFixed(2)} kg</span>}
                        </div>
                    )}
                </div>

                {/* Ya Ingresados */}
                <div style={{ paddingLeft: '6px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '4px' }}>
                        Ya Ingresados
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'Consolas, "Courier New", monospace', color: '#475569' }}>
                        {(yaIngresados || 0).toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', fontFamily: 'inherit' }}>kg</span>
                    </div>
                    {(yaIngresadosCarne > 0 || yaIngresadosPinzas > 0) && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'flex', gap: '4px', flexDirection: 'column' }}>
                            {yaIngresadosCarne > 0 && <span style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>Blanca: {yaIngresadosCarne.toFixed(2)} kg</span>}
                            {yaIngresadosPinzas > 0 && <span style={{ background: '#f1f5f9', padding: '2px 4px', borderRadius: '4px' }}>Pinzas: {yaIngresadosPinzas.toFixed(2)} kg</span>}
                        </div>
                    )}
                </div>

                {/* Ingreso Actual */}
                <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: '10px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '4px' }}>
                        Ingreso Actual
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'Consolas, "Courier New", monospace', color: '#0284c7' }}>
                        {(ingresoActual || 0).toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', fontFamily: 'inherit' }}>kg</span>
                    </div>
                    {(ingresoActualCarne > 0 || ingresoActualPinzas > 0) && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'flex', gap: '4px', flexDirection: 'column' }}>
                            {ingresoActualCarne > 0 && <span style={{ background: '#f0f9ff', padding: '2px 4px', borderRadius: '4px' }}>Blanca: {ingresoActualCarne.toFixed(2)} kg</span>}
                            {ingresoActualPinzas > 0 && <span style={{ background: '#f0f9ff', padding: '2px 4px', borderRadius: '4px' }}>Pinzas: {ingresoActualPinzas.toFixed(2)} kg</span>}
                        </div>
                    )}
                </div>

                {/* Saldo Restante */}
                <div style={{ paddingLeft: '6px' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '4px' }}>
                        Saldo Restante
                    </div>
                    <div style={{
                        fontSize: '1.25rem',
                        fontWeight: '800',
                        fontFamily: 'Consolas, "Courier New", monospace',
                        color: isExceeded ? '#ef4444' : '#16a34a',
                        transition: 'color 0.2s ease-in-out'
                    }}>
                        {(saldoRestante || 0).toFixed(2)} <span style={{ fontSize: '0.75rem', fontWeight: '600', color: isExceeded ? '#ef4444' : '#64748b', fontFamily: 'inherit' }}>kg</span>
                    </div>
                    {(saldoRestanteCarne !== 0 || saldoRestantePinzas !== 0) && (
                        <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'flex', gap: '4px', flexDirection: 'column' }}>
                            {saldoRestanteCarne !== 0 && (
                                <span style={{ background: saldoRestanteCarne < 0 ? '#fef2f2' : '#f0fdf4', color: saldoRestanteCarne < 0 ? '#dc2626' : '#166534', padding: '2px 4px', borderRadius: '4px' }}>
                                    Blanca: {saldoRestanteCarne.toFixed(2)} kg
                                </span>
                            )}
                            {saldoRestantePinzas !== 0 && (
                                <span style={{ background: saldoRestantePinzas < 0 ? '#fef2f2' : '#f0fdf4', color: saldoRestantePinzas < 0 ? '#dc2626' : '#166534', padding: '2px 4px', borderRadius: '4px' }}>
                                    Pinzas: {saldoRestantePinzas.toFixed(2)} kg
                                </span>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {isExceeded && (
                <div style={{
                    marginTop: '12px',
                    padding: '8px 12px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    color: '#dc2626',
                    fontSize: '0.825rem',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: '#dc2626', color: 'white', fontWeight: 'bold' }}>!</div>
                    <span>Atención: El saldo restante es negativo ({(saldoRestante || 0).toFixed(2)} kg). Supera los kilos disponibles considerando ingresos previos.</span>
                </div>
            )}
        </div>
    );
}
