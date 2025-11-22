"use strict";

import {
  createLoteService,
  getLotesActivosService
} from "../services/loteRecepcion.service.js";
import { createLoteValidation } from "../validations/loteRecepcion.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

/**
 * Crea un nuevo lote de recepción.
 */
export async function createLote(req, res) {
  try {
    const { body } = req;
    // req.user.email viene del token JWT (authenticateJwt)
    const operarioEmail = req.user.email; 

    // 1. Validar los datos de entrada
    const { error: validationError } = createLoteValidation.validate(body);
    if (validationError) {
      return handleErrorClient(res, 400, "Error de validación", validationError.message);
    }

    // 2. Llamar al servicio
    const [newLote, error] = await createLoteService(body, operarioEmail);
    if (error) {
      return handleErrorClient(res, 400, "Error al crear el lote", error);
    }

    handleSuccess(res, 201, "Lote de recepción creado exitosamente", newLote);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

/**
 * Obtiene los lotes activos.
 */
export async function getLotesActivos(req, res) {
    try {
        const [lotes, error] = await getLotesActivosService();
        if (error) return handleErrorClient(res, 404, error);
        handleSuccess(res, 200, "Lotes activos encontrados", lotes);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}