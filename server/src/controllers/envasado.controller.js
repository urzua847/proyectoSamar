"use strict";

import { createProduccionService, deleteProduccionService, deleteManyProduccionService, getProduccionesService, getStockCamarasService, getStockContenedoresService, getResumenProduccionByLoteService } from "../services/envasado.service.js";
import { createProduccionValidation } from "../validations/envasado.validation.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";

export async function createProduccion(req, res) {
  try {
    const { error } = createProduccionValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Error de validación", error.message);

    const [nuevosProductos, errorService] = await createProduccionService(req.body, req.user);
    if (errorService) return handleErrorClient(res, 400, errorService);

    handleSuccess(res, 201, "Producción registrada exitosamente", { cantidad: nuevosProductos.length });
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function deleteProduccion(req, res) {
  try {
    const { id } = req.params;
    const [result, error] = await deleteProduccionService(id);
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Producto eliminado exitosamente");
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function deleteManyProduccion(req, res) {
  try {
    const { ids } = req.body;
    const [result, error] = await deleteManyProduccionService(ids);
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Productos eliminados exitosamente");
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getResumenProduccionByLote(req, res) {
  try {
    const { loteId } = req.params;
    const [summary, error] = await getResumenProduccionByLoteService(loteId);
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Resumen obtenido", summary);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getProducciones(req, res) {
  try {
    const { page, limit } = req.query;
    const options = {
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 100  // Default 100 for backward compat
    };

    const [result, error] = await getProduccionesService(options);
    if (error) return handleErrorClient(res, 404, error);
    
    handleSuccess(res, 200, "Historial de producción obtenido", result);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getStockCamaras(req, res) {
  try {
    const [stock, error] = await getStockCamarasService();
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Stock de cámaras obtenido", stock);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getStockContenedores(req, res) {
  try {
    const [stock, error] = await getStockContenedoresService();
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Stock de contenedores obtenido", stock);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

