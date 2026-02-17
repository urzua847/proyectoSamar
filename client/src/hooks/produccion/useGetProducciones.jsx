import { useState, useEffect } from 'react';
import { getProducciones } from '../../services/envasado.service';
import { getLotesActivos } from '../../services/recepcion.service';
import { format as formatTempo } from "@formkit/tempo";

const useGetProducciones = () => {
    const [producciones, setProducciones] = useState([]);
    const [desconches, setDesconches] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchProducciones = async () => {
        try {
            const data = await getProducciones();
            // Backend now returns data already grouped and formatted
            setProducciones(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setProducciones([]);
        }
    };

    const fetchDesconches = async () => {
        try {
            const result = await getLotesActivos();

            const productionLotes = result.filter(l => l.en_proceso_produccion === true);

            const formatted = productionLotes.map(d => ({
                id: d.id,
                loteCodigo: d.codigo,
                materiaPrimaNombre: d.materiaPrimaNombre,
                proveedorNombre: d.proveedorNombre,
                peso_carne_blanca: d.peso_carne_blanca,
                peso_pinzas: d.peso_pinzas,
                peso_total: d.peso_total,
                observacion: d.observacion,
                fecha: d.fecha_inicio_produccion ? formatTempo(d.fecha_inicio_produccion, "DD-MM-YYYY HH:mm") : '-'
            }));

            setDesconches(formatted);
        } catch (error) {
            console.error(error);
            setDesconches([]);
        }
    };

    const fetchAll = async () => {
        setLoading(true);
        await Promise.all([fetchProducciones(), fetchDesconches()]);
        setLoading(false);
    };

    useEffect(() => {
        fetchAll();
    }, []);

    return { producciones, desconches, fetchProducciones, fetchDesconches, fetchAll, loading };
};

export default useGetProducciones;
