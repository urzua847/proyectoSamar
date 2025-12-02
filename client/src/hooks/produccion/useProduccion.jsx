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

    // 2. Lógica cuando cambia el producto seleccionado
    const handleProductChange = (e, setValue) => {
        const prodId = Number(e.target.value);
        setValue('producto', prodId); 
        
        // Busca el producto completo para ver sus calibres
        const prod = productos.find(p => p.id === prodId);
        setProductoSeleccionado(prod);

        if (prod && prod.calibres) {
            const lista = Array.isArray(prod.calibres) ? prod.calibres : prod.calibres.split(',');
            setCalibresDisponibles(lista);
        } else {
            setCalibresDisponibles([]);
        }        
        setValue('calibre', ''); 
    };

    // 3. Enviar al Backend
    const handleCreateProduccion = async (data) => {
        try {
            const payload = {
                loteRecepcionId: Number(data.loteOrigen),
                definicionProductoId: Number(data.producto),
                ubicacionId: Number(data.ubicacion),
                peso_neto_kg: Number(data.peso),
                calibre: data.calibre || null 
            };

            const response = await createProduccion(payload);

            if (response.status === 'Success') {
                showSuccessAlert('¡Producción Guardada!', 'El registro se ha creado exitosamente.');

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
        calibresDisponibles,
        productoSeleccionado,
        loading,
        handleProductChange, 
        handleCreateProduccion
    };
};

export default useProduccion;