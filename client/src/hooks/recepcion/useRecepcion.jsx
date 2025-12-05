import { useState, useEffect } from 'react';
import { createLote } from '../../services/recepcion.service';
import { getProveedores, getMateriasPrimas } from '../../services/catalogos.service';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

const useRecepcion = () => {
    const [proveedores, setProveedores] = useState([]);
    const [materiasPrimas, setMateriasPrimas] = useState([]);
    const [loading, setLoading] = useState(true);

    const [pesadas, setPesadas] = useState([]); // Array of { cajas: number, kilos: number }
    const [pesoActual, setPesoActual] = useState("");
    const [cajasActual, setCajasActual] = useState("");

    useEffect(() => {
        async function loadData() {
            try {
                const [provData, matData] = await Promise.all([
                    getProveedores(),
                    getMateriasPrimas()
                ]);
                setProveedores(provData || []);
                setMateriasPrimas(matData || []);
            } catch (error) {
                console.error("Error cargando catálogos:", error);
                showErrorAlert('Error', 'No se pudieron cargar los datos iniciales.');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const agregarPesada = () => {
        const kilos = parseFloat(pesoActual);
        const cajas = parseInt(cajasActual);

        if (kilos > 0 && cajas > 0) {
            setPesadas([...pesadas, { cajas, kilos }]);
            setPesoActual("");
            setCajasActual("");
        }
    };

    const eliminarUltimaPesada = () => {
        setPesadas(pesadas.slice(0, -1));
    };

    // Calculamos totales
    const pesoTotal = pesadas.reduce((acc, curr) => acc + curr.kilos, 0);
    const totalBandejas = pesadas.reduce((acc, curr) => acc + curr.cajas, 0);

    const handleCreateLote = async (data) => {
        // 1. Determinamos qué datos usar (priorizamos los que vienen en 'data')
        const finalPesadas = data.pesadas || pesadas;
        const finalPesoBruto = data.peso_bruto_kg !== undefined ? data.peso_bruto_kg : pesoTotal;
        const finalBandejas = data.numero_bandejas !== undefined ? data.numero_bandejas : totalBandejas;

        // 2. Validamos usando los datos finales
        if (finalPesoBruto <= 0) {
            showErrorAlert('Atención', 'Debes ingresar al menos una tanda.');
            return false;
        }

        try {
            const payload = {
                proveedorId: Number(data.proveedor),
                materiaPrimaId: Number(data.materiaPrima),
                numero_bandejas: Number(finalBandejas),
                peso_bruto_kg: Number(finalPesoBruto),
                pesadas: finalPesadas // Ahora enviamos el array de objetos
            };

            const response = await createLote(payload);

            if (response.status === 'Success') {
                showSuccessAlert('¡Lote Registrado!', `Código: ${response.data.codigo}`);
                setPesadas([]); // Limpiamos el estado local
                return true;
            } else {
                showErrorAlert('Error', response.message || 'No se pudo registrar.');
                return false;
            }
        } catch (error) {
            console.error(error);
            showErrorAlert('Error', 'Ocurrió un error inesperado.');
            return false;
        }
    };

    return {
        proveedores,
        materiasPrimas,
        loading,
        pesadas,
        setPesadas,
        pesoActual,
        setPesoActual,
        cajasActual,
        setCajasActual,
        agregarPesada,
        eliminarUltimaPesada,
        pesoTotal,
        totalBandejas,
        handleCreateLote
    };
};

export default useRecepcion;