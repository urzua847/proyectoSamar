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
  const [selectedUserRut, setSelectedUserRut] = useState(null);

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
      // Si ya estaba seleccionado, lo deseleccionamos
      if (selectedUserRut === row.rut) {
          setSelectedUserRut(null);
          setDataUser([]); // Limpiamos para los botones
      } else {
          setSelectedUserRut(row.rut);
          setDataUser([row]); // Enviamos al hook de editar/borrar
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
          <h1 className='title-table'>Usuarios</h1>
          <div className='filter-actions'>
            <Search value={filterRut} onChange={(e) => setFilterRut(e.target.value)} placeholder={'Filtrar por RUT'} />
            
            {/* --- BOTÓN CREAR --- */}
            <button onClick={handleClickCreate} style={{backgroundColor: '#28a745', borderColor: '#28a745'}}>
                + Nuevo Usuario
            </button>
            
            {/* Botones de acción (Editar/Eliminar) - Se habilitan al seleccionar */}
            <button onClick={handleClickUpdate} disabled={!selectedUserRut}>Editar</button>
            <button className='delete-user-button' disabled={!selectedUserRut} onClick={() => handleDelete(dataUser)}>Eliminar</button>
          </div>
        </div>
        
        <Table
          columns={columns}
          data={filteredUsers}
          onRowClick={handleRowClick}
          selectedId={selectedUserRut}
        />
        
      </div>

      
      {/* Popup de Edición */}
      <Popup 
        show={isPopupOpen} 
        setShow={setIsPopupOpen} 
        data={dataUser} 
        action={handleUpdate} 
        title="Editar Usuario" // Título dinámico
      />

      {/* Popup de Creación */}
      <Popup 
        show={isCreatePopupOpen} 
        setShow={setIsCreatePopupOpen} 
        data={[]} // Data vacía para indicar modo creación
        action={handleCreate} 
        title="Crear Nuevo Usuario" // Título dinámico
      />

    </div>
  );
};

export default Users;