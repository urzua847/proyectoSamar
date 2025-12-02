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
        const data = response.data.data.map(lote => ({
            ...lote,
            fechaFormateada: formatTempo(lote.fecha_recepcion, "DD-MM-YYYY HH:mm"),
            proveedorNombre: lote.proveedor?.nombre,
            materiaPrimaNombre: lote.materiaPrima?.nombre,
            estadoTexto: lote.estado ? 'Abierto' : 'Cerrado',
            // --- NUEVO CAMPO CALCULADO ---
            tieneProduccion: lote.productosTerminados && lote.productosTerminados.length > 0
            // -----------------------------
        }));
        return data;
    } catch (error) {
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

export async function deleteLote(id) {
    try {
        const response = await axios.delete(`/recepcion/${id}`);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}