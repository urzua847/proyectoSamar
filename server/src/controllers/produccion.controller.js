"use strict";

import { createProduccionYieldService, getProduccionesByLoteService, getProduccionByLoteService, updateProduccionYieldService } from "../services/produccion.service.js";
import { createProduccionYieldValidation, updateProduccionYieldValidation } from "../validations/produccion.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

export async function createProduccionYield(req, res) {
  try {
    console.log('[DEBUG] req.user in produccion controller:', req.user);
    const { error } = createProduccionYieldValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Error de validación", error.message);

    const [newProduccion, errorService] = await createProduccionYieldService(req.body, req.user);
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

export async function getProduccionByLote(req, res) {
    try {
        const { loteId } = req.params;
        const [produccion, error] = await getProduccionByLoteService(loteId);
        if (error) return handleErrorClient(res, 400, error);
        handleSuccess(res, 200, "Producción obtenida", produccion);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

export async function updateProduccionYield(req, res) {
    try {
        const { loteId } = req.params;
        const { error } = updateProduccionYieldValidation.validate(req.body);
        if (error) return handleErrorClient(res, 400, "Error de validación", error.message);

        const [updated, errorService] = await updateProduccionYieldService(Number(loteId), req.body, req.user);
        if (errorService) return handleErrorClient(res, 400, errorService);

        handleSuccess(res, 200, "Producción actualizada correctamente", updated);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}
