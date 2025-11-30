"use strict";

import { getUbicacionesService, createUbicacionService } from "../services/ubicacion.service.js";
import { createUbicacionValidation } from "../validations/ubicacion.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

export async function getUbicaciones(req, res) {
  try {
    const [ubicaciones, error] = await getUbicacionesService();
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Ubicaciones encontradas", ubicaciones);
  } catch (error) { handleErrorServer(res, 500, error.message); }
}

export async function createUbicacion(req, res) {
  try {
    const { error } = createUbicacionValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Error validación", error.message);
    
    const [newUbicacion, err] = await createUbicacionService(req.body);
    if (err) return handleErrorClient(res, 400, err);
    handleSuccess(res, 201, "Ubicación creada", newUbicacion);
  } catch (error) { handleErrorServer(res, 500, error.message); }
}