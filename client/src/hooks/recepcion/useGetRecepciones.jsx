import { useState, useEffect } from 'react';
import { getLotesActivos } from '../../services/recepcion.service';

const useGetRecepciones = () => {
    const [lotes, setLotes] = useState([]);

    const fetchLotes = async () => {
        try {
            const data = await getLotesActivos();
            setLotes(data);
        } catch (error) {
            console.error("Error al cargar lotes:", error);
            setLotes([]);
        }
    };

    useEffect(() => {
        fetchLotes();
    }, []);

    return { lotes, fetchLotes, setLotes };
};

export default useGetRecepciones;