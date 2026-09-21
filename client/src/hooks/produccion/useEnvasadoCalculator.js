import { useMemo } from 'react';

export default function useEnvasadoCalculator({ 
    resumenYield, 
    activeLote, 
    formData, 
    productosCatalogo 
}) {
    const totalCarneProducido = useMemo(() => {
        if (resumenYield?.input) return Number(resumenYield.input.carne || 0);
        return activeLote ? Number(activeLote.peso_carne_blanca || 0) : 0;
    }, [resumenYield, activeLote]);

    const totalPinzasProducido = useMemo(() => {
        if (resumenYield?.input) return Number(resumenYield.input.pinzas || 0);
        return activeLote ? Number(activeLote.peso_pinzas || 0) : 0;
    }, [resumenYield, activeLote]);

    const totalProducido = useMemo(() => {
        if (resumenYield?.input) {
            return Number(resumenYield.input.carne || 0) + Number(resumenYield.input.pinzas || 0);
        }
        return activeLote
            ? (Number(activeLote.peso_total_producido) || (Number(activeLote.peso_carne_blanca || 0) + Number(activeLote.peso_pinzas || 0)) || Number(activeLote.peso_bruto_kg || 0))
            : 0;
    }, [resumenYield, activeLote]);

    const yaIngresadosCarne = useMemo(() => {
        if (!resumenYield?.used) return 0;
        return Number(resumenYield.used.carne || 0);
    }, [resumenYield]);

    const yaIngresadosPinzas = useMemo(() => {
        if (!resumenYield?.used) return 0;
        return Number(resumenYield.used.pinzas || 0);
    }, [resumenYield]);

    const yaIngresados = useMemo(() => {
        if (!resumenYield?.used) return 0;
        return Number(resumenYield.used.carne || 0) + Number(resumenYield.used.pinzas || 0);
    }, [resumenYield]);

    const { ingresoActualCarne, ingresoActualPinzas, ingresoActual } = useMemo(() => {
        let carne = 0;
        let pinzas = 0;
        let total = 0;

        Object.keys(formData).forEach(key => {
            const firstHyphen = key.indexOf('-');
            const prodId = Number(key.substring(0, firstHyphen));
            const entry = formData[key];
            const val = parseFloat(entry?.pesoTotal);
            const kg = isNaN(val) ? 0 : val;

            total += kg;

            const prodDef = productosCatalogo.find(p => p.id === prodId);
            if (prodDef && prodDef.origen) {
                const origenStr = prodDef.origen.toLowerCase();
                if (origenStr === 'carne blanca' || origenStr === 'carne_blanca') carne += kg;
                else if (origenStr === 'pinza') pinzas += kg;
            }
        });

        return { ingresoActualCarne: carne, ingresoActualPinzas: pinzas, ingresoActual: total };
    }, [formData, productosCatalogo]);

    const saldoRestanteCarne = useMemo(() => {
        return totalCarneProducido - yaIngresadosCarne - ingresoActualCarne;
    }, [totalCarneProducido, yaIngresadosCarne, ingresoActualCarne]);

    const saldoRestantePinzas = useMemo(() => {
        return totalPinzasProducido - yaIngresadosPinzas - ingresoActualPinzas;
    }, [totalPinzasProducido, yaIngresadosPinzas, ingresoActualPinzas]);

    const saldoRestante = useMemo(() => {
        return totalProducido - yaIngresados - ingresoActual;
    }, [totalProducido, yaIngresados, ingresoActual]);

    const isExceeded = useMemo(() => {
        return saldoRestanteCarne < 0 || saldoRestantePinzas < 0;
    }, [saldoRestanteCarne, saldoRestantePinzas]);

    return {
        totalCarneProducido,
        totalPinzasProducido,
        totalProducido,
        yaIngresadosCarne,
        yaIngresadosPinzas,
        yaIngresados,
        ingresoActualCarne,
        ingresoActualPinzas,
        ingresoActual,
        saldoRestanteCarne,
        saldoRestantePinzas,
        saldoRestante,
        isExceeded
    };
}
