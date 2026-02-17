import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { format as formatTempo } from "@formkit/tempo";

/**
 * Genera un PDF para el perfil de una entidad (cliente/proveedor) y su historial.
 */
export const generateEntityPDF = (entidad, history) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();

    // -- Encabezado --
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text(`Ficha de ${entidad.tipo}: ${entidad.nombre}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${formatTempo(new Date(), "DD-MM-YYYY HH:mm")}`, 14, 28);

    // -- Información de Contacto (Formato Formulario) --
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text("Información de Contacto", 14, 40);
    doc.line(14, 42, 80, 42);

    doc.setFontSize(11);
    doc.setTextColor(0);
    const startY = 50;
    const lineHeight = 8;
    
    doc.setFont("helvetica", "bold");
    doc.text("RUT:", 14, startY);
    doc.text("Dirección:", 14, startY + lineHeight);
    doc.text("Teléfono:", 14, startY + (lineHeight * 2));
    doc.text("Email:", 14, startY + (lineHeight * 3));
    doc.text("Giro:", 14, startY + (lineHeight * 4));

    doc.setFont("helvetica", "normal");
    doc.text(entidad.rut || "N/A", 50, startY);
    doc.text(entidad.direccion || "N/A", 50, startY + lineHeight);
    doc.text(entidad.telefono || "N/A", 50, startY + (lineHeight * 2));
    doc.text(entidad.email || "N/A", 50, startY + (lineHeight * 3));
    doc.text(entidad.giro || "N/A", 50, startY + (lineHeight * 4));

    // -- Estadísticas Globales --
    const statsY = startY + (lineHeight * 6);
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text("Estadísticas Globales", 14, statsY);
    doc.line(14, statsY + 2, 80, statsY + 2);

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

    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.setFont("helvetica", "bold");
    doc.text("Entregas Totales:", 14, statsY + 12);
    doc.text("Kilos Totales:", 80, statsY + 12);
    doc.text("Rendimiento Promedio:", 140, statsY + 12);

    doc.setFont("helvetica", "normal");
    doc.text(totalEntregas.toString(), 50, statsY + 12);
    doc.text(`${kilosTotales} kg`, 110, statsY + 12);
    doc.text(`${averageYield}%`, 185, statsY + 12);

    // -- Historial de Entregas (Fila por Fila) --
    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text("Historial de Entregas", 14, statsY + 25);

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
        startY: statsY + 30,
        head: [['Lote', 'Fecha', 'Especie', 'Entrada', 'Salida', 'Rend.', 'Estado']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 51, 102] },
        styles: { fontSize: 9 }
    });

    doc.save(`Ficha_${entidad.nombre}_${formatTempo(new Date(), "YYYYMMDD")}.pdf`);
};

/**
 * Genera un PDF para un lote/pedido específico.
 */
export const generateLotPDF = (lote) => {
    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(0, 51, 102);
    doc.text(`Detalle de Recepción: ${lote.codigo}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generado el: ${formatTempo(new Date(), "DD-MM-YYYY HH:mm")}`, 14, 28);

    doc.setFontSize(14);
    doc.setTextColor(0, 51, 102);
    doc.text("Información del Lote", 14, 40);
    doc.line(14, 42, 80, 42);

    doc.setFontSize(11);
    doc.setTextColor(0);
    const startY = 50;
    const lineHeight = 8;

    const info = [
        ["Proveedor:", lote.proveedorNombre],
        ["Fecha Recepción:", lote.fechaFormateada],
        ["Materia Prima:", lote.materiaPrimaNombre],
        ["Peso Bruto Entrada:", `${lote.peso_bruto_kg} kg`],
        ["Número de Bandejas:", lote.numero_bandejas],
        ["Estado:", lote.estadoTexto]
    ];

    info.forEach((item, index) => {
        doc.setFont("helvetica", "bold");
        doc.text(item[0], 14, startY + (index * lineHeight));
        doc.setFont("helvetica", "normal");
        doc.text(item[1].toString(), 60, startY + (index * lineHeight));
    });

    if (lote.peso_total > 0) {
        doc.setFontSize(14);
        doc.setTextColor(0, 51, 102);
        doc.text("Resultados de Producción", 14, startY + (info.length * lineHeight) + 10);
        
        const resY = startY + (info.length * lineHeight) + 20;
        doc.setFontSize(11);
        doc.setTextColor(0);
        
        const results = [
            ["Peso Carne Blanca:", `${lote.peso_carne_blanca || 0} kg`],
            ["Peso Pinzas:", `${lote.peso_pinzas || 0} kg`],
            ["Peso Total Producido:", `${lote.peso_total} kg`],
            ["Rendimiento:", `${((lote.peso_total / lote.peso_bruto_kg) * 100).toFixed(2)}%`]
        ];

        results.forEach((item, index) => {
            doc.setFont("helvetica", "bold");
            doc.text(item[0], 14, resY + (index * lineHeight));
            doc.setFont("helvetica", "normal");
            doc.text(item[1].toString(), 60, resY + (index * lineHeight));
        });

        // --- DETALLE DE PRODUCTOS TERMINADOS (RESUMIDO) ---
        if (lote.productosTerminados && lote.productosTerminados.length > 0) {
            const tableY = resY + (results.length * lineHeight) + 10;
            
            doc.setFontSize(14);
            doc.setTextColor(0, 51, 102);
            doc.text("Detalle de Productos Terminados (Resumen)", 14, tableY);

            // Agrupar items
            const grouped = {};

            lote.productosTerminados.forEach(prod => {
                // Intento robusto de obtener el nombre
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
                startY: tableY + 5,
                head: [['Producto', 'Ubicación', 'Cajas/Unid.', 'Kilos Totales', 'Estado']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: [0, 51, 102] },
                bodyStyles: { textColor: 50 },
                styles: { fontSize: 9, halign: 'center' },
                columnStyles: {
                    0: { halign: 'left' }, // Producto a la izquierda
                    1: { halign: 'left' }  // Ubicación a la izquierda
                }
            });
        }
    }

    doc.save(`Recepcion_${lote.codigo}.pdf`);
};
