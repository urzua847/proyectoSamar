import Swal from 'sweetalert2';

export async function deleteDataAlert() {
  return Swal.fire({
    title: "¿Estás seguro?",
    text: "No podrás revertir esto",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#3085d6",
    cancelButtonColor: "#d33",
    confirmButtonText: "Eliminar"
  })
}

export async function confirmDeleteWithDependencies(message) {
    return Swal.fire({
      title: "Confirmación de Administrador",
      text: message || "El lote tiene registros asociados. ¿Seguro que deseas eliminarlo junto con TODO su historial (Producción/Stock)?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, Eliminar TODO"
    });
}

export const showSuccessAlert = (titleMessage, message) => {
  Swal.fire(
    titleMessage,
    message,
    'success'
  );
};

export const showErrorAlert = (titleMessage, message) => {
  Swal.fire(
    titleMessage,
    message,
    'error'
  );
};