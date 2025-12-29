import { useState } from 'react';
import { updateLote, deleteLote } from '../../services/recepcion.service';
import { showSuccessAlert, showErrorAlert, deleteDataAlert, confirmDeleteWithDependencies } from '../../helpers/sweetAlert';

const useEditRecepcion = (setLotes, fetchLotes) => {
    const [dataLote, setDataLote] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const handleEditClick = () => {
        if (dataLote) {
            setIsPopupOpen(true);
        }
    };

    const handleUpdate = async (dataForm) => {
        if (!dataLote?.id) return;

        try {
            const payload = {
                proveedorId: Number(dataForm.proveedor),
                materiaPrimaId: Number(dataForm.materiaPrima),
                numero_bandejas: Number(dataForm.numero_bandejas),
                peso_bruto_kg: Number(dataForm.peso_bruto_kg),
                pesadas: dataForm.pesadas,
                peso_carne_blanca: Number(dataForm.peso_carne_blanca || 0),
                peso_pinzas: Number(dataForm.peso_pinzas || 0),
                peso_total_producido: Number(dataForm.peso_carne_blanca || 0) + Number(dataForm.peso_pinzas || 0),
                observacion_produccion: dataForm.observacion_produccion
            };

            const response = await updateLote(dataLote.id, payload);

            if (response.status === 'Success') {
                showSuccessAlert('Actualizado', 'Lote modificado correctamente');
                setIsPopupOpen(false);

                await fetchLotes();

                setDataLote(null);
            } else {
                showErrorAlert('Error', response.message || 'No se pudo actualizar.');
            }
        } catch (error) {
            console.error(error);
            showErrorAlert('Error', 'Ocurrió un error inesperado.');
        }
    };

    const handleDelete = async () => {
        if (!dataLote) return;

        try {
            const result = await deleteDataAlert();
            if (result.isConfirmed) {
                const response = await deleteLote(dataLote.id, false);

                if (response.status === 'Success') {
                    showSuccessAlert('Eliminado', 'Lote eliminado correctamente');
                    await fetchLotes();
                    setDataLote(null);
                } else {
                    const isDependencyError = response.message?.includes("confirmación de Administrador");

                    if (isDependencyError) {
                        const confirmResult = await confirmDeleteWithDependencies(response.message);
                        if (confirmResult.isConfirmed) {
                            const forceResponse = await deleteLote(dataLote.id, true);
                            if (forceResponse.status === 'Success') {
                                showSuccessAlert('Eliminado', 'Lote y sus dependencias eliminados correctamente');
                                await fetchLotes();
                                setDataLote(null);
                            } else {
                                showErrorAlert('Error', forceResponse.message || 'No se pudo eliminar forzosamente.');
                            }
                        }
                    } else {
                        showErrorAlert('Error', response.message || 'No se pudo eliminar.');
                    }
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