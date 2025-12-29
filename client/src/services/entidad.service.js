import axios from './root.service.js';

export async function getEntidades(tipo = null) {
    try {
        let url = '/entidades';
        if (tipo) url += `?tipo=${tipo}`;
        
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        return { status: "Error", message: error.response?.data?.message || error.message };
    }
}

export async function createEntidad(data) {
    try {
        const response = await axios.post('/entidades', data);
        return response.data;
    } catch (error) {
        return { status: "Error", message: error.response?.data?.message || error.message };
    }
}

export async function updateEntidad(id, data) {
    try {
        const response = await axios.put(`/entidades/${id}`, data);
        return response.data;
    } catch (error) {
        return { status: "Error", message: error.response?.data?.message || error.message };
    }
}

export async function deleteEntidad(id) {
    try {
        const response = await axios.delete(`/entidades/${id}`);
        return response.data;
    } catch (error) {
        return { status: "Error", message: error.response?.data?.message || error.message };
    }
}
