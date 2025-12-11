"use strict";

import { trasladoStockService } from "../services/traslado.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import Joi from "joi";

// Validación básica
const trasladoSchema = Joi.object({
  destinoId: Joi.number().required(),
  items: Joi.array().items(
    Joi.object({
      definicionProductoId: Joi.number().required(),
      cantidad: Joi.number().positive().required(),
      calibre: Joi.string().allow(null, '').optional()
    })
  ).min(1).required()
});

export async function createTraslado(req, res) {
  try {
    const { error } = trasladoSchema.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Error de validación", error.message);

    const [movimientos, errorService] = await trasladoStockService(req.body);
    if (errorService) return handleErrorClient(res, 400, errorService);

    handleSuccess(res, 200, "Traslado realizado con éxito", movimientos);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
