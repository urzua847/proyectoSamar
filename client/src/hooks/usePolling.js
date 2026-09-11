import { useEffect, useRef } from 'react';

/**
 * Custom hook para ejecutar una función de sincronización periódicamente (Polling).
 * 
 * @param {Function} callback - Función que se ejecutará en cada intervalo.
 * @param {number|null} delay - Tiempo en milisegundos entre ejecuciones. Si es null, se pausa.
 */
function usePolling(callback, delay) {
    const savedCallback = useRef();

    // Record the latest callback if it changes.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        // Don't schedule if no delay is specified.
        if (delay === null) {
            return;
        }

        const id = setInterval(() => {
            if (savedCallback.current) {
                savedCallback.current();
            }
        }, delay);

        return () => clearInterval(id);
    }, [delay]);
}

export default usePolling;
