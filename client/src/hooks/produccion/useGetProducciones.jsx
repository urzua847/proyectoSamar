import { useState, useEffect } from 'react';
import { getProducciones } from '../../services/produccion.service';

const useGetProducciones = () => {
    const [producciones, setProducciones] = useState([]);

    const fetchProducciones = async () => {
        try {
            const data = await getProducciones();
            setProducciones(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setProducciones([]);
        }
    };

    useEffect(() => {
        fetchProducciones();
    }, []);

    return { producciones, fetchProducciones };
};

export default useGetProducciones;