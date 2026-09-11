import React from 'react';
import './ErrorBoundary.css';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("ErrorBoundary caught an error", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            // Fallback UI
            return (
                <div className="error-boundary-container">
                    <div className="error-boundary-content">
                        <h2>¡Oops! Algo salió mal.</h2>
                        <p>Ha ocurrido un error inesperado en esta sección de la aplicación.</p>
                        
                        <button 
                            className="btn-retry"
                            onClick={() => window.location.reload()}
                        >
                            Recargar página
                        </button>

                        <details className="error-details">
                            <summary>Detalles técnicos para soporte</summary>
                            <pre>{this.state.error && this.state.error.toString()}</pre>
                            <br />
                            <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                        </details>
                    </div>
                </div>
            );
        }

        return this.props.children; 
    }
}

export default ErrorBoundary;
