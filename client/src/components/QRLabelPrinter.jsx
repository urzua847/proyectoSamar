import React from 'react';
import { QRCodeSVG } from 'qrcode.react';
import '../styles/qr.css';

const QRLabelPrinter = ({ boxes }) => {
    if (!boxes || boxes.length === 0) return null;

    return (
        <div className="print-only" id="print-area">
            {boxes.map((box, index) => (
                <div key={index} className="qr-label">
                    <div className="qr-info">
                        <h3>{box.productoNombre}</h3>
                        <p><strong>Lote:</strong> {box.lote}</p>
                        <p><strong>Calibre:</strong> {box.calibre || 'N/A'}</p>
                        <p><strong>Peso:</strong> {Number(box.peso).toFixed(2)} kg</p>
                        <p className="qr-date">{box.fecha}</p>
                    </div>
                    <div className="qr-code">
                        <QRCodeSVG value={`PT-${box.id}`} size={90} />
                        <span className="qr-id-text">ID: {box.id}</span>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default QRLabelPrinter;
