import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";

const CameraScanner = ({ onScanSuccess, onScanError }) => {
    const scannerRef = useRef(null);
    const lastScanTimeRef = useRef(0);
    const scannerId = "html5qr-code-full-region";
    const [isCameraReady, setIsCameraReady] = useState(false);
    const [cameraError, setCameraError] = useState(null);

    const onScanSuccessRef = useRef(onScanSuccess);
    const onScanErrorRef = useRef(onScanError);

    useEffect(() => {
        onScanSuccessRef.current = onScanSuccess;
        onScanErrorRef.current = onScanError;
    }, [onScanSuccess, onScanError]);

    useEffect(() => {
        let html5QrCode;
        let isMounted = true;

        const startCamera = async () => {
            if (!isMounted) return;

            html5QrCode = new Html5Qrcode(scannerId);
            scannerRef.current = html5QrCode;

            const config = { 
                fps: 10, 
                qrbox: { width: 250, height: 250 },
                formatsToSupport: [ 
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.CODE_128,
                    Html5QrcodeSupportedFormats.CODE_39
                ]
            };

            try {
                await html5QrCode.start(
                    { facingMode: "environment" }, 
                    config,
                    (decodedText, decodedResult) => {
                        const now = Date.now();
                        // Bloqueo estricto: ignorar cualquier lectura dentro de 1.5 segundos
                        if (now - lastScanTimeRef.current < 1500) return;
                        
                        lastScanTimeRef.current = now;

                        const el = document.getElementById(scannerId);
                        if(el) {
                            el.style.opacity = '0.5';
                            setTimeout(() => { el.style.opacity = '1'; }, 150);
                        }
                        
                        if (onScanSuccessRef.current) {
                            onScanSuccessRef.current(decodedText);
                        }
                    },
                    (error) => {
                        if (onScanErrorRef.current) onScanErrorRef.current(error);
                    }
                );

                if (!isMounted) {
                    html5QrCode.stop().then(() => html5QrCode.clear()).catch(console.error);
                } else {
                    setIsCameraReady(true);
                }
            } catch (err) {
                if (!isMounted) return;
                console.error("Error al iniciar cámara:", err);
                setCameraError("No se pudo acceder a la cámara. Asegúrate de dar permisos.");
            }
        };

        const timeoutId = setTimeout(startCamera, 100);

        return () => {
            isMounted = false;
            clearTimeout(timeoutId);

            if (html5QrCode) {
                if (html5QrCode.isScanning) {
                    html5QrCode.stop().then(() => {
                        html5QrCode.clear();
                    }).catch(err => {
                        console.error("Failed to stop and clear html5Qrcode. ", err);
                    });
                } else {
                    html5QrCode.clear();
                }
            }
        };
    }, []);

    return (
        <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
            {!isCameraReady && !cameraError && (
                <div style={{ 
                    position: 'absolute', top: 0, left: 0, width: '100%', height: '300px', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: '#f1f5f9', borderRadius: '12px', zIndex: 1,
                    color: '#64748b', fontWeight: 'bold'
                }}>
                    Iniciando cámara...
                </div>
            )}
            
            {cameraError && (
                <div style={{ 
                    padding: '20px', backgroundColor: '#fee2e2', color: '#991b1b', 
                    borderRadius: '12px', textAlign: 'center', fontWeight: 'bold', border: '1px solid #fecaca'
                }}>
                    {cameraError}
                </div>
            )}

            <div 
                id={scannerId} 
                style={{ 
                    width: "100%", 
                    borderRadius: "12px", 
                    overflow: "hidden",
                    border: "2px solid #cbd5e1",
                    backgroundColor: '#000',
                    minHeight: isCameraReady ? '300px' : '0'
                }}
            ></div>
            
            {/* Animación global CSS para el feedback de escaneo */}
            <style>{`
                #${scannerId} {
                    transition: opacity 0.15s ease-in-out;
                }
            `}</style>
        </div>
    );
};

export default CameraScanner;
