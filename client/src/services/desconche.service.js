import axios from './root.service.js';

export const createDesconche = async (loteId, data) => {
    try {
        const response = await axios.post(`/desconche/${loteId}`, data);
        return response.data;
    } catch (error) {
        console.error("Error creating desconche:", error);
        throw error;
    }
};

export const getDesconcheByLote = async (loteId) => {
    try {
        const response = await axios.get(`/desconche/${loteId}`);
        return response.data;
    } catch (error) {
         // It's okay if not found, return null or handle in hook
         if (error.response && error.response.status === 404) {
             return null;
         }
         throw error;
    }
};

export const getAllDesconches = async () => {
    try {
        const response = await axios.get('/desconche');
        return response.data;
    } catch (error) {
        console.error("Error getting all desconches:", error);
        return { data: [] };
    }
};
