import { useState, useEffect } from 'react';
import { createProduccion } from '../../services/produccion.service';
import { getLotesActivos } from '../../services/recepcion.service';
import { getProductos, getUbicaciones } from '../../services/catalogos.service';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

const useProduccion = () => {
    const [lotes, setLotes] = useState([]);
    const [productosCatalogo, setProductosCatalogo] = useState([]); // Lista maestra de productos
    const [ubicaciones, setUbicaciones] = useState([]);
    const [loteSeleccionado, setLoteSeleccionado] = useState("");
    
    // Estado de la planilla: { [idProducto]: { peso: "", ubicacion: "", calibre: "" } }
    const [planilla, setPlanilla] = useState({});

    useEffect(() => {
        async function loadData() {
            try {
                const [lotesData, prodData, ubicData] = await Promise.all([
                    getLotesActivos(),
                    getProductos(),
                    getUbicaciones()
                ]);
                
                // Filtrar solo lotes ABIERTOS
                const lotesAbiertos = (lotesData || []).filter(l => l.estado === true);
                setLotes(lotesAbiertos);
                
                setProductosCatalogo(prodData || []);
                setUbicaciones(ubicData || []);
            } catch (error) {
                console.error(error);
            }
        }
        loadData();
    }, []);

    // Maneja cambios en los inputs de la tabla
    const handleInputChange = (prodId, field, value) => {
        setPlanilla(prev => ({
            ...prev,
            [prodId]: {
                ...prev[prodId],
                [field]: value
            }
        }));
    };

    // Enviar Datos
    const handleGuardarTodo = async () => {
        if (!loteSeleccionado) {
            showErrorAlert('Error', 'Seleccione un Lote de Origen.');
            return;
        }

        // Filtramos solo los productos que tengan un peso ingresado > 0
        const itemsParaGuardar = Object.keys(planilla)
            .filter(prodId => planilla[prodId]?.peso > 0 && planilla[prodId]?.ubicacion)
            .map(prodId => ({
                definicionProductoId: Number(prodId),
                ubicacionId: Number(planilla[prodId].ubicacion),
                peso_neto_kg: Number(planilla[prodId].peso),
                calibre: planilla[prodId].calibre || null
            }));

        if (itemsParaGuardar.length === 0) {
            showErrorAlert('Atención', 'Ingrese peso y ubicación para al menos un producto.');
            return;
        }

        try {
            const payload = {
                loteRecepcionId: Number(loteSeleccionado),
                items: itemsParaGuardar
            };

            const response = await createProduccion(payload);

            if (response.status === 'Success') {
                showSuccessAlert('¡Éxito!', `Se registraron ${itemsParaGuardar.length} productos.`);
                setPlanilla({}); // Limpiar planilla
                setLoteSeleccionado(""); // Limpiar lote
            } else {
                showErrorAlert('Error', response.message || 'No se pudo guardar.');
            }
        } catch (error) {
            showErrorAlert('Error', 'Fallo inesperado.');
        }
    };

    return {
        lotes,
        productosCatalogo,
        ubicaciones,
        loteSeleccionado,
        setLoteSeleccionado,
        planilla,
        handleInputChange,
        handleGuardarTodo
    };
};

export default useProduccion;