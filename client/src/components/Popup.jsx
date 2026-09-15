import Form from './Form';
import '@styles/popup.css';

export default function Popup({ show, setShow, data, action, title }) {
    const userData = data && data.length > 0 ? data[0] : {};
    const isCreateMode = !userData.id;

    const handleSubmit = (formData) => {
        const nonEmptyData = Object.fromEntries(
            Object.entries(formData).filter(([_, v]) => v !== "")
        );
        action(nonEmptyData);
    };

    const patternRut = /^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7})-[\dkK]$/;

    return (
        <div>
            {show && (
                <div className="bg" onClick={() => setShow(false)}>
                    <div className="popup" onClick={e => e.stopPropagation()} style={{ padding: '0', overflow: 'hidden', maxWidth: '520px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>

                        {/* Header bar azul */}
                        <div style={{
                            background: 'linear-gradient(135deg, #003366 0%, #00509e 100%)',
                            padding: '20px 28px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <h2 style={{ color: '#fff', margin: 0, fontSize: '1.3rem', fontWeight: '700', letterSpacing: '0.3px' }}>
                                {title || "Usuario"}
                            </h2>
                            <button
                                type="button"
                                onClick={() => setShow(false)}
                                style={{
                                    background: 'rgba(255,255,255,0.15)',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '30px',
                                    height: '30px',
                                    cursor: 'pointer',
                                    fontSize: '1rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0
                                }}
                            >✕</button>
                        </div>

                        {/* Body scrollable */}
                        <div style={{ padding: '20px 28px 20px', overflowY: 'auto' }}>
                            <Form
                                title=""
                                fields={[
                                    {
                                        label: "Nombre completo",
                                        name: "nombreCompleto",
                                        defaultValue: userData.nombreCompleto || "",
                                        fieldType: 'input',
                                        type: "text",
                                        required: isCreateMode
                                    },
                                    {
                                        label: "Correo electrónico",
                                        name: "email",
                                        defaultValue: userData.email || "",
                                        fieldType: 'input',
                                        type: "email",
                                        required: isCreateMode
                                    },
                                    {
                                        label: "RUT",
                                        name: "rut",
                                        defaultValue: userData.rut || "",
                                        fieldType: 'input',
                                        type: "text",
                                        pattern: patternRut,
                                        patternMessage: "Formato RUT inválido (sin puntos)",
                                        required: isCreateMode
                                    },
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
                                    {
                                        label: isCreateMode ? "Contraseña" : "Nueva contraseña (opcional)",
                                        name: isCreateMode ? "password" : "newPassword",
                                        placeholder: "**********",
                                        fieldType: 'input',
                                        type: "password",
                                        required: isCreateMode
                                    }
                                ]}
                                onSubmit={handleSubmit}
                                buttonText={isCreateMode ? "Crear Usuario" : "Guardar Cambios"}
                                onCancel={() => setShow(false)}
                            />
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
}
