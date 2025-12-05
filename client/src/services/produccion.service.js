import axios from './root.service.js';

export async function createProduccion(data) {
    try {
        const response = await axios.post('/produccion', data);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}

export async function getProduccion() {
    try {
        const response = await axios.get('/produccion');
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}