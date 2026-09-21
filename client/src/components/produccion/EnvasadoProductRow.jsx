import React from 'react';

const EnvasadoProductRow = ({ 
    prod, 
    calibres, 
    idx, 
    formData, 
    errors, 
    obtenerGramaje, 
    handleInputChange, 
    saldoRestanteCarne, 
    saldoRestantePinzas 
}) => {
    return calibres.map((cal, calIdx) => {
        const key = `${prod.id}-${cal}`;
        const data = formData[key] || {};
        const rowErrors = errors[key] || {};
        const gramaje = obtenerGramaje(cal);
        
        const origenStr = prod.origen ? prod.origen.toLowerCase() : '';
        const isCarne = origenStr === 'carne blanca' || origenStr === 'carne_blanca';
        const isPinza = origenStr === 'pinza';
        const isOverdrawn = (isCarne && saldoRestanteCarne < 0) || (isPinza && saldoRestantePinzas < 0);
        const hasQtyError = rowErrors.cantidad || (isOverdrawn && (data.cantidad > 0 || data.pesoTotal > 0));

        const inputStyle = {
            width: '100%',
            padding: '10px 12px',
            textAlign: 'center',
            borderRadius: '6px',
            border: '1px solid transparent',
            backgroundColor: hasQtyError ? '#fee2e2' : '#f1f5f9',
            boxShadow: hasQtyError ? '0 0 0 1px #ef4444' : 'inset 0 1px 2px rgba(0,0,0,0.05)',
            transition: 'all 0.2s',
            outline: 'none',
            fontSize: '0.95rem'
        };

        const inputStylePeso = {
            ...inputStyle,
            backgroundColor: gramaje > 0 ? '#e2e8f0' : (hasQtyError ? '#fee2e2' : '#f1f5f9'),
        };

        return (
            <tr key={`${prod.id}-${calIdx}`} style={{ borderBottom: calIdx === calibres.length - 1 ? '2px solid #e2e8f0' : '1px solid #f8fafc' }}>
                {calIdx === 0 && (
                    <td rowSpan={calibres.length} style={{ padding: '20px', fontWeight: '700', color: '#0f172a', verticalAlign: 'middle', borderRight: '1px solid #f1f5f9', background: '#f8fafc', fontSize: '1.05rem' }}>
                        {prod.nombre}
                    </td>
                )}
                <td style={{ fontWeight: '600', padding: '16px 20px', whiteSpace: 'nowrap', color: '#475569', fontSize: '0.95rem' }}>{cal}</td>
                <td style={{ padding: '12px 20px' }}>
                    <input
                        type="number"
                        placeholder="0"
                        value={data.cantidad || ''}
                        onChange={(e) => handleInputChange(prod.id, cal, 'cantidad', e.target.value)}
                        style={inputStyle}
                        onFocus={(e) => e.target.style.border = '1px solid #3b82f6'}
                        onBlur={(e) => e.target.style.border = '1px solid transparent'}
                    />
                </td>
                <td style={{ padding: '12px 20px' }}>
                    <input
                        type="number"
                        placeholder="0.00"
                        value={data.pesoTotal || ''}
                        onChange={(e) => handleInputChange(prod.id, cal, 'pesoTotal', e.target.value)}
                        disabled={gramaje > 0}
                        style={inputStylePeso}
                        onFocus={(e) => e.target.style.border = gramaje > 0 ? '1px solid transparent' : '1px solid #3b82f6'}
                        onBlur={(e) => e.target.style.border = '1px solid transparent'}
                    />
                </td>
            </tr>
        );
    });
};

export default EnvasadoProductRow;
