import Swal from 'sweetalert2';

// Toast Notification Mixin
const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 3500,
  timerProgressBar: true,
  showCloseButton: true,
  didOpen: (toast) => {
    toast.addEventListener('mouseenter', Swal.stopTimer);
    toast.addEventListener('mouseleave', Swal.resumeTimer);
  }
});

export const showToastSuccess = (message, title = '') => {
  Toast.fire({
    icon: 'success',
    title: title ? `${title}: ${message}` : message
  });
};

export const showToastError = (message, title = '') => {
  Toast.fire({
    icon: 'error',
    title: title ? `${title}: ${message}` : message
  });
};

export const showToastWarning = (message, title = '') => {
  Toast.fire({
    icon: 'warning',
    title: title ? `${title}: ${message}` : message
  });
};

export const showToastInfo = (message, title = '') => {
  Toast.fire({
    icon: 'info',
    title: title ? `${title}: ${message}` : message
  });
};

export async function deleteDataAlert(
  title = "¿Estás seguro?",
  text = "No podrás revertir esta acción.",
  confirmButtonText = "Sí, Eliminar"
) {
  return Swal.fire({
    title,
    text,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#4b5563",
    confirmButtonText,
    cancelButtonText: "Cancelar"
  });
}

export async function confirmStrictDelete(itemName, customWarning = '') {
  return Swal.fire({
    title: "Confirmación de Eliminación",
    html: `¿Estás seguro de que deseas eliminar <strong>"${itemName}"</strong>?<br/>${customWarning ? `<span style="color: #dc2626; font-size: 0.875rem;">${customWarning}</span>` : 'Esta acción no se puede deshacer.'}`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#4b5563",
    confirmButtonText: "Sí, Eliminar Registro",
    cancelButtonText: "Cancelar",
    focusCancel: true
  });
}

export async function confirmActionAlert(title, text, confirmButtonText, confirmButtonColor = "#3b82f6", icon = "warning") {
  return Swal.fire({
    title: title,
    text: text,
    icon: icon,
    showCancelButton: true,
    confirmButtonColor: confirmButtonColor,
    cancelButtonColor: "#64748b",
    confirmButtonText: confirmButtonText,
    cancelButtonText: "Cancelar"
  });
}

export async function confirmDeleteWithDependencies(message) {
  return Swal.fire({
    title: "Confirmación de Administrador",
    text: message || "El registro tiene elementos asociados. ¿Seguro que deseas eliminarlo junto con su historial?",
    icon: "warning",
    showCancelButton: true,
    confirmButtonColor: "#dc2626",
    cancelButtonColor: "#2563eb",
    confirmButtonText: "Sí, Eliminar Todo",
    cancelButtonText: "Cancelar"
  });
}

export const showSuccessAlert = (titleMessage, message) => {
  Swal.fire({
    title: titleMessage,
    text: message,
    icon: 'success',
    confirmButtonColor: '#003366'
  });
};

export const showErrorAlert = (titleMessage, message) => {
  Swal.fire({
    title: titleMessage,
    text: message,
    icon: 'error',
    confirmButtonColor: '#003366'
  });
};