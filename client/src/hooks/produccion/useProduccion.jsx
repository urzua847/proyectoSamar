import { useState, useEffect } from 'react';
import { createProduccion, getStockCamaras } from '../../services/produccion.service';
import { createDesconche, getDesconcheByLote } from '../../services/desconche.service';
import { getLotesActivos } from '../../services/recepcion.service';
import { getProductos, getUbicaciones } from '../../services/catalogos.service';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

const useProduccion = () => {
    const [lotes, setLotes] = useState([]);
    const [productosCatalogo, setProductosCatalogo] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [loteSeleccionado, setLoteSeleccionado] = useState("");

    // Estado para Desconche (Etapa 1)
    const [desconche, setDesconche] = useState({});

    // Estado de la planilla y del Stock (Etapa 2)
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
                // Filter only for 'camara'
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

    // Cargar desconches al seleccionar lote
    useEffect(() => {
        if (!loteSeleccionado) {
            setDesconche({});
            return;
        }
        async function loadDesconche() {
            try {
                const existing = await getDesconcheByLote(loteSeleccionado);
                if (existing && existing.data) {
                    setDesconche({
                        "Carne Blanca": existing.data.peso_carne_blanca,
                        "Pinzas": existing.data.peso_pinzas,
                        // Cargar observaciones si existen
                        "obs_Carne Blanca": existing.data.observacion, // Asumimos un solo campo de observación general por ahora o mapped
                        "obs_Pinzas": existing.data.observacion
                    });
                } else {
                    setDesconche({});
                }
            } catch (error) {
                console.error("Error loading desconche:", error);
            }
        }
        loadDesconche();
    }, [loteSeleccionado]);


    // ------ Lógica Desconche (Etapa 1) ------
    const handleDesconcheChange = (key, value) => {
        setDesconche(prev => ({ ...prev, [key]: value }));
    };

    const guardarRendimiento = async () => {
        if (!loteSeleccionado) return showErrorAlert('Error', 'Seleccione un Lote');

        try {
            // Concatenar observaciones si hay múltiples inputs
            const obs1 = desconche["obs_Carne Blanca"] || "";
            const obs2 = desconche["obs_Pinzas"] || "";
            const observaciones = [obs1, obs2].filter(Boolean).join(" | ");

            const payload = {
                peso_carne_blanca: Number(desconche["Carne Blanca"] || 0),
                peso_pinzas: Number(desconche["Pinzas"] || 0),
                observacion: observaciones
            };

            await createDesconche(loteSeleccionado, payload);
            showSuccessAlert('Exito', 'Rendimiento guardado correctamente');
        } catch (error) {
            console.error(error);
            showErrorAlert('Error', error.response?.data?.message || 'Error al guardar desconche');
        }
    };


    // ------ Lógica Envasado (Etapa 2) ------
    const handleInputChange = (prodId, field, value) => {
        setPlanilla(prev => ({
            ...prev,
            [prodId]: {
                ...prev[prodId],
                [field]: value
            }
        }));
    };

    const handleGuardarEnvasado = async () => {
        if (!loteSeleccionado) {
            showErrorAlert('Atención', 'Seleccione un Lote de Origen.');
            return;
        }

        const itemsParaGuardar = [];

        Object.keys(planilla).forEach(id => {
            const itemPlanilla = planilla[id];
            if (!itemPlanilla.peso || !itemPlanilla.ubicacion) return;

            // Encontrar producto para verificar si es por unidades
            // (Replicamos lógica de gramaje)
            const obtenerGramaje = (textoCalibre) => {
                const match = (textoCalibre || '').match(/(\d+)\s*grs/i);
                return match ? parseInt(match[1]) : 0;
            };

            const gramaje = obtenerGramaje(itemPlanilla.calibre);
            const cantidad = parseInt(itemPlanilla.cantidad_visual) || 1;

            if (gramaje > 0 && cantidad > 1) {
                // Es por UNIDADES: Generar N items
                for (let i = 0; i < cantidad; i++) {
                    itemsParaGuardar.push({
                        definicionProductoId: Number(id),
                        ubicacionId: Number(itemPlanilla.ubicacion),
                        peso_neto_kg: gramaje / 1000,
                        calibre: itemPlanilla.calibre || null
                    });
                }
            } else {
                // Es AL BARRER o 1 Unidad: Generar 1 item con peso total
                itemsParaGuardar.push({
                    definicionProductoId: Number(id),
                    ubicacionId: Number(itemPlanilla.ubicacion),
                    peso_neto_kg: Number(itemPlanilla.peso),
                    calibre: itemPlanilla.calibre || null
                });
            }
        });

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

            // Correct check matching backend "Success"
            if (response && response.status === 'Success') {
                showSuccessAlert('¡Éxito!', `Se registraron ${itemsParaGuardar.length} productos.`);
                setPlanilla({});
                await fetchStock();
            } else {
                showErrorAlert('Error', response?.message || 'No se pudo guardar.');
            }
        } catch (error) {
            showErrorAlert('Error', 'Fallo inesperado.');
        }
    };

    return {
        lotes, productosCatalogo, ubicaciones,
        loteSeleccionado, setLoteSeleccionado,
        desconche, handleDesconcheChange, guardarRendimiento,
        planilla, handleInputChange, handleGuardarEnvasado,
        stockCamaras,
        fetchStock,
        loading
    };
};

export default useProduccion;
