import { useState, useEffect } from 'react';
import { createProduccion, getStockCamaras } from '../../services/envasado.service';
import { getLotesActivos } from '../../services/recepcion.service';
import { getProductos, getUbicaciones } from '../../services/catalogos.service';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

const useProduccion = () => {
    const [lotes, setLotes] = useState([]);
    const [productosCatalogo, setProductosCatalogo] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [loteSeleccionado, setLoteSeleccionado] = useState("");

    const [planilla, setPlanilla] = useState({});
    const [stockCamaras, setStockCamaras] = useState([]);

    const [loading, setLoading] = useState(true);

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

                setLotes((lotesData || []).filter(l => l.estado === true));
                setProductosCatalogo(prodData || []);
                setUbicaciones((ubicData || []).filter(u => u.tipo === 'camara'));

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

    const handleGuardarEnvasado = async (customItems = null) => {
        if (!loteSeleccionado) {
            showErrorAlert('Atención', 'Seleccione un Lote de Origen.');
            return;
        }

        let itemsParaGuardar = [];

        if (customItems && Array.isArray(customItems)) {
            itemsParaGuardar = customItems;
        } else {
            Object.keys(planilla).forEach(id => {
                const itemPlanilla = planilla[id];
                if (!itemPlanilla.peso || !itemPlanilla.ubicacion) return;

                const obtenerGramaje = (textoCalibre) => {
                    const match = (textoCalibre || '').match(/(\d+)\s*grs/i);
                    return match ? parseInt(match[1]) : 0;
                };

                const gramaje = obtenerGramaje(itemPlanilla.calibre);
                const cantidad = parseInt(itemPlanilla.cantidad_visual) || 1;

                if (gramaje > 0 && cantidad > 1) {
                    for (let i = 0; i < cantidad; i++) {
                        itemsParaGuardar.push({
                            definicionProductoId: Number(id),
                            ubicacionId: Number(itemPlanilla.ubicacion),
                            peso_neto_kg: gramaje / 1000,
                            calibre: itemPlanilla.calibre || null
                        });
                    }
                } else {
                    itemsParaGuardar.push({
                        definicionProductoId: Number(id),
                        ubicacionId: Number(itemPlanilla.ubicacion),
                        peso_neto_kg: Number(itemPlanilla.peso),
                        calibre: itemPlanilla.calibre || null
                    });
                }
            });
        }

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

            if (response && response.status === 'Success') {
                showSuccessAlert('¡Éxito!', `Se registraron ${itemsParaGuardar.length} productos.`);
                setPlanilla({});
                await fetchStock();
                return true;
            } else {
                showErrorAlert('Error', response?.message || 'No se pudo guardar.');
                return false;
            }
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || error.message || 'Fallo inesperado.';
            showErrorAlert('Error', msg);
            return false;
        }
    };

    return {
        lotes, productosCatalogo, ubicaciones,
        loteSeleccionado, setLoteSeleccionado,
        planilla, handleInputChange, handleGuardarEnvasado,
        stockCamaras,
        fetchStock,
        loading
    };
}
export default useProduccion;

