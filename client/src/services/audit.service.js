import axios from './root.service.js';

/**
 * Obtener todos los logs de auditoría (paginado)
 */
export async function getAuditLogs(page = 1, limit = 50) {
    try {
        const response = await axios.get(`/audit?page=${page}&limit=${limit}`);
        return response.data.data;
    } catch (error) {
        console.error("Error al obtener logs de auditoría:", error);
        return { data: [], pagination: {} };
    }
}

/**
 * Obtener historial de una entidad específica
 */
export async function getEntityAuditLogs(entityType, entityId) {
    try {
        const response = await axios.get(`/audit/entity/${entityType}/${entityId}`);
        return response.data.data;
    } catch (error) {
        console.error("Error al obtener historial de entidad:", error);
        return [];
    }
}

/**
 * Obtener acciones de un usuario
 */
export async function getUserAuditLogs(userId, limit = 50) {
    try {
        const response = await axios.get(`/audit/user/${userId}?limit=${limit}`);
        return response.data.data;
    } catch (error) {
        console.error("Error al obtener historial de usuario:", error);
        return [];
    }
}

/**
 * Obtener alertas de seguridad
 */
export async function getAlerts() {
    try {
        const response = await axios.get('/audit/alerts');
        return response.data.data;
    } catch (error) {
        console.error("Error al obtener alertas:", error);
        return [];
    }
}

/**
 * Obtener estadísticas de actividad
 */
export async function getActivityStats() {
    try {
        const response = await axios.get('/audit/stats');
        return response.data.data;
    } catch (error) {
        console.error("Error al obtener estadísticas:", error);
        return null;
    }
}

/**
 * Restaurar un lote eliminado
 */
export async function restoreLote(loteId) {
    try {
        const response = await axios.post(`/recepcion/restore/${loteId}`);
        return response.data;
    } catch (error) {
        return error.response?.data || { status: "Error", message: error.message };
    }
}

