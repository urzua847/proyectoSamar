import Form from './Form';
import '@styles/popup.css';

export default function Popup({ show, setShow, data, action }) {
    const userData = data && data.length > 0 ? data[0] : {};

    const handleSubmit = (formData) => {
        const nonEmptyData = Object.fromEntries(
            Object.entries(formData).filter(([_, v]) => v !== "")
        );
        action(nonEmptyData);
    };

    const patternRut = /^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7})-[\dkK]$/;

    return (
        <div>
            { show && (
            <div className="bg">
                <div className="popup">
                    <button className='close' onClick={() => setShow(false)}>X</button>
                    <Form
                        title="Editar usuario"
                        fields={[
                            { label: "Nombre completo", name: "nombreCompleto", defaultValue: userData.nombreCompleto || "", fieldType: 'input', type: "text" },
                            { label: "Correo electrónico", name: "email", defaultValue: userData.email || "", fieldType: 'input', type: "email" },
                            { label: "RUT", name: "rut", defaultValue: userData.rut || "", fieldType: 'input', type: "text", pattern: patternRut, patternMessage: "Formato RUT inválido (sin puntos)." },
                            {
                                label: "Rol",
                                name: "rol",
                                fieldType: 'select',
                                options: [
                                    { value: 'administrador', label: 'Administrador' },
                                    { value: 'operario', label: 'Operario' },
                                    { value: 'usuario', label: 'Usuario' },
                                ],
                                required: true,
                                defaultValue: userData.rol || "",
                            },
                            { label: "Nueva contraseña (opcional)", name: "newPassword", placeholder: "**********", fieldType: 'input', type: "password" }
                        ]}
                        onSubmit={handleSubmit}
                        buttonText="Guardar Cambios"
                    />
                </div>
            </div>
            )}
        </div>
    );
}