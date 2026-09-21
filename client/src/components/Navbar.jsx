import { useState } from 'react';
import { NavLink, useNavigate } from "react-router-dom";
import { logout } from '../services/auth.service.js';
import '../styles/navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(sessionStorage.getItem('usuario'));
    const userRole = user?.rol;
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async (event) => {
        event.preventDefault();
        await logout();
        navigate('/auth', { replace: true });
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    return (
        <nav className="navbar">
            <div className="nav-logo">
                R.V. Inversiones
            </div>
            
            <div className={`hamburger ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
            </div>

            {isMenuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}

            <div className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
                <ul>
                    <li><NavLink to="/home" onClick={closeMenu}>Inicio</NavLink></li>

                    {userRole === 'administrador' && (
                        <li><NavLink to="/panelDeControl" onClick={closeMenu}>Panel de control</NavLink></li>
                    )}

                    {(userRole === 'administrador' || userRole === 'operario') && (
                        <li><NavLink to="/recepcion" onClick={closeMenu}>Recepción MP</NavLink></li>
                    )}

                    {(userRole === 'administrador' || userRole === 'operario') && (
                        <li><NavLink to="/camaras" onClick={closeMenu}>Cámaras</NavLink></li>
                    )}
                    {(userRole === 'administrador' || userRole === 'operario') && (
                        <li><NavLink to="/contenedores" onClick={closeMenu}>Contenedores</NavLink></li>
                    )}

                    <li><a href="/auth" onClick={handleLogout}>Cerrar sesión</a></li>
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;