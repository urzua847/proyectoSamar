import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format as formatTempo } from "@formkit/tempo";

/**
 * Genera un PDF para el perfil de una entidad (cliente/proveedor) y su historial.
 */
export const generateEntityPDF = (entidad, history) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // -- Encabezado (Banner) --
    doc.setFillColor(15, 23, 42); // slate-900 background
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`Ficha de ${entidad.tipo}: ${entidad.nombre}`, 14, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado el: ${formatTempo(new Date(), "DD-MM-YYYY HH:mm")}`, 14, 32);

    let currentY = 50;

    // -- Información de Contacto (Grid) --
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Información de Contacto", 14, currentY);
    currentY += 6;

    autoTable(doc, {
        startY: currentY,
        body: [
            [{ content: 'RUT:', styles: { fontStyle: 'bold' } }, entidad.rut || "N/A", { content: 'Teléfono:', styles: { fontStyle: 'bold' } }, entidad.telefono || "N/A"],
            [{ content: 'Dirección:', styles: { fontStyle: 'bold' } }, entidad.direccion || "N/A", { content: 'Email:', styles: { fontStyle: 'bold' } }, entidad.email || "N/A"],
            [{ content: 'Giro:', styles: { fontStyle: 'bold' } }, entidad.giro || "N/A", '', '']
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: { top: 3, right: 2, bottom: 3, left: 0 } },
        columnStyles: {
            0: { textColor: [71, 85, 105] },
            1: { textColor: [15, 23, 42] },
            2: { textColor: [71, 85, 105] },
            3: { textColor: [15, 23, 42] }
        }
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // -- Estadísticas Globales --
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Estadísticas Globales", 14, currentY);
    currentY += 6;

    const totalEntregas = history.length;
    const kilosTotales = history.reduce((acc, curr) => acc + Number(curr.peso_bruto_kg || 0), 0);
    
    let validYieldsCount = 0;
    const userGlobalYield = history.reduce((acc, curr) => {
        if (curr.peso_total > 0 && curr.peso_bruto_kg > 0) {
            const y = (curr.peso_total / curr.peso_bruto_kg) * 100;
            validYieldsCount++;
            return acc + y;
        }
        return acc;
    }, 0);
    const averageYield = validYieldsCount > 0 ? (userGlobalYield / validYieldsCount).toFixed(2) : "0.00";

    autoTable(doc, {
        startY: currentY,
        head: [['Entregas Totales', 'Kilos Totales', 'Rendimiento Promedio']],
        body: [[totalEntregas.toString(), `${kilosTotales} kg`, `${averageYield}%`]],
        theme: 'grid',
        styles: { fontSize: 11, cellPadding: 8, halign: 'center', lineColor: [226, 232, 240], lineWidth: 0.1 },
        headStyles: { fillColor: [248, 250, 252], textColor: [71, 85, 105], fontStyle: 'bold' },
        bodyStyles: { textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 14 }
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // -- Historial de Entregas --
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Historial de Entregas", 14, currentY);
    currentY += 6;

    const tableData = history.map(row => [
        row.codigo,
        row.fechaFormateada,
        row.materiaPrimaNombre,
        `${row.peso_bruto_kg} kg`,
        `${row.peso_total} kg`,
        `${row.peso_total > 0 ? ((row.peso_total / row.peso_bruto_kg) * 100).toFixed(2) : '0.00'}%`,
        row.estadoTexto
    ]);

    autoTable(doc, {
        startY: currentY,
        head: [['Lote', 'Fecha', 'Especie', 'Entrada', 'Salida', 'Rend.', 'Estado']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
        styles: { fontSize: 9, cellPadding: 4, lineColor: [226, 232, 240] },
        alternateRowStyles: { fillColor: [248, 250, 252] }
    });

    doc.save(`Ficha_${entidad.nombre}_${formatTempo(new Date(), "YYYYMMDD")}.pdf`);
};

/**
 * Genera un PDF para un lote/pedido específico.
 */
export const generateLotPDF = (lote) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // -- Encabezado (Banner) --
    doc.setFillColor(15, 23, 42); // slate-900 background
    doc.rect(0, 0, pageWidth, 40, 'F');

    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`Detalle de Recepción: ${lote.codigo}`, 14, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Generado el: ${formatTempo(new Date(), "DD-MM-YYYY HH:mm")}`, 14, 32);

    let currentY = 50;

    // -- Información del Lote --
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.text("Información del Lote", 14, currentY);
    currentY += 6;

    autoTable(doc, {
        startY: currentY,
        body: [
            [{ content: 'Proveedor:', styles: { fontStyle: 'bold' } }, lote.proveedorNombre, { content: 'Fecha Recepción:', styles: { fontStyle: 'bold' } }, lote.fechaFormateada],
            [{ content: 'Materia Prima:', styles: { fontStyle: 'bold' } }, lote.materiaPrimaNombre, { content: 'Estado:', styles: { fontStyle: 'bold' } }, lote.estadoTexto],
            [{ content: 'Peso Bruto Entrada:', styles: { fontStyle: 'bold' } }, `${lote.peso_bruto_kg} kg`, { content: 'Número de Bandejas:', styles: { fontStyle: 'bold' } }, lote.numero_bandejas.toString()]
        ],
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: { top: 3, right: 2, bottom: 3, left: 0 } },
        columnStyles: {
            0: { textColor: [71, 85, 105] },
            1: { textColor: [15, 23, 42] },
            2: { textColor: [71, 85, 105] },
            3: { textColor: [15, 23, 42] }
        }
    });

    currentY = doc.lastAutoTable.finalY + 8;

    // -- Resultados de Producción --
    if (lote.peso_total > 0) {
        doc.setFontSize(14);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("Resultados de Producción", 14, currentY);
        currentY += 6;

        const resultsBody = [
            [{ content: 'Peso Carne Blanca:', styles: { fontStyle: 'bold' } }, `${lote.peso_carne_blanca || 0} kg`, { content: 'Rendimiento:', styles: { fontStyle: 'bold' } }, `${(((lote.peso_total || lote.peso_total_producido || 0) / lote.peso_bruto_kg) * 100).toFixed(2)}%`],
            [{ content: 'Peso Pinzas:', styles: { fontStyle: 'bold' } }, `${lote.peso_pinzas || 0} kg`, { content: 'Peso Total Producido:', styles: { fontStyle: 'bold' } }, `${lote.peso_total || lote.peso_total_producido || 0} kg`],
        ];

        if (Number(lote.merma_kg || 0) > 0) {
            const pesoTotalParaMerma = Number(lote.peso_total || lote.peso_total_producido || 0);
            const lossPercent = pesoTotalParaMerma > 0 ? ((Number(lote.merma_kg) / pesoTotalParaMerma) * 100).toFixed(2) : '0.00';
            resultsBody.push([
                { content: 'Merma Registrada:', styles: { fontStyle: 'bold', textColor: [220, 38, 38] } }, 
                { content: `${Number(lote.merma_kg).toFixed(2)} kg`, styles: { textColor: [220, 38, 38], fontStyle: 'bold' } },
                { content: 'Porcentaje de Pérdida:', styles: { fontStyle: 'bold', textColor: [220, 38, 38] } },
                { content: `${lossPercent}%`, styles: { textColor: [220, 38, 38], fontStyle: 'bold' } }
            ]);
        }

        autoTable(doc, {
            startY: currentY,
            body: resultsBody,
            theme: 'grid',
            styles: { fontSize: 10, cellPadding: 6, lineColor: [226, 232, 240], lineWidth: 0.1 },
            columnStyles: {
                0: { fillColor: [248, 250, 252], textColor: [71, 85, 105] },
                1: { textColor: [15, 23, 42], fontStyle: 'bold' },
                2: { fillColor: [248, 250, 252], textColor: [71, 85, 105] },
                3: { textColor: [21, 128, 61], fontStyle: 'bold' } // green for yield/total
            }
        });

        currentY = doc.lastAutoTable.finalY + 8;

        // --- DETALLE DE PRODUCTOS TERMINADOS (RESUMIDO) ---
        if (lote.productosTerminados && lote.productosTerminados.length > 0) {
            doc.setFontSize(14);
            doc.setTextColor(15, 23, 42);
            doc.setFont("helvetica", "bold");
            doc.text("Detalle de Productos Terminados (Resumen)", 14, currentY);
            currentY += 6;

            // Agrupar items
            const grouped = {};

            lote.productosTerminados.forEach(prod => {
                const prodName = prod.definicion?.nombre 
                              || prod.productoNombre 
                              || prod.definicionproductonombre
                              || 'Producto Estándar';

                const ubicName = prod.ubicacion?.nombre 
                              || prod.ubicacionNombre 
                              || prod.ubicacionnombre 
                              || 'Sin Ubicación';

                const key = `${prodName}-${prod.calibre || 'S/C'}-${ubicName}-${prod.estado}`;
                
                if (!grouped[key]) {
                    grouped[key] = {
                        producto: prodName,
                        calibre: prod.calibre || 'S/C',
                        ubicacion: ubicName,
                        estado: prod.estado,
                        cantidad: 0,
                        kilos: 0
                    };
                }
                grouped[key].cantidad += 1;
                grouped[key].kilos += Number(prod.peso_neto_kg || 0);
            });

            // Convertir a array para tabla
            const tableData = Object.values(grouped).map(g => [
                `${g.producto} (${g.calibre})`,
                g.ubicacion,
                g.cantidad,
                `${g.kilos.toFixed(2)} kg`,
                g.estado === 'Vendido' ? 'Despachado' : g.estado
            ]);

            autoTable(doc, {
                startY: currentY,
                head: [['Producto', 'Ubicación', 'Cajas/Unid.', 'Kilos Totales', 'Estado']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
                styles: { fontSize: 9, cellPadding: 5, lineColor: [226, 232, 240], halign: 'center' },
                alternateRowStyles: { fillColor: [248, 250, 252] },
                columnStyles: {
                    0: { halign: 'left', fontStyle: 'bold', textColor: [15, 23, 42] },
                    1: { halign: 'left' }
                }
            });
        }
    }

    doc.save(`Recepcion_${lote.codigo}.pdf`);
};
