import { useState, useEffect } from 'react';
import { createProduccion } from '../../services/produccion.service';
import { getLotesActivos } from '../../services/recepcion.service';
import { getProductos, getUbicaciones } from '../../services/catalogos.service';
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

const useProduccion = () => {
    const [lotes, setLotes] = useState([]);
    const [productos, setProductos] = useState([]);
    const [ubicaciones, setUbicaciones] = useState([]);
    const [calibresDisponibles, setCalibresDisponibles] = useState([]);
    const [productoSeleccionado, setProductoSeleccionado] = useState(null);

    const [loading, setLoading] = useState(true);

    // 1. Cargar todos los catálogos al inicio
    useEffect(() => {
        async function loadData() {
            try {
                const [lotesData, prodData, ubicData] = await Promise.all([
                    getLotesActivos(),
                    getProductos(),
                    getUbicaciones()
                ]);
                setLotes(lotesData || []);
                setProductos(prodData || []);
                setUbicaciones(ubicData || []);
            } catch (error) {
                console.error("Error cargando datos:", error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    // 3. Enviar al Backend (Bulk)
    const handleCreateProduccion = async (data) => {
        try {
            // data espera ser: { loteRecepcionId: 1, items: [{ definicionProductoId: 1, peso_neto_kg: 10, ... }] }
            const payload = {
                loteRecepcionId: Number(data.loteOrigen),
                items: data.items.map(item => ({
                    definicionProductoId: Number(item.productoId),
                    ubicacionId: Number(item.ubicacionId),
                    peso_neto_kg: Number(item.peso),
                    calibre: item.calibre || null
                }))
            };

            const response = await createProduccion(payload);

            if (response.status === 'Success') {
                showSuccessAlert('¡Producción Guardada!', 'Los registros se han creado exitosamente.');
                return true;
            } else {
                showErrorAlert('Error', response.message || 'No se pudo registrar.');
                return false;
            }
        } catch (error) {
            showErrorAlert('Error', 'Error inesperado.');
            return false;
        }
    };

    return {
        lotes,
        productos,
        ubicaciones,
        loading,
        handleCreateProduccion
    };
};

export default useProduccion;