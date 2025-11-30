import { useState, useEffect } from 'react';
import { createLote } from '../../services/recepcion.service';
import { getProveedores, getMateriasPrimas } from '../../services/catalogos.service';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

const useRecepcion = () => {
    // Estados para los catálogos 
    const [proveedores, setProveedores] = useState([]);
    const [materiasPrimas, setMateriasPrimas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para la Calculadora de Peso
    const [pesadas, setPesadas] = useState([]); 
    const [pesoActual, setPesoActual] = useState(""); 

    // Cargar datos al montar el componente
    useEffect(() => {
        async function loadData() {
            try {
                const [provData, matData] = await Promise.all([
                    getProveedores(),
                    getMateriasPrimas()
                ]);
                setProveedores(provData);
                setMateriasPrimas(matData);
            } catch (error) {
                console.error("Error cargando catálogos:", error);
                showErrorAlert('Error', 'No se pudieron cargar los datos iniciales.');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // --- FUNCIONES DE LA CALCULADORA ---

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

    const pesoTotal = pesadas.reduce((acc, curr) => acc + curr, 0);

    // --- FUNCIÓN PARA GUARDAR (ENVIAR AL BACKEND) ---

    const handleCreateLote = async (data) => {
        if (pesoTotal <= 0) {
            showErrorAlert('Atención', 'Debes ingresar al menos una pesada.');
            return;
        }

        try {
            const payload = {
                proveedorId: Number(data.proveedor),
                materiaPrimaId: Number(data.materiaPrima),
                numero_bandejas: Number(data.numero_bandejas),
                peso_bruto_kg: Number(pesoTotal.toFixed(2)),
                pesadas: pesadas 
            };

            const response = await createLote(payload);
            
            if (response.status === 'Success') {
                showSuccessAlert('¡Lote Registrado!', `Código: ${response.data.codigo}`);
                setPesadas([]);
                return true; 
            } else {
                showErrorAlert('Error', response.message || 'No se pudo registrar el lote.');
                return false;
            }
        } catch (error) {
            console.error(error);
            showErrorAlert('Error', 'Ocurrió un error inesperado al guardar.');
            return false;
        }
    };

    return {
        proveedores,
        materiasPrimas,
        loading,
        pesadas,
        pesoActual,
        setPesoActual,
        agregarPesada,
        eliminarUltimaPesada,
        pesoTotal,
        handleCreateLote
    };
};

export default useRecepcion;