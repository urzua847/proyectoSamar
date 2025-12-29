import axios from './root.service.js';

export const getMateriasPrimas = async () => {
    try {
        const response = await axios.get('/materiasPrimas');
        return { status: "Success", data: response.data.data };
    } catch (error) {
        return { status: "Error", message: error.response?.data?.message || error.message };
    }
};

export const createMateriaPrima = async (data) => {
    try {
        const response = await axios.post('/materiasPrimas', data);
        return { status: "Success", data: response.data.data };
    } catch (error) {
        return { status: "Error", message: error.response?.data?.message || error.message };
    }
};

export const updateMateriaPrima = async (id, data) => {
    try {
        const response = await axios.put(`/materiasPrimas/${id}`, data);
        return { status: "Success", data: response.data.data };
    } catch (error) {
        return { status: "Error", message: error.response?.data?.message || error.message };
    }
};

export const deleteMateriaPrima = async (id) => {
    try {
        const response = await axios.delete(`/materiasPrimas/${id}`);
        return response.data; 
    } catch (error) {
        return { status: "Error", message: error.response?.data?.message || error.message };
    }
};
