"use strict";

import {
  createLoteService,
  getLotesActivosService, 
  getRecepcionesByEntidadService,
  getLoteByIdService, 
  updateLoteService, 
  deleteLoteService,
  restoreLoteService
} from "../services/loteRecepcion.service.js";
import { createLoteValidation, updateLoteValidation } from "../validations/loteRecepcion.validation.js";
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
        const { page, limit } = req.query;
        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 100
        };
        
        const [result, error] = await getLotesActivosService(options);
        if (error) return handleErrorClient(res, 404, error);
        handleSuccess(res, 200, "Lotes activos encontrados", result);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

/**
 * Obtiene todos los lotes (historial general).
 */
export async function getRecepciones(req, res) {
    try {
        const { page, limit } = req.query;
        const options = {
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 100
        };
        
        const [result, error] = await getLotesActivosService(options);
        if (error) return handleErrorClient(res, 404, error);
        handleSuccess(res, 200, "Listado de recepción obtenido", result);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

/**
 * Obtiene las recepciones filtradas por entidad.
 */
export async function getRecepcionesByEntidad(req, res) {
    try {
        const { entidadId } = req.params;
        const [lotes, error] = await getRecepcionesByEntidadService(entidadId);
        if (error) return handleErrorClient(res, 404, error);
        handleSuccess(res, 200, "Historial de entregas obtenido", lotes);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

export async function getLote(req, res) {
    try {
        const { id } = req.params;
        const [lote, error] = await getLoteByIdService(id);
        
        if (error) return handleErrorClient(res, 404, error);
        
        // Evitar caché para asegurar que se vean las nuevas relaciones
        res.setHeader('Cache-Control', 'no-store');
        
        handleSuccess(res, 200, "Lote encontrado", lote);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

export async function updateLote(req, res) {
    try {
        const { id } = req.params;
        const { body } = req;

        const { error: validationError } = updateLoteValidation.validate(body);
        if (validationError) return handleErrorClient(res, 400, validationError.message);

        const [lote, error] = await updateLoteService(id, body, req.user);
        if (error) return handleErrorClient(res, 400, error); 

        handleSuccess(res, 200, "Lote actualizado correctamente", lote);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

export async function deleteLote(req, res) {
    try {
        const { id } = req.params;
        const { force } = req.query;
        const [lote, error] = await deleteLoteService(id, req.user?.rol, force === 'true', req.user);
        if (error) return handleErrorClient(res, 400, error); 

        handleSuccess(res, 200, "Lote eliminado correctamente (soft delete)", lote);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}

export async function restoreLote(req, res) {
    try {
        const { id } = req.params;
        const [lote, error] = await restoreLoteService(id, req.user?.rol, req.user);
        if (error) return handleErrorClient(res, 400, error);

        handleSuccess(res, 200, "Lote restaurado exitosamente", lote);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}
