import axios from './root.service.js';
import { format as formatTempo } from "@formkit/tempo";

// 1. Crear Producción
export async function createProduccion(data) {
    try {
        const response = await axios.post('/envasado', data);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function deleteProduccion(id) {
    try {
        const response = await axios.delete(`/envasado/${id}`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function deleteManyProduccion(ids) {
    try {
        const response = await axios.post('/envasado/delete-batch', { ids });
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

// 2. Obtener Historial 
export async function getProducciones() {
    try {
        const response = await axios.get(`/envasado?t=${Date.now()}`);
        const data = response.data.data.map(prod => ({
            id: prod.id,
            loteId: prod.loteDeOrigen?.id, 
            loteCodigo: prod.loteDeOrigen?.codigo,
            fechaRecepcion: formatTempo(prod.loteDeOrigen?.fecha_recepcion, "DD-MM-YYYY"),
            proveedorNombre: prod.loteDeOrigen?.proveedor?.nombre,
            materiaPrimaNombre: prod.loteDeOrigen?.materiaPrima?.nombre,
            definicionProductoId: prod.definicion?.id,
            productoFinalNombre: prod.definicion?.nombre,
            estadoLote: prod.loteDeOrigen?.estado ? 'Abierto' : 'Cerrado',
            ubicacionNombre: prod.ubicacion?.nombre,
            peso_neto_kg: prod.peso_neto_kg,
            calibre: prod.calibre || '-',
            fecha_produccion: prod.fecha_produccion     
        }));
        return data;
    } catch (error) {
        console.error("Error al obtener producciones:", error);
        return [];
    }
}

// 3. Obtener Stock de Cámaras 
export async function getStockCamaras() {
    try {
        const response = await axios.get('/envasado/stock/camaras');
        return response.data.data;
    } catch (error) {
        console.error("Error al obtener stock:", error);
        return [];
    }
}

export async function getResumenProduccion(loteId) {
    try {
        const response = await axios.get(`/envasado/resumen/${loteId}`);
        return response.data;
    } catch (error) {
        console.error("Error al obtener resumen de producción:", error);
        return { status: "Error", message: error.message };
    }
}