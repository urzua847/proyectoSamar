
import axios from './root.service';

export const getProductos = async () => {
    try {
        const response = await axios.get('/productos');
        return response.data;
    } catch (error) {
        return { status: "Error", message: error.message };
    }
};

export const createProducto = async (data) => {
    try {
        const response = await axios.post('/productos', data);
        return response.data;
    } catch (error) {
        return { status: "Error", message: error.response?.data?.message || error.message };
    }
};

export const updateProducto = async (id, data) => {
    try {
        const response = await axios.put(`/productos/${id}`, data);
        return response.data;
    } catch (error) {
        return { status: "Error", message: error.response?.data?.message || error.message };
    }
};

export const deleteProducto = async (id) => {
    try {
        const response = await axios.delete(`/productos/${id}`);
        return response.data;
    } catch (error) {
        return { status: "Error", message: error.response?.data?.message || error.message };
    }
};
