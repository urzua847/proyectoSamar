import { useRef, useCallback } from 'react';

/**
 * Hook personalizado para prevenir doble clic en botones y acciones críticas
 * @param {Function} callback - La función que se desea proteger contra doble clic
 * @param {number} delay - Tiempo en milisegundos para bloquear clicks posteriores (default: 300ms)
 * @returns {Function} - Función protegida que previene ejecuciones múltiples
 */
export const useDebounceClick = (callback, delay = 300) => {
    const isProcessingRef = useRef(false);

    const debouncedCallback = useCallback((...args) => {
        // Si ya está procesando, ignora el click
        if (isProcessingRef.current) {
            console.log('⚠️  Doble clic detectado y prevenido');
            return;
        }

        // Marca como procesando
        isProcessingRef.current = true;

        // Ejecuta el callback
        const result = callback(...args);

        // Reset del flag después del delay
        setTimeout(() => {
            isProcessingRef.current = false;
        }, delay);

        return result;
    }, [callback, delay]);

    return debouncedCallback;
};

export default useDebounceClick;
