import { useState, useEffect } from 'react';
import { createLote } from '../../services/recepcion.service';
import { getProveedores, getMateriasPrimas } from '../../services/catalogos.service';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

const useRecepcion = () => {
    const [proveedores, setProveedores] = useState([]);
    const [materiasPrimas, setMateriasPrimas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para la Calculadora de Peso
    const [pesadas, setPesadas] = useState([]); 
    const [inputPeso, setInputPeso] = useState(""); 
    const [inputBandejas, setInputBandejas] = useState("");

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

    // --- LÓGICA DE TANDAS ---
    const agregarTanda = () => {
        const peso = parseFloat(inputPeso);
        const bandejas = parseInt(inputBandejas);

        if (peso > 0 && bandejas > 0) {
            setPesadas([...pesadas, { peso, bandejas }]);
            setInputPeso("");
            setInputBandejas("");
        }
    };

    const eliminarUltimaTanda = () => {
        setPesadas(pesadas.slice(0, -1));
    };

    const pesoTotal = pesadas.reduce((acc, curr) => acc + curr.peso, 0);
    const bandejasTotal = pesadas.reduce((acc, curr) => acc + curr.bandejas, 0);

    // --- CORRECCIÓN EN LA FUNCIÓN DE GUARDAR ---
    const handleCreateLote = async (data) => {
        // 1. Usamos los datos que nos pasan (data.pesadas) o los locales si no vienen
        const pesadasFinales = data.pesadas || pesadas;
        
        // 2. Validación correcta
        if (!pesadasFinales || pesadasFinales.length === 0) {
            // Usamos showErrorAlert para que salga la X roja, no el ticket verde
            showErrorAlert('Atención', 'Debes registrar al menos una tanda en la tabla.');
            return false;
        }

        try {
            const payload = {
                proveedorId: Number(data.proveedor),
                materiaPrimaId: Number(data.materiaPrima),
                peso_bruto_kg: Number(data.peso_bruto_kg),
                numero_bandejas: Number(data.numero_bandejas),
                pesadas: pesadasFinales // Enviamos el array correcto
            };

            const response = await createLote(payload);
            
            if (response.status === 'Success') {
                showSuccessAlert('¡Lote Registrado!', `Código: ${response.data.codigo}`);
                setPesadas([]); // Limpiamos estado local
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
        inputPeso, setInputPeso,
        inputBandejas, setInputBandejas,
        agregarTanda,
        eliminarUltimaTanda,
        pesoTotal,
        bandejasTotal,
        handleCreateLote
    };
};

export default useRecepcion;