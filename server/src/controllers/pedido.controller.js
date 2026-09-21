"use strict";

import { createPedidoService, getPedidosService, getPedidosForExport, deletePedidoService, completarDespachoPedidoService } from "../services/pedido.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import Joi from "joi";
import ExcelJS from 'exceljs';

const pedidoSchema = Joi.object({
  cliente: Joi.string().required(),
  numero_guia: Joi.string().required(),
  fecha: Joi.date().optional(),
  items: Joi.array().items(
      Joi.object({
          definicionProductoId: Joi.number().required(),
          tipo_formato: Joi.string().allow('').optional(),
          peso_caja: Joi.number().positive().required(),
          cantidad_bultos: Joi.number().positive().integer().required()
      })
  ).min(1).required()
});

export async function createPedido(req, res) {
  try {
    const { error } = pedidoSchema.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Error de validación", error.message);

    const [pedido, errorService] = await createPedidoService(req.body, req.user);
    if (errorService) return handleErrorClient(res, 400, errorService);

    handleSuccess(res, 201, "Pedido registrado exitosamente", pedido);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getPedidos(req, res) {
  try {
    const { page, limit, cliente, fecha_desde, fecha_hasta, numero_guia } = req.query;
    
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50,
      cliente,
      fecha_desde,
      fecha_hasta,
      numero_guia
    };

    const [result, error] = await getPedidosService(options);
    if (error) return handleErrorClient(res, 404, error);
    
    handleSuccess(res, 200, "Historial de pedidos obtenido", result);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

/**
 * Helper para agrupar productos por nombre y calibre
 */
const groupProducts = (detalles) => {
    return detalles.reduce((acc, p) => {
        const nombre = p.producto?.definicion?.nombre || 'N/A';
        const calibre = p.tipo_formato || 'N/A';
        const key = `${nombre}_${calibre}`;

        if (!acc[key]) {
            acc[key] = {
                nombre,
                calibre,
                totalCajas: 0,
                totalKilos: 0
            };
        }
        acc[key].totalCajas += parseFloat(p.cantidad_bultos) || 0;
        acc[key].totalKilos += parseFloat(p.kilos_totales) || 0;
        return acc;
    }, {});
};

/**
 * Exportar pedidos a Excel con detalles completos (Expandido por producto)
 */
export async function exportPedidosToExcel(req, res) {
    try {
        const { cliente, fecha_desde, fecha_hasta, numero_guia } = req.query;
        
        const filters = {
            cliente,
            fecha_desde,
            fecha_hasta,
            numero_guia
        };

        const [pedidos, error] = await getPedidosForExport(filters);
        if (error) return handleErrorClient(res, 404, error);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Despachos');

        // Columnas alineadas con la tabla del frontend
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 8 },
            { header: 'Fecha', key: 'fecha', width: 12 },
            { header: 'Cliente', key: 'cliente', width: 25 },
            { header: 'N° Guía', key: 'guia', width: 12 },
            { header: 'Producto', key: 'producto', width: 30 },
            { header: 'Calibre', key: 'calibre', width: 15 },
            { header: 'Cajas', key: 'cajas', width: 8 },
            { header: 'Kg/Caja', key: 'kg_caja', width: 10 },
            { header: 'Kilos', key: 'kilos', width: 10 },
            { header: 'Total Kilos', key: 'total_kilos', width: 12 },
            { header: 'Total Cajas', key: 'total_cajas', width: 12 },
            { header: 'Estado', key: 'estado', width: 12 }
        ];

        // Header Style
        worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } };

        pedidos.forEach(pedido => {
            const grouped = groupProducts(pedido.detalles || []);
            const productList = Object.values(grouped);
            
            const totalCajasPedido = (pedido.detalles || []).reduce((sum, d) => sum + (parseFloat(d.cantidad_bultos) || 0), 0);
            const totalKilosPedido = (pedido.detalles || []).reduce((sum, d) => sum + (parseFloat(d.kilos_totales) || 0), 0);

            if (productList.length === 0) {
                worksheet.addRow({
                    id: pedido.id,
                    fecha: new Date(pedido.fecha).toLocaleDateString('es-CL'),
                    cliente: pedido.cliente,
                    guia: pedido.numero_guia || '-',
                    producto: 'Sin productos',
                    total_kilos: totalKilosPedido.toFixed(2),
                    total_cajas: totalCajasPedido,
                    estado: pedido.estado
                });
            } else {
                productList.forEach((product, idx) => {
                    worksheet.addRow({
                        id: idx === 0 ? pedido.id : '',
                        fecha: idx === 0 ? new Date(pedido.fecha).toLocaleDateString('es-CL') : '',
                        cliente: idx === 0 ? pedido.cliente : '',
                        guia: idx === 0 ? (pedido.numero_guia || '-') : '',
                        producto: product.nombre,
                        calibre: product.calibre,
                        cajas: product.totalCajas,
                        kg_caja: (product.totalKilos / product.totalCajas).toFixed(2),
                        kilos: product.totalKilos.toFixed(2),
                        total_kilos: idx === 0 ? totalKilosPedido.toFixed(2) : '',
                        total_cajas: idx === 0 ? totalCajasPedido : '',
                        estado: idx === 0 ? pedido.estado : ''
                    });
                });
            }
        });

        const buffer = await workbook.xlsx.writeBuffer();
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=despachos_${Date.now()}.xlsx`);
        res.send(buffer);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

/**
 * Exportar pedidos a PDF (Expandido por producto)
 */
export async function exportPedidosToPDF(req, res) {
    try {
        const { cliente, fecha_desde, fecha_hasta, numero_guia } = req.query;
        const [pedidos, error] = await getPedidosForExport({ cliente, fecha_desde, fecha_hasta, numero_guia });
        if (error) return handleErrorClient(res, 404, error);

        const jspdfImport = await import('jspdf');
        const jsPDF = jspdfImport.jsPDF || jspdfImport.default?.jsPDF || jspdfImport.default;
        const autotableImport = await import('jspdf-autotable');
        const autoTable = autotableImport.default || autotableImport;
        
        const doc = new jsPDF({ orientation: 'landscape' }); // Landscape para mas espacio
        if (typeof doc.autoTable !== 'function' && typeof autoTable === 'function') autoTable(doc);
        
        doc.setFontSize(16);
        doc.text('Historial de Despachos Detallado', 14, 15);
        doc.setFontSize(10);
        doc.text(`Generado: ${new Date().toLocaleString('es-CL')}`, 14, 22);

        const tableData = [];
        pedidos.forEach(pedido => {
            const grouped = groupProducts(pedido.detalles || []);
            const productList = Object.values(grouped);

            const totalCajasPedido = (pedido.detalles || []).reduce((sum, d) => sum + (parseFloat(d.cantidad_bultos) || 0), 0);
            const totalKilosPedido = (pedido.detalles || []).reduce((sum, d) => sum + (parseFloat(d.kilos_totales) || 0), 0);

            if (productList.length === 0) {
                tableData.push([pedido.id, new Date(pedido.fecha).toLocaleDateString('es-CL'), pedido.cliente, pedido.numero_guia || '-', 'Sin productos', '-', '-', '-', '-', totalKilosPedido.toFixed(2), totalCajasPedido, pedido.estado]);
            } else {
                productList.forEach((product, idx) => {
                    tableData.push([
                        idx === 0 ? pedido.id : '',
                        idx === 0 ? new Date(pedido.fecha).toLocaleDateString('es-CL') : '',
                        idx === 0 ? pedido.cliente : '',
                        idx === 0 ? (pedido.numero_guia || '-') : '',
                        product.nombre,
                        product.calibre,
                        product.totalCajas,
                        (product.totalKilos / product.totalCajas).toFixed(2),
                        product.totalKilos.toFixed(2),
                        idx === 0 ? totalKilosPedido.toFixed(2) : '',
                        idx === 0 ? totalCajasPedido : '',
                        idx === 0 ? pedido.estado : ''
                    ]);
                });
            }
        });

        doc.autoTable({
            head: [['ID', 'Fecha', 'Cliente', 'Guía', 'Producto', 'Calibre', 'Cajas', 'Kg/Cj', 'Kg', 'Tot Kg', 'Tot Cj', 'Estado']],
            body: tableData,
            startY: 28,
            styles: { fontSize: 7, cellPadding: 2 },
            headStyles: { fillColor: [59, 130, 246] },
            columnStyles: {
                0: { cellWidth: 10 }, 1: { cellWidth: 18 }, 2: { cellWidth: 35 }, 3: { cellWidth: 18 },
                4: { cellWidth: 45 }, 5: { cellWidth: 20 }, 6: { cellWidth: 12 }, 7: { cellWidth: 12 },
                8: { cellWidth: 15 }, 9: { cellWidth: 15 }, 10: { cellWidth: 15 }, 11: { cellWidth: 18 }
            }
        });

        const pdfOutput = doc.output('arraybuffer');
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=despachos_${Date.now()}.pdf`);
        res.send(Buffer.from(pdfOutput));
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

const completarDespachoSchema = Joi.object({
  cajasIds: Joi.array().items(Joi.number()).optional(),
  cajaId: Joi.alternatives().try(Joi.number(), Joi.string()).optional(),
  cerrarPedido: Joi.boolean().optional()
}).or('cajasIds', 'cajaId', 'cerrarPedido');

export async function completarDespacho(req, res) {
  try {
    const { id } = req.params;
    const { error } = completarDespachoSchema.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Error de validaci�n", error.message);

    const [pedido, errorService] = await completarDespachoPedidoService(id, req.body.cajasIds || (req.body.cajaId ? [typeof req.body.cajaId === 'string' ? Number(req.body.cajaId.replace(/\D/g, '')) : req.body.cajaId] : []), req.user, req.body.cerrarPedido);
    if (errorService) return handleErrorClient(res, 400, errorService);

    handleSuccess(res, 200, "Despacho completado exitosamente", pedido);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function deletePedido(req, res) {
  try {
    const { id } = req.params;
    const [result, error] = await deletePedidoService(id, req.user);
    
    if (error) return handleErrorClient(res, 400, error);
    
    handleSuccess(res, 200, "Pedido eliminado exitosamente", result);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

const liberarCajaSchema = Joi.object({
  cajaId: Joi.alternatives().try(Joi.number(), Joi.string()).required()
});

export async function liberarCaja(req, res) {
  try {
    const { id } = req.params;
    const { error } = liberarCajaSchema.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Error de validación", error.message);

    let cajaIdToFree = req.body.cajaId;
    if (typeof cajaIdToFree === 'string') {
        cajaIdToFree = Number(cajaIdToFree.replace(/\D/g, ''));
    }

    const [result, errorService] = await liberarCajaDePedidoService(id, cajaIdToFree, req.user);
    if (errorService) return handleErrorClient(res, 400, errorService);

    handleSuccess(res, 200, "Caja liberada exitosamente", result);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
