"use strict";

import { trasladoStockService, trasladoPorScanService } from "../services/traslado.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import Joi from "joi";

// Validación básica
const trasladoSchema = Joi.object({
  destinoId: Joi.number().required(),
  items: Joi.array().items(
    Joi.object({
      definicionProductoId: Joi.number().required(),
      loteId: Joi.number().optional().allow(null),
      cantidad: Joi.number().positive().required(),
      calibre: Joi.string().allow(null, '').optional()
    })
  ).min(1).required(),
  peso_caja: Joi.number().positive().required()
});

export async function createTraslado(req, res) {
  try {
    const { error } = trasladoSchema.validate(req.body);
    if (error) {
        console.log("Validation Error:", error.message);
        return handleErrorClient(res, 400, "Error de validación: " + error.message, error.message);
    }

    const [movimientos, errorService] = await trasladoStockService(req.body, req.user);
    if (errorService) return handleErrorClient(res, 400, errorService);

    handleSuccess(res, 200, "Traslado realizado con éxito", movimientos);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function trasladoPorScan(req, res) {
  try {
    const { boxId, destinoId } = req.body;
    
    if (!boxId || !destinoId) {
        return handleErrorClient(res, 400, "Error de validación: Se requiere boxId y destinoId");
    }

    // El boxId del QR viene como "PT-1234", necesitamos parsearlo
    let idNumerico = boxId;
    if (typeof boxId === 'string' && boxId.startsWith('PT-')) {
        idNumerico = parseInt(boxId.replace('PT-', ''), 10);
    }

    const [success, errorService] = await trasladoPorScanService(idNumerico, destinoId, req.user);
    if (errorService) return handleErrorClient(res, 400, errorService);

    handleSuccess(res, 200, "Caja escaneada y trasladada con éxito", { boxId: idNumerico, destinoId });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
