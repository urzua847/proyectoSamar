import './TouchInput.css';

/**
 * Input optimizado para uso táctil
 * Tamaño de fuente más grande, padding generoso para touchscreens
 */
const TouchInput = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    disabled = false,
    required = false,
    error,
    helperText,
    icon,
    fullWidth = false,
    min,
    max,
    step,
    name,
    id
}) => {
    const inputId = id || name || `input-${Math.random().toString(36).substr(2, 9)}`;

    return (
        <div className={`touch-input-wrapper ${fullWidth ? 'touch-input-wrapper--full-width' : ''}`}>
            {label && (
                <label htmlFor={inputId} className="touch-input__label">
                    {label}
                    {required && <span className="touch-input__required">*</span>}
                </label>
            )}

            <div className={`touch-input-container ${error ? 'touch-input-container--error' : ''}`}>
                {icon && <span className="touch-input__icon">{icon}</span>}

                <input
                    id={inputId}
                    name={name}
                    type={type}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    min={min}
                    max={max}
                    step={step}
                    className={`touch-input ${icon ? 'touch-input--with-icon' : ''}`}
                />
            </div>

            {(error || helperText) && (
                <div className={`touch-input__helper ${error ? 'touch-input__helper--error' : ''}`}>
                    {error || helperText}
                </div>
            )}
        </div>
    );
};

export default TouchInput;

