"use strict";

import {
  getEntidadesService,
  createEntidadService,
  updateEntidadService,
  deleteEntidadService
} from "../services/entidad.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function getEntidades(req, res) {
  try {
    const { tipo } = req.query; 
    const [entidades, error] = await getEntidadesService(tipo);
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Entidades encontradas", entidades);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function createEntidad(req, res) {
  try {
    const { body } = req;
    if (!body.tipo || !['cliente', 'proveedor'].includes(body.tipo)) {
        return handleErrorClient(res, 400, "Debe especificar tipo (cliente|proveedor)");
    }

    const [newEntidad, error] = await createEntidadService(body, body.tipo);
    if (error) return handleErrorClient(res, 400, "Error al crear entidad", error);

    handleSuccess(res, 201, "Entidad creada exitosamente", newEntidad);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updateEntidad(req, res) {
  try {
    const { id } = req.params;
    const { body } = req;
    const [updated, error] = await updateEntidadService(id, body);
    if (error) return handleErrorClient(res, 400, "Error al actualizar", error);
    handleSuccess(res, 200, "Entidad actualizada", updated);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function deleteEntidad(req, res) {
  try {
    const { id } = req.params;
    const [success, error] = await deleteEntidadService(id);
    if (error) return handleErrorClient(res, 400, "Error al eliminar", error);
    handleSuccess(res, 200, "Entidad eliminada");
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
