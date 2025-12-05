import axios from './root.service.js';

const createVenta = async (ventaData) => {
    try {
        const response = await axios.post('/ventas', ventaData);
        return response.data;
    } catch (error) {
        throw error;
    }
};

const getVentas = async () => {
    try {
        const response = await axios.get('/ventas');
        return response.data;
    } catch (error) {
        throw error;
    }
};

export default {
    createVenta,
    getVentas
};
