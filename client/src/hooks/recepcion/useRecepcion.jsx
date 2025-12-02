import { useState, useEffect } from 'react';
import { createLote } from '../../services/recepcion.service';
import { getProveedores, getMateriasPrimas } from '../../services/catalogos.service';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

const useRecepcion = () => {
    const [proveedores, setProveedores] = useState([]);
    const [materiasPrimas, setMateriasPrimas] = useState([]);
    const [loading, setLoading] = useState(true);

    const [pesadas, setPesadas] = useState([]);
    const [pesoActual, setPesoActual] = useState("");

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
        const valor = parseFloat(pesoActual);
        if (valor > 0) {
            setPesadas([...pesadas, valor]);
            setPesoActual("");
        }
    };

    const eliminarUltimaPesada = () => {
        setPesadas(pesadas.slice(0, -1));
    };

    // Calculamos el total localmente por si se usa en el UI
    const pesoTotal = pesadas.reduce((acc, curr) => acc + curr, 0);

    // --- CORRECCIÓN AQUÍ ---
    const handleCreateLote = async (data) => {
        // 1. Determinamos qué datos usar (priorizamos los que vienen en 'data')
        const finalPesadas = data.pesadas || pesadas; 
        const finalPesoBruto = data.peso_bruto_kg !== undefined ? data.peso_bruto_kg : pesoTotal;

        // 2. Validamos usando los datos finales
        if (finalPesoBruto <= 0) {
            showErrorAlert('Atención', 'Debes ingresar al menos una pesada.');
            return false;
        }

        try {
            const payload = {
                proveedorId: Number(data.proveedor),
                materiaPrimaId: Number(data.materiaPrima),
                numero_bandejas: Number(data.numero_bandejas),
                peso_bruto_kg: Number(finalPesoBruto), // Usamos el valor corregido
                pesadas: finalPesadas                  // Usamos el array corregido
            };

            const response = await createLote(payload);
            
            if (response.status === 'Success') {
                showSuccessAlert('¡Lote Registrado!', `Código: ${response.data.codigo}`);
                setPesadas([]); // Limpiamos el estado local por si acaso
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
        agregarPesada,
        eliminarUltimaPesada,
        pesoTotal,
        handleCreateLote
    };
};

export default useRecepcion;