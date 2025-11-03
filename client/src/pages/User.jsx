import Table from '../components/Table';
import useUsers from '../hooks/users/useGetUsers';
import Search from '../components/Search';
import Popup from '../components/Popup';
import { useCallback, useState } from 'react';
import '../styles/users.css';
import useEditUser from '../hooks/users/useEditUser';
import useDeleteUser from '../hooks/users/useDeleteUser';

const Users = () => {
  const { users, fetchUsers, setUsers } = useUsers();
  const [filterRut, setFilterRut] = useState('');

  const {
    handleClickUpdate,
    handleUpdate,
    isPopupOpen,
    setIsPopupOpen,
    dataUser,
    setDataUser
  } = useEditUser(setUsers);

  const { handleDelete } = useDeleteUser(fetchUsers, setDataUser);

  const handleSelectionChange = useCallback((selectedUsers) => {
    setDataUser(selectedUsers);
  }, [setDataUser]);

  const columns = [
    { title: "Nombre", field: "nombreCompleto", width: 350 },
    { title: "Correo", field: "email", width: 300 },
    { title: "RUT", field: "rutFormateado", width: 150 },
    { title: "Rol", field: "rol", width: 150 },
    { title: "Creado", field: "createdAt", width: 150 }
  ];

  return (
    <div className='main-container'>
      <div className='table-wrapper'>
        <div className='top-table'>
          <h1 className='title-table'>Usuarios</h1>
          <div className='filter-actions'>
            <Search value={filterRut} onChange={(e) => setFilterRut(e.target.value)} placeholder={'Filtrar por RUT'} />
            <button onClick={handleClickUpdate} disabled={dataUser.length === 0}>Editar</button>
            <button className='delete-user-button' disabled={dataUser.length === 0} onClick={() => handleDelete(dataUser)}>Eliminar</button>
          </div>
        </div>
        <Table
          data={users}
          columns={columns}
          filter={filterRut}
          dataToFilter={'rutFormateado'}
          initialSortName={'nombreCompleto'}
          onSelectionChange={handleSelectionChange}
        />
      </div>
      <Popup show={isPopupOpen} setShow={setIsPopupOpen} data={dataUser} action={handleUpdate} />
    </div>
  );
};

export default Users;