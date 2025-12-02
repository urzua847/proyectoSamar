import { useState } from 'react';
import { updateLote, deleteLote } from '../../services/recepcion.service';
import { showSuccessAlert, showErrorAlert, deleteDataAlert } from '../../helpers/sweetAlert';

const useEditRecepcion = (setLotes, fetchLotes) => {
    const [dataLote, setDataLote] = useState(null); // Lote seleccionado
    const [isPopupOpen, setIsPopupOpen] = useState(false); // Control del popup

    // Abrir el popup solo si hay un lote seleccionado
    const handleEditClick = () => {
        if (dataLote) {
            setIsPopupOpen(true);
        }
    };

    // Función para guardar los cambios (Update)
    const handleUpdate = async (dataForm) => {
        if (!dataLote?.id) return;

        try {
            // Preparamos el objeto para enviar al backend
            const payload = {
                proveedorId: Number(dataForm.proveedor),
                materiaPrimaId: Number(dataForm.materiaPrima),
                numero_bandejas: Number(dataForm.numero_bandejas),
                peso_bruto_kg: Number(dataForm.peso_bruto_kg),
                pesadas: dataForm.pesadas // Array de pesadas
            };

            const response = await updateLote(dataLote.id, payload);

            if (response.status === 'Success') {
                showSuccessAlert('Actualizado', 'Lote modificado correctamente');
                setIsPopupOpen(false);
                
                // Opción A: Recargar todo desde el servidor (Más seguro)
                await fetchLotes(); 
                
                // Opción B: Actualizar localmente (Más rápido visualmente)
                // setLotes(prev => prev.map(l => l.id === response.data.id ? response.data : l));

                setDataLote(null); // Deseleccionar
            } else {
                showErrorAlert('Error', response.message || 'No se pudo actualizar.');
            }
        } catch (error) {
            console.error(error);
            showErrorAlert('Error', 'Ocurrió un error inesperado.');
        }
    };

    // Función para eliminar (Delete)
    const handleDelete = async () => {
        if (!dataLote) return;

        try {
            const result = await deleteDataAlert();
            if (result.isConfirmed) {
                const response = await deleteLote(dataLote.id);
                
                if (response.status === 'Success') {
                    showSuccessAlert('Eliminado', 'Lote eliminado correctamente');
                    await fetchLotes(); // Recargar la tabla
                    setDataLote(null); // Limpiar selección
                } else {
                    showErrorAlert('Error', response.message || 'No se pudo eliminar.');
                }
            }
        } catch (error) {
            console.error(error);
            showErrorAlert('Error', 'Ocurrió un error al intentar eliminar.');
        }
    };

    return { 
        dataLote, 
        setDataLote, 
        isPopupOpen, 
        setIsPopupOpen, 
        handleEditClick, 
        handleUpdate, 
        handleDelete 
    };
};

export default useEditRecepcion;