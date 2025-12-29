"use strict";

import { createProduccionYieldService, getProduccionesByLoteService } from "../services/produccion.service.js";
import { createProduccionYieldValidation } from "../validations/produccion.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

export async function createProduccionYield(req, res) {
  try {
    const { error } = createProduccionYieldValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Error de validación", error.message);

    const [newProduccion, errorService] = await createProduccionYieldService(req.body);
    if (errorService) return handleErrorClient(res, 400, errorService);

    handleSuccess(res, 201, "Producción registrada exitosamente", newProduccion);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getProduccionesByLote(req, res) {
    try {
        const { loteId } = req.params;
        const [producciones, error] = await getProduccionesByLoteService(loteId);
        if (error) return handleErrorClient(res, 400, error);
        handleSuccess(res, 200, "Historial obtenido", producciones);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}
