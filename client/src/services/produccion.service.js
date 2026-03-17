import axios from './root.service.js';

export const createProduccionYield = async (data) => {
    try {
        const response = await axios.post('/produccion', data);
        return { status: 'Success', data: response.data };
    } catch (error) {
        return { status: 'Error', message: error.response?.data?.message || 'Error al crear producción' };
    }
};

export const getProduccionesByLote = async (loteId) => {
    try {
        const response = await axios.get(`/produccion/historial/${loteId}`);
        return { status: 'Success', data: response.data.data };
    } catch (error) {
        return { status: 'Error', message: error.response?.data?.message || 'Error al obtener historial' };
    }
};

export const getProduccionByLote = async (loteId) => {
    try {
        const response = await axios.get(`/produccion/lote/${loteId}`);
        return { status: 'Success', data: response.data.data };
    } catch (error) {
        return { status: 'Error', message: error.response?.data?.message || 'Error al obtener producción' };
    }
};

export const updateProduccionYield = async (loteId, data) => {
    try {
        const response = await axios.put(`/produccion/lote/${loteId}`, data);
        return { status: 'Success', data: response.data };
    } catch (error) {
        return { status: 'Error', message: error.response?.data?.message || 'Error al actualizar producción' };
    }
};
