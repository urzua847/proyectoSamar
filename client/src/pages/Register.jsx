import { useNavigate } from 'react-router-dom';
import { register } from '../services/auth.service.js';
import Form from "../components/Form";
import useRegister from '../hooks/auth/useRegister.jsx';
import Swal from 'sweetalert2';
import '../styles/form.css';

const Register = () => {
    const navigate = useNavigate();
    const { errorEmail, errorRut, errorData, handleInputChange } = useRegister();

    const registerSubmit = async (data) => {
        try {
            const response = await register(data);
            if (response.status === 'Success') {
                Swal.fire('¡Registrado!', 'Usuario registrado exitosamente.', 'success');
                setTimeout(() => navigate('/auth'), 2000);
            } else if (response.status === 'Client error') {
                errorData(response.details);
            }
        } catch (error) {
            Swal.fire('Error', 'Ocurrió un error al registrarse.', 'error');
        }
    }

    const patternRut = /^(?:(?:[1-9]\d{0}|[1-2]\d{1})(\.\d{3}){2}|[1-9]\d{6}|[1-2]\d{7})-[\dkK]$/;

    return (
        <main className="container">
            <Form
                title="Crea tu usuario"
                fields={[
                    { name: "nombreCompleto", label: "Nombre completo", placeholder: "Juan Pérez", type: "text", required: true },
                    { name: "email", label: "Correo electrónico", placeholder: "example@gmail.cl", type: "email", required: true, errorMessageData: errorEmail, onChange: (e) => handleInputChange('email', e.target.value) },
                    { name: "rut", label: "Rut", placeholder: "12345678-9", type: "text", required: true, pattern: patternRut, patternMessage: "Formato de RUT no válido (sin puntos).", errorMessageData: errorRut, onChange: (e) => handleInputChange('rut', e.target.value) },
                    { name: "password", label: "Contraseña", placeholder: "**********", type: "password", required: true, minLength: 8 }
                ]}
                buttonText="Registrarse"
                onSubmit={registerSubmit}
                footerContent={<p>¿Ya tienes cuenta? <a href="/auth">¡Inicia sesión aquí!</a></p>}
            />
        </main>
    );
};

export default Register;