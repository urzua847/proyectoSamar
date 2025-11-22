import { useState, useEffect } from 'react';
import { createLote } from '../../services/recepcion.service';
import { getProveedores, getMateriasPrimas } from '../../services/catalogos.service';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

const useRecepcion = () => {
    const [proveedores, setProveedores] = useState([]);
    const [materiasPrimas, setMateriasPrimas] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estado para la calculadora de peso
    const [pesadas, setPesadas] = useState([]); 
    const [pesoActual, setPesoActual] = useState(""); 

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
                console.error("Error cargando catálogos");
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

    const pesoTotal = pesadas.reduce((acc, curr) => acc + curr, 0);

    const handleCreateLote = async (data) => {
        if (pesoTotal <= 0) {
            showErrorAlert('Error', 'El peso bruto debe ser mayor a 0.');
            return;
        }

        try {
            const payload = {
                proveedorId: Number(data.proveedor),
                materiaPrimaId: Number(data.materiaPrima),
                peso_bruto_kg: Number(pesoTotal.toFixed(2)),
                numero_bandejas: Number(data.numero_bandejas)
            };

            const response = await createLote(payload);
            
            if (response.status === 'Success') {
                showSuccessAlert('¡Lote Registrado!', `Código: ${response.data.codigo}`);
                setPesadas([]); 
                return true; 
            } else {
                showErrorAlert('Error', response.message || 'No se pudo registrar.');
                return false;
            }
        } catch (error) {
            showErrorAlert('Error', 'Ocurrió un error inesperado.');
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