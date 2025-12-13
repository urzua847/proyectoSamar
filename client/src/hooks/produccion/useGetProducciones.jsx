import { useState, useEffect } from 'react';
import { getProducciones } from '../../services/produccion.service';
import { getAllDesconches } from '../../services/desconche.service';
import { format as formatTempo } from "@formkit/tempo";

const useGetProducciones = () => {
    const [producciones, setProducciones] = useState([]);
    const [desconches, setDesconches] = useState([]);

    const fetchProducciones = async () => {
        try {
            const data = await getProducciones();
            const formatted = (Array.isArray(data) ? data : []).map(p => ({
                ...p,
                // Assuming fecha_produccion is the relevant timestamp
                horaIngreso: p.fecha_produccion ? formatTempo(p.fecha_produccion, "HH:mm DD-MM") : '-',
            }));

            // Grouping Logic
            const groups = {};
            formatted.forEach(item => {
                // Key: LoteID + Producto + Calibre + Hora
                const key = `${item.loteId}-${item.productoFinalNombre}-${item.calibre}-${item.horaIngreso}`;

                if (!groups[key]) {
                    groups[key] = {
                        ...item,
                        cantidad: 1,
                        peso_neto_kg: Number(item.peso_neto_kg), // Sum accumulator
                        ids: [item.id] // Array of IDs to delete
                    };
                } else {
                    groups[key].cantidad += 1;
                    groups[key].peso_neto_kg += Number(item.peso_neto_kg);
                    groups[key].ids.push(item.id);
                }
            });

            // Convert back to array
            const groupedArray = Object.values(groups).map(g => ({
                ...g,
                peso_neto_kg: g.peso_neto_kg.toFixed(2), // Format final sum
                cantidad: g.cantidad // New field
            })).sort((a, b) => b.id - a.id); // Sort by ID desc (approx)

            setProducciones(groupedArray);
        } catch (error) {
            console.error(error);
            setProducciones([]);
        }
    };

    const fetchDesconches = async () => {
        try {
            const result = await getAllDesconches();
            const data = Array.isArray(result?.data) ? result.data : [];

            // Format for table
            const formatted = data.map(d => ({
                id: d.id,
                loteCodigo: d.lote?.codigo,
                proveedorNombre: d.lote?.proveedor?.nombre,
                peso_carne_blanca: d.peso_carne_blanca,
                peso_pinzas: d.peso_pinzas,
                peso_total: d.peso_total, // New field from DB
                observacion: d.observacion,
                fecha: d.createdAt ? formatTempo(d.createdAt, "DD-MM-YYYY HH:mm") : '-'
            }));

            setDesconches(formatted);
        } catch (error) {
            console.error(error);
            setDesconches([]);
        }
    };

    const fetchAll = async () => {
        await Promise.all([fetchProducciones(), fetchDesconches()]);
    };

    useEffect(() => {
        fetchAll();
    }, []);

    return { producciones, desconches, fetchProducciones, fetchDesconches, fetchAll };
};

export default useGetProducciones;
