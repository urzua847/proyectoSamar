import axios from './root.service.js';
import { format as formatTempo } from "@formkit/tempo";

// 1. Crear Producción
export async function createProduccion(data) {
    try {
        const response = await axios.post('/produccion', data);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function deleteProduccion(id) {
    try {
        const response = await axios.delete(`/produccion/${id}`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function deleteManyProduccion(ids) {
    try {
        const response = await axios.post('/produccion/delete-batch', { ids });
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

// 2. Obtener Historial (Esta es la que faltaba)
export async function getProducciones() {
    try {
        const response = await axios.get(`/produccion?t=${Date.now()}`);
        // Formateamos los datos para que la tabla los entienda fácil
        const data = response.data.data.map(prod => ({
            id: prod.id,
            loteId: prod.loteDeOrigen?.id, // Needed for Traslado
            loteCodigo: prod.loteDeOrigen?.codigo,
            fechaRecepcion: formatTempo(prod.loteDeOrigen?.fecha_recepcion, "DD-MM-YYYY"),
            proveedorNombre: prod.loteDeOrigen?.proveedor?.nombre,
            materiaPrimaNombre: prod.loteDeOrigen?.materiaPrima?.nombre,
            definicionProductoId: prod.definicion?.id, // Needed for Traslado
            productoFinalNombre: prod.definicion?.nombre,
            estadoLote: prod.loteDeOrigen?.estado ? 'Abierto' : 'Cerrado',
            ubicacionNombre: prod.ubicacion?.nombre,
            peso_neto_kg: prod.peso_neto_kg,
            calibre: prod.calibre || '-',
            fecha_produccion: prod.fecha_produccion // Include raw date for hook to format
        }));
        return data;
    } catch (error) {
        console.error("Error al obtener producciones:", error);
        return [];
    }
}

// 3. Obtener Stock de Cámaras (También necesaria)
export async function getStockCamaras() {
    try {
        const response = await axios.get('/produccion/stock/camaras');
        return response.data.data;
    } catch (error) {
        console.error("Error al obtener stock:", error);
        return [];
    }
}