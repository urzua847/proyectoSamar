import { useState } from 'react';
import { createUser } from '@services/user.service.js';
import { showErrorAlert, showSuccessAlert } from '@helpers/sweetAlert.js';
import { formatUserData } from '@helpers/formatData.js';

const useCreateUser = (setUsers) => {
    const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);

    const handleClickCreate = () => {
        setIsCreatePopupOpen(true);
    };

    const handleCreate = async (newData) => {
        try {
            const response = await createUser(newData);
            if (response.status === 'Success') {
                showSuccessAlert('¡Creado!', 'El usuario ha sido creado correctamente.');
                setIsCreatePopupOpen(false);
                const formattedUser = formatUserData(response.data);
                setUsers(prev => [...prev, formattedUser]);
            } else {
                showErrorAlert('Error', response.message || 'No se pudo crear el usuario.');
            }
        } catch (error) {
            showErrorAlert('Error', 'Ocurrió un error inesperado.');
        }
    };

    return {
        handleClickCreate,
        handleCreate,
        isCreatePopupOpen,
        setIsCreatePopupOpen
    };
};

export default useCreateUser;