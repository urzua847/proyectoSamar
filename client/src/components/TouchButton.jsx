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

export default TouchButton;

