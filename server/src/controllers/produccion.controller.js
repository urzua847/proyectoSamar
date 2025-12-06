"use strict";

import { createProduccionService } from "../services/produccion.service.js";
import { createProduccionValidation } from "../validations/produccion.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

export async function createProduccion(req, res) {
  try {
    // Validar estructura { loteRecepcionId, items: [] }
    const { error } = createProduccionValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Error de validación", error.message);

    const [nuevosProductos, errorService] = await createProduccionService(req.body);
    if (errorService) return handleErrorClient(res, 400, errorService);

    handleSuccess(res, 201, "Producción registrada exitosamente", { cantidad: nuevosProductos.length });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}