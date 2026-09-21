"use strict";

import { getAllAuditLogs, getAuditLogsByEntity, getAuditLogsByUser } from "../services/audit.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import ExcelJS from 'exceljs';

/**
 * Obtiene todos los logs de auditoría con paginación
 */
export async function getAuditLogs(req, res) {
    try {
        const { page, limit } = req.query;
        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50
        };

        const [result, error] = await getAllAuditLogs(options);
        if (error) return handleErrorClient(res, 404, error);

        // Transformar los logs para el frontend
        // Mapear newData → details y agregar campos de usuario
        const transformedLogs = result.data.map(log => ({
            id: log.id,
            action: log.action,
            entityType: log.entityType,
            entityId: log.entityId,
            userId: log.userId,
            userName: log.userName,
            userEmail: log.userName, // userName actualmente contiene el email
            details: log.newData || {}, // AQUÍ está la clave: newData → details
            summary: generateSummary(log),
            previousData: log.previousData,
            ipAddress: log.metadata?.ipAddress || null,
            userAgent: log.metadata?.userAgent || null,
            description: log.description,
            createdAt: log.createdAt
        }));

        const transformedResult = {
            ...result,
            data: transformedLogs
        };

        console.log(`📊 [AuditController] Enviando ${transformedLogs.length} logs con detalles`);
        if (transformedLogs.length > 0) {
            console.log(`📊 [AuditController] Ejemplo de log transformado:`, {
                id: transformedLogs[0].id,
                action: transformedLogs[0].action,
                hasDetails: !!transformedLogs[0].details && Object.keys(transformedLogs[0].details).length > 0,
                detailsKeys: Object.keys(transformedLogs[0].details || {})
            });
        }

        handleSuccess(res, 200, "Logs de auditoría obtenidos", transformedResult);
    } catch (error) {
        console.error('❌ [AuditController] Error:', error);
        handleErrorServer(res, 500, error.message);
    }
}

/**
 * Obtiene el historial de auditoría de una entidad específica
 */
export async function getEntityAuditLogs(req, res) {
    try {
        const { entityType, entityId } = req.params;

        const [logs, error] = await getAuditLogsByEntity(entityType, parseInt(entityId));
        if (error) return handleErrorClient(res, 404, error);

        handleSuccess(res, 200, `Historial de ${entityType} #${entityId}`, logs);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

/**
 * Obtiene el historial de auditoría de un usuario
 */
export async function getUserAuditLogs(req, res) {
    try {
        const { userId } = req.params;
        const { limit } = req.query;

        const [logs, error] = await getAuditLogsByUser(
            parseInt(userId), 
            limit ? parseInt(limit) : 50
        );
        if (error) return handleErrorClient(res, 404, error);

        handleSuccess(res, 200, `Historial del usuario #${userId}`, logs);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

/**
 * Exportar logs de auditoría a Excel
 */
/**
 * Helper: Generar resumen narrativo basado en newData
 * Usado tanto para Excel como para PDF
 */
function generateSummary(log) {
    const data = log.newData || {};
    let summary = '';

    // Construcción narrativa según entidad y datos disponibles
    switch (log.entityType) {
        case 'LoteRecepcion':
            const loteCodigo = data.codigo || data.lote_codigo || (log.previousData ? log.previousData.codigo : null);
            summary = `Lote ${loteCodigo ? loteCodigo : '#' + log.entityId}`;
            if (data.peso_bruto_kg !== undefined) summary += `\nPeso Bruto: ${data.peso_bruto_kg}kg`;
            if (data.materiaPrima !== undefined) summary += `, MP: ${data.materiaPrima}`;
            if (data.estado !== undefined) summary += ` (Estado: ${data.estado ? 'Activo' : 'Inactivo'})`;
            if (data.en_proceso_produccion !== undefined) summary += ` (En Producción: ${data.en_proceso_produccion ? 'Sí' : 'No'})`;
            if (data.detalle_pesadas && Array.isArray(data.detalle_pesadas)) {
                const pesadas = data.detalle_pesadas.map(p => `${p.peso}kg`).join(', ');
                summary += `\n${data.detalle_pesadas.length} pesadas (${pesadas})`;
            }
            break;

        case 'Produccion':
            summary = `Producción ID ${log.entityId}`;
            if (data.detalles && Array.isArray(data.detalles)) {
                const parts = data.detalles.map(d => `${d.nombre}: ${d.peso}kg`);
                summary += `\n` + parts.join(', ');
            }
            if (data.peso_total) summary += ` (Total: ${data.peso_total}kg)`;
            break;

        case 'ProductoTerminado':
        case 'Envasado':
            if (data.detalle_productos && Array.isArray(data.detalle_productos)) {
                summary = `${data.detalle_productos.length} producto(s) terminado(s)`;
                const firstProduct = data.detalle_productos[0];
                if (firstProduct) {
                    summary += `\n${firstProduct.producto || 'N/A'}: ${firstProduct.peso_kg || 'N/A'}kg`;
                    if (firstProduct.calibre) summary += `, ${firstProduct.calibre}`;
                }
            } else {
                summary = 'Producto terminado creado';
            }
            break;

        case 'Pedido':
            if (data.detalle_productos && Array.isArray(data.detalle_productos)) {
                const totalCajas = data.detalle_productos.reduce((sum, p) => sum + (parseFloat(p.cantidad_bultos) || 0), 0);
                const totalKg = data.detalle_productos.reduce((sum, p) => sum + (parseFloat(p.kilos) || 0), 0);
                summary = `Pedido: ${data.detalle_productos.length} productos`;
                if (totalCajas || totalKg) {
                    summary += `\n${totalCajas} cajas, ${totalKg.toFixed(2)}kg total`;
                }
            } else {
                summary = 'Pedido creado';
            }
            break;

        case 'Traslado':
            summary = `Traslado hacia ${data.destino_nombre || 'N/A'}`;
            if (data.detalle_items && Array.isArray(data.detalle_items)) {
                const totalKg = data.detalle_items.reduce((sum, item) => sum + (parseFloat(item.cantidad_kg) || parseFloat(item.cantidad_solicitada) || 0), 0);
                const pesoCaja = parseFloat(data.peso_caja) || 0;
                const cajasStr = pesoCaja > 0 ? ` (${Math.round(totalKg / pesoCaja)} cajas)` : '';
                summary += `\nTotal: ${totalKg.toFixed(2)}kg${cajasStr}`;
            } else {
                summary = 'Traslado registrado';
            }
            break;

        default:
            // Fallback: mostrar campos principales del newData
            const keys = Object.keys(data).slice(0, 3);
            if (keys.length > 0) {
                summary = keys.map(key => `${key}: ${data[key]}`).join(', ');
            } else {
                summary = log.description || 'Sin detalles';
            }
    }

    return summary || (log.description || 'N/A');
}

/**
 * Exportar logs de auditoría a Excel
 */
export async function exportAuditLogsToExcel(req, res) {
    try {
        // Obtener todos los logs (sin paginación para export)
        const [result, error] = await getAllAuditLogs({ page: 1, limit: 10000 });
        if (error) return handleErrorClient(res, 404, error);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Audit Logs');

        // Metadata
        workbook.creator = 'ProyectoSamar ERP';
        workbook.created = new Date();
        workbook.modified = new Date();

        // Definir columnas - Con Resumen de Cambios
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 10 },
            { header: 'Acción', key: 'action', width: 15 },
            { header: 'Entidad', key: 'entityType', width: 20 },
            { header: 'ID Entidad', key: 'entityId', width: 12 },
            { header: 'Usuario', key: 'userName', width: 25 },
            { header: 'Fecha', key: 'createdAt', width: 20 },
            { header: 'Resumen de Cambios', key: 'summary', width: 60 }
        ];

        // Estilo del header
        worksheet.getRow(1).font = { bold: true, size: 12 };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF3B82F6' }
        };
        worksheet.getRow(1).font = { ...worksheet.getRow(1).font, color: { argb: 'FFFFFFFF' } };

        // Agregar datos con resumen narrativo
        result.data.forEach(log => {
            worksheet.addRow({
                id: log.id,
                action: log.action,
                entityType: log.entityType,
                entityId: log.entityId,
                userName: log.userName || 'Sistema',
                createdAt: new Date(log.createdAt).toLocaleString('es-CL'),
                summary: generateSummary(log)
            });
        });

        // Auto-filter
        worksheet.autoFilter = 'A1:G1';

        // Ajustar altura de filas y alineación
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber > 1) { // Skip header
                row.height = 30;
                row.alignment = { vertical: 'top', wrapText: true };
            }
        });

        // Generar buffer
        const buffer = await workbook.xlsx.writeBuffer();
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.xlsx`);
        res.send(buffer);

        console.log(`📊 [AuditController] Excel exportado con ${result.data.length} registros y resúmenes narrativos`);
    } catch (error) {
        console.error('❌ [AuditController] Error exportando Excel:', error);
        handleErrorServer(res, 500, error.message);
    }
}

/**
 * Exportar logs de auditoría a PDF
 */
export async function exportAuditLogsToPDF(req, res) {
    try {
        // Obtener logs
        const [result, error] = await getAllAuditLogs({ page: 1, limit: 1000 });
        if (error) return handleErrorClient(res, 404, error);

        // Dynamic import robusto para jsPDF
        const jspdfImport = await import('jspdf');
        // Intentar obtener el constructor de diferentes lugares posibles
        const jsPDF = jspdfImport.jsPDF || jspdfImport.default?.jsPDF || jspdfImport.default;

        if (!jsPDF || typeof jsPDF !== 'function') {
            throw new Error(`Error cargando jsPDF: Se obtuvo ${typeof jsPDF} en lugar de un constructor`);
        }

        const autotableImport = await import('jspdf-autotable');
        const autoTable = autotableImport.default || autotableImport;
        
        const doc = new jsPDF();
        
        // Asignar autoTable manualmente si no se inyectó automáticamente
        if (typeof doc.autoTable !== 'function' && typeof autoTable === 'function') {
            autoTable(doc);
        }
        
        // Header
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Audit Logs - Detalle de Actividad', 14, 22);
        
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 14, 30);
        doc.text(`Total de registros: ${result.data.length}`, 14, 36);

        // Tabla con columna de Resumen de Cambios (usa función generateSummary compartida)
        const tableData = result.data.map(log => [
            log.id,
            log.action,
            log.entityType,
            new Date(log.createdAt).toLocaleString('es-CL', { 
                dateStyle: 'short', 
                timeStyle: 'short' 
            }),
            generateSummary(log)
        ]);

        doc.autoTable({
            head: [['ID', 'Acción', 'Entidad', 'Fecha', 'Resumen de Cambios']],
            body: tableData,
            startY: 42,
            styles: { 
                fontSize: 7,
                cellPadding: 3,
                overflow: 'linebreak',
                cellWidth: 'wrap'
            },
            headStyles: {
                fillColor: [59, 130, 246],
                fontStyle: 'bold',
                fontSize: 8
            },
            alternateRowStyles: {
                fillColor: [245, 247, 250]
            },
            columnStyles: {
                0: { cellWidth: 10 },  // ID
                1: { cellWidth: 18 },  // Acción
                2: { cellWidth: 30 },  // Entidad
                3: { cellWidth: 28 },  // Fecha
                4: { cellWidth: 'auto' } // Resumen (resto del espacio)
            }
        });

        // Footer con número de página (SIN nota al pie)
        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(0);
            doc.text(
                `Página ${i} de ${pageCount}`,
                doc.internal.pageSize.getWidth() / 2,
                doc.internal.pageSize.getHeight() - 10,
                { align: 'center' }
            );
        }

        const pdfOutput = doc.output('arraybuffer');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=audit_logs_${Date.now()}.pdf`);
        res.send(Buffer.from(pdfOutput));

        console.log(`📄 [AuditController] PDF exportado con ${result.data.length} registros y descripciones mejoradas`);
    } catch (error) {
        console.error('❌ Error exporting PDF:', error);
        console.error(error.stack);
        handleErrorServer(res, 500, error.message);
    }
}

/**
 * Obtener alertas de seguridad
 */
export async function getAlerts(req, res) {
    try {
        const { detectSuspiciousActivity } = await import('../services/auditAlert.service.js');
        const alerts = await detectSuspiciousActivity();
        
        handleSuccess(res, 200, "Alertas de seguridad obtenidas", alerts);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

/**
 * Obtener estadísticas de actividad para el dashboard
 */
export async function getActivityStats(req, res) {
    try {
        const { getActivityStats: getStats } = await import('../services/auditAlert.service.js');
        const stats = await getStats();
        
        if (!stats) return handleErrorClient(res, 404, "No se pudieron obtener estadísticas");
        
        handleSuccess(res, 200, "Estadísticas de actividad obtenidas", stats);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}
