import { useState, useEffect } from 'react';
import { getUsers } from '@services/user.service.js';

const useUsers = () => {
    const [users, setUsers] = useState([]);

    const fetchUsers = async () => {
        try {
            const response = await getUsers();
            if (!response || response.length === 0) {
                setUsers([]);
                return;
            }
            // Filtrar al usuario logueado para que no aparezca en la tabla
            const loggedUserRut = JSON.parse(sessionStorage.getItem('usuario'))?.rut;
            const filteredData = response.filter(user => user.rut !== loggedUserRut);
            setUsers(filteredData);
        } catch (error) {
            console.error('[useGetUsers] Error inesperado:', error);
            setUsers([]);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    return { users, fetchUsers, setUsers };
};

export default useUsers;