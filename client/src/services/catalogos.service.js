import axios from './root.service.js';

export async function getProveedores() {
    try {
        const response = await axios.get('/proveedores');
        return response.data.data;
    } catch (error) {
        console.error("Error obteniendo proveedores:", error);
        return [];
    }
}

export async function getMateriasPrimas() {
    try {
        const response = await axios.get('/materiasPrimas');
        return response.data.data;
    } catch (error) {
        console.error("Error obteniendo materias primas:", error);
        return [];
    }
}