import { useState, useEffect } from 'react';
import ventaService from '../../services/venta.service';
import { getProduccion } from '../../services/produccion.service'; 
import { showSuccessAlert, showErrorAlert } from '../../helpers/sweetAlert';

const useVenta = () => {
    const [productosAgrupados, setProductosAgrupados] = useState([]);
    const [ventas, setVentas] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProductos();
        fetchVentas();
    }, []);

    const fetchProductos = async () => {
        try {
            const response = await getProduccion(); 
            if (response.data) {
                const disponibles = response.data.filter(p => p.estado === 'En Stock' && Number(p.peso_actual) > 0);
                
                // Agrupar por Definición + Calibre
                const agrupados = {};
                
                disponibles.forEach(p => {
                    const key = `${p.definicion.id}-${p.calibre || 'SC'}`;
                    if (!agrupados[key]) {
                        agrupados[key] = {
                            key,
                            definicionId: p.definicion.id,
                            nombre: p.definicion.nombre,
                            calibre: p.calibre,
                            pesoTotal: 0
                        };
                    }
                    agrupados[key].pesoTotal += Number(p.peso_actual);
                });

                setProductosAgrupados(Object.values(agrupados));
            }
        } catch (error) {
            console.error("Error al cargar productos", error);
        }
    };

    const fetchVentas = async () => {
        try {
            const response = await ventaService.getVentas();
            if (response.data) {
                setVentas(response.data);
            }
        } catch (error) {
            console.error("Error al cargar ventas", error);
        }
    };

    const handleCreateVenta = async (data) => {
        setLoading(true);
        try {
            // data.items: [{ definicionProductoId, calibre, kilos, precio_kilo }]
            await ventaService.createVenta(data);
            showSuccessAlert('Venta registrada', 'La venta se ha registrado exitosamente.');
            fetchProductos(); 
            fetchVentas();
            return true;
        } catch (error) {
            console.error(error);
            showErrorAlert('Error', 'No se pudo registrar la venta.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    return {
        productosAgrupados,
        ventas,
        loading,
        handleCreateVenta
    };
};

export default useVenta;
