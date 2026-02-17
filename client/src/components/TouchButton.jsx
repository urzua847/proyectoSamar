import PropTypes from 'prop-types';
import './TouchButton.css';

/**
 * Botón optimizado para uso táctil (operarios con guantes, touchscreens)
 * Tamaño mínimo 44x44px según Apple HIG y Material Design
 */
const TouchButton = ({
    children,
    onClick,
    variant = 'primary',
    size = 'medium',
    disabled = false,
    type = 'button',
    icon,
    fullWidth = false,
    className = ''
}) => {
    const baseClass = 'touch-button';
    const variantClass = `touch-button--${variant}`;
    const sizeClass = `touch-button--${size}`;
    const fullWidthClass = fullWidth ? 'touch-button--full-width' : '';
    const disabledClass = disabled ? 'touch-button--disabled' : '';

    const combinedClassName = [
        baseClass,
        variantClass,
        sizeClass,
        fullWidthClass,
        disabledClass,
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={combinedClassName}
        >
            {icon && <span className="touch-button__icon">{icon}</span>}
            <span className="touch-button__text">{children}</span>
        </button>
    );
};

TouchButton.propTypes = {
    children: PropTypes.node.isRequired,
    onClick: PropTypes.func,
    variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success', 'warning']),
    size: PropTypes.oneOf(['small', 'medium', 'large']),
    disabled: PropTypes.bool,
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    icon: PropTypes.node,
    fullWidth: PropTypes.bool,
    className: PropTypes.string
};

export default TouchButton;
