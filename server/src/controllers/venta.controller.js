"use strict";

import { createVentaService, getVentasService } from "../services/venta.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import Joi from "joi";

const ventaSchema = Joi.object({
  cliente: Joi.string().required(),
  n_guia_despacho: Joi.string().optional().allow(''), // Ahora se autogenera en backend
  tipo_venta: Joi.string().valid("Nacional", "Exportación").required(),
  items: Joi.array().items(
      Joi.object({
          definicionProductoId: Joi.number().required(),
          contenedorId: Joi.number().required(),
          cantidad: Joi.number().positive().required(),
          calibre: Joi.string().allow(null, '').optional()
      })
  ).min(1).required()
});

export async function createVenta(req, res) {
  try {
    const { error } = ventaSchema.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Error de validación", error.message);

    const [venta, errorService] = await createVentaService(req.body);
    if (errorService) return handleErrorClient(res, 400, errorService);

    handleSuccess(res, 201, "Venta/Despacho registrado exitosamente", venta);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
export async function getVentas(req, res) {
  try {
    const [ventas, error] = await getVentasService();
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Historial de ventas obtenido", ventas);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
