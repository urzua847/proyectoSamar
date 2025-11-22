import axios from './root.service.js';

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
        return response.data.data;
    } catch (error) {
        return error.response.data;
    }
}