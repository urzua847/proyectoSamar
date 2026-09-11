import axios from './root.service.js';
import { format as formatTempo } from "@formkit/tempo";

export async function createLote(data) {
    try {
        const response = await axios.post('/recepcion', data);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function getLotesActivos() {
    try {
        const response = await axios.get('/recepcion/activos');
        
        // Handle new paginated format
        const responseData = response.data.data;
        const lotesArray = responseData?.data || responseData || [];
        
        const data = lotesArray.map(lote => ({
            ...lote,
            fechaFormateada: formatTempo(lote.fecha_recepcion, "DD-MM-YYYY HH:mm"),
            proveedorNombre: lote.proveedor?.nombre,
            materiaPrimaNombre: lote.materiaPrima?.nombre,
            estadoTexto: lote.estado ? 'Abierto' : 'Cerrado',
            tieneProduccion: (lote.productosTerminados && lote.productosTerminados.length > 0) || lote.en_proceso_produccion,
            peso_carne_blanca: lote.peso_carne_blanca,
            peso_pinzas: lote.peso_pinzas,
            peso_total: lote.peso_total_producido,
            observacion: lote.observacion_produccion,
            en_proceso_produccion: lote.en_proceso_produccion
        }));
        return data;
    } catch (error) {
        return [];
    }
}

export async function getRecepcionesByEntidad(entidadId) {
    try {
        const response = await axios.get(`/recepcion/entidad/${entidadId}`);
        return response.data.data.map(lote => ({
            ...lote,
             fechaFormateada: formatTempo(lote.fecha_recepcion, "DD-MM-YYYY HH:mm"),
             proveedorNombre: lote.proveedor?.nombre,
             materiaPrimaNombre: lote.materiaPrima?.nombre,
             estadoTexto: lote.estado ? 'Abierto' : 'Cerrado',
             peso_carne_blanca: lote.peso_carne_blanca || 0,
             peso_pinzas: lote.peso_pinzas || 0,
             peso_total: lote.peso_total_producido || 0
        }));
    } catch (error) {
        console.error("Error fetching recepciones by entidad:", error);
        return [];
    }
}

export async function updateLote(id, data) {
    try {
        const response = await axios.patch(`/recepcion/${id}`, data);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function deleteLote(id, force = false) {
    try {
        const response = await axios.delete(`/recepcion/${id}${force ? '?force=true' : ''}`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function getLoteById(id) {
    try {
        const response = await axios.get(`/recepcion/${id}`);
        const lote = response.data.data;
        return {
            ...lote,
            fechaFormateada: formatTempo(lote.fecha_recepcion, "DD-MM-YYYY HH:mm"),
            proveedorNombre: lote.proveedor?.nombre,
            materiaPrimaNombre: lote.materiaPrima?.nombre,
            estadoTexto: lote.estado ? 'Abierto' : 'Cerrado',
            tieneProduccion: (lote.productosTerminados && lote.productosTerminados.length > 0) || lote.en_proceso_produccion,
            peso_carne_blanca: lote.peso_carne_blanca,
            peso_pinzas: lote.peso_pinzas,
            peso_total: lote.peso_total_producido,
            observacion: lote.observacion_produccion,
            en_proceso_produccion: lote.en_proceso_produccion
        };
    } catch (error) {
        return null;
    }
}

export async function getRecepciones() {
    try {
        const response = await axios.get('/recepcion'); 
        
        // Handle new paginated format
        const responseData = response.data.data;
        const lotesArray = responseData?.data || responseData || [];
        
        return lotesArray.map(lote => ({
            ...lote,
             fechaFormateada: formatTempo(lote.fecha_recepcion, "DD-MM-YYYY HH:mm"),
             proveedorNombre: lote.proveedor?.nombre,
             materiaPrimaNombre: lote.materiaPrima?.nombre,
             estadoTexto: lote.estado ? 'Abierto' : 'Cerrado',
             peso_total: lote.peso_total_producido
        }));
    } catch (error) {
        return [];
    }
}