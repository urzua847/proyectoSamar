"use strict";

import { createProduccionService } from "../services/produccion.service.js";
import { createProduccionValidation } from "../validations/produccion.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function createProduccion(req, res) {
  try {
    const { body } = req;

    // 1. Validar los datos de entrada
    const { error: validationError } = createProduccionValidation.validate(body);
    if (validationError) {
      return handleErrorClient(res, 400, "Error de validación", validationError.message);
    }

    // 2. Llamar al servicio para crear
    const [newProduccion, error] = await createProduccionService(body);
    if (error) {
      return handleErrorClient(res, 400, "Error al registrar producción", error);
    }

    // 3. Enviar respuesta de éxito
    handleSuccess(res, 201, "Producción registrada exitosamente", newProduccion);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}