import axios from './root.service.js';

export async function createProduccion(data) {
    try {
        const response = await axios.post('/produccion', data);
        return response.data;
    } catch (error) {
        return error.response.data;
    }
}