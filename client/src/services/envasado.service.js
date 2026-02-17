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
        
        // Handle new paginated format: response.data.data is an object with {data: [], pagination: {}}
        const responseData = response.data.data;
        
        // Check if it's the new paginated format
        const produccionesArray = responseData?.data || responseData || [];
        
        const data = produccionesArray.map(prod => ({
            id: prod.id,
            loteId: prod.loteId, 
            loteCodigo: prod.loteCodigo,
            fechaRecepcion: '-', 
            proveedorNombre: '-', 
            materiaPrimaNombre: prod.materiaPrimaNombre,
            definicionProductoId: prod.definicionProductoId, 
            productoFinalNombre: prod.productoFinalNombre,
            estadoLote: 'Abierto', 
            ubicacionNombre: prod.ubicacionNombre,
            peso_neto_kg: prod.peso_neto_kg,
            calibre: prod.calibre || '-',
            horaIngreso: prod.horaIngreso, 
            cantidad: prod.cantidad,
            ids: prod.ids || []
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