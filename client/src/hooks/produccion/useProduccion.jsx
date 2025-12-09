import { useState, useEffect } from 'react';
import { createProduccion, getStockCamaras } from '../../services/produccion.service';
import { getLotesActivos } from '../../services/recepcion.service';
import { getProductos, getUbicaciones } from '../../services/catalogos.service';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

const useProduccion = () => {
    const [lotes, setLotes] = useState([]);
    const [productosCatalogo, setProductosCatalogo] = useState([]); 
    const [ubicaciones, setUbicaciones] = useState([]);
    const [loteSeleccionado, setLoteSeleccionado] = useState("");
    
    // Estado de la planilla y del Stock
    const [planilla, setPlanilla] = useState({});
    const [stockCamaras, setStockCamaras] = useState([]); // <-- NUEVO ESTADO

    const [loading, setLoading] = useState(true);

    // Función auxiliar para cargar el stock (la usaremos al inicio y al guardar)
    const fetchStock = async () => {
        const data = await getStockCamaras();
        setStockCamaras(data || []);
    };

    useEffect(() => {
        async function loadData() {
            try {
                const [lotesData, prodData, ubicData] = await Promise.all([
                    getLotesActivos(),
                    getProductos(),
                    getUbicaciones()
                ]);
                
                // Cargar catálogos
                setLotes((lotesData || []).filter(l => l.estado === true));
                setProductosCatalogo(prodData || []);
                setUbicaciones(ubicData || []);
                
                // Cargar Stock Inicial
                await fetchStock();

            } catch (error) {
                console.error(error);
                showErrorAlert('Error', 'Fallo al cargar datos iniciales.');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    const handleInputChange = (prodId, field, value) => {
        setPlanilla(prev => ({
            ...prev,
            [prodId]: {
                ...prev[prodId],
                [field]: value
            }
        }));
    };

    const handleGuardarTodo = async () => {
        if (!loteSeleccionado) {
            showErrorAlert('Atención', 'Seleccione un Lote de Origen.');
            return;
        }

        const itemsParaGuardar = Object.keys(planilla)
            .filter(id => planilla[id]?.peso > 0 && planilla[id]?.ubicacion)
            .map(id => ({
                definicionProductoId: Number(id),
                ubicacionId: Number(planilla[id].ubicacion),
                peso_neto_kg: Number(planilla[id].peso),
                calibre: planilla[id].calibre || null
            }));

        if (itemsParaGuardar.length === 0) {
            showErrorAlert('Atención', 'Ingrese al menos un peso y ubicación.');
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
                setPlanilla({}); 
                // setLoteSeleccionado(""); // Opcional: Mantener el lote seleccionado es más cómodo
                
                // Actualizar la tabla de stock inmediatamente
                await fetchStock(); 
            } else {
                showErrorAlert('Error', response.message || 'No se pudo guardar.');
            }
        } catch (error) {
            showErrorAlert('Error', 'Fallo inesperado.');
        }
    };

    return {
        lotes, productosCatalogo, ubicaciones,
        loteSeleccionado, setLoteSeleccionado,
        planilla, handleInputChange, handleGuardarTodo,
        stockCamaras, // Exportamos el stock
        loading
    };
};

export default useProduccion;