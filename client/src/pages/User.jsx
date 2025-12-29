import Table from '../components/Table';
import useUsers from '../hooks/users/useGetUsers';
import Search from '../components/Search';
import Popup from '../components/Popup';
import { useCallback, useState } from 'react';
import '../styles/users.css';
import useEditUser from '../hooks/users/useEditUser';
import useDeleteUser from '../hooks/users/useDeleteUser';
import useCreateUser from '../hooks/users/useCreateUser';

const Users = () => {
  const { users, fetchUsers, setUsers } = useUsers();
  const [filterRut, setFilterRut] = useState('');

  // Estado para la selección de fila
  const [selectedUserId, setSelectedUserId] = useState(null);

  // --- HOOKS ---
  const {
    handleClickUpdate,
    handleUpdate,
    isPopupOpen,
    setIsPopupOpen,
    dataUser,
    setDataUser
  } = useEditUser(setUsers);

  const { handleDelete } = useDeleteUser(fetchUsers, setDataUser);

  // Hook para Crear Usuario
  const {
    handleClickCreate,
    handleCreate,
    isCreatePopupOpen,
    setIsCreatePopupOpen
  } = useCreateUser(setUsers);

  // --- MANEJADORES ---
  const handleRowClick = (row) => {
    if (selectedUserId === row.id) {
      setSelectedUserId(null);
      setDataUser([]);
    } else {
      setSelectedUserId(row.id);
      setDataUser([row]);
    }
  };

  const columns = [
    { header: "Nombre", accessor: "nombreCompleto" },
    { header: "Correo", accessor: "email" },
    { header: "RUT", accessor: "rutFormateado" },
    { header: "Rol", accessor: "rolFormateado" },
    { header: "Creado", accessor: "createdAt" }
  ];

  // Filtro simple
  const filteredUsers = users.filter(user =>
    user.rutFormateado.toLowerCase().includes(filterRut.toLowerCase())
  );

  return (
    <div className='main-container'>
      <div className='table-wrapper'>
        <div className='top-table'>
          <div>
            <h1 className='title-table'>Usuarios</h1>
            <p className='subtitle-table' style={{ margin: '5px 0 0 0', color: '#666' }}>Aqui gestionaremos todo con el perfil de administrador</p>
          </div>
          <div className='filter-actions'>
            <Search value={filterRut} onChange={(e) => setFilterRut(e.target.value)} placeholder={'Filtrar por RUT'} />

            {/* --- BOTÓN CREAR --- */}
            <button onClick={handleClickCreate} className='btn-new'>
              + Nuevo Usuario
            </button>

            {/* Botones de acción (Editar/Eliminar) - Se habilitan al seleccionar */}
            <button
              onClick={handleClickUpdate}
              disabled={!selectedUserId}
              className='btn-edit'
            >
              Editar
            </button>
            <button className='btn-delete' disabled={!selectedUserId} onClick={() => handleDelete(dataUser)}>Eliminar</button>
          </div>
        </div>

        <Table
          columns={columns}
          data={filteredUsers}
          onRowClick={handleRowClick}
          selectedId={selectedUserId}
        />

      </div>


      {/* Popup de Edición */}
      <Popup
        show={isPopupOpen}
        setShow={setIsPopupOpen}
        data={dataUser}
        action={handleUpdate}
        title="Editar Usuario"
      />

      {/* Popup de Creación */}
      <Popup
        show={isCreatePopupOpen}
        setShow={setIsCreatePopupOpen}
        data={[]}
        action={handleCreate}
        title="Crear Nuevo Usuario"
      />

    </div>
  );
};

export default Users;