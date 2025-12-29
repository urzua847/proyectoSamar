import axios from './root.service.js';

export async function getProveedores() {
    try {
        const response = await axios.get('/entidades?tipo=proveedor');
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

export async function getProductos() {
    try {
        const response = await axios.get('/productos');
        return response.data.data;
    } catch (error) {
        console.error("Error obteniendo productos:", error);
        return [];
    }
}

export async function getUbicaciones() {
    try {
        const response = await axios.get('/ubicaciones');
        return response.data.data;
    } catch (error) {
        console.error("Error obteniendo ubicaciones:", error);
        return [];
    }
}


export async function getClientes() {
    try {
        const response = await axios.get('/entidades?tipo=cliente');
        return response.data.data;
    } catch (error) {
        console.error("Error obteniendo clientes:", error);
        return [];
    }
}
