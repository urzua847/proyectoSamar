"use strict";

import {
  getProductosService,
  createProductoService,
  updateProductoService,
  deleteProductoService
} from "../services/definicionProducto.service.js";
import { createProductoValidation } from "../validations/definicionProducto.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function getProductos(req, res) {
  try {
    const [productos, error] = await getProductosService();
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Productos encontrados", productos);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function createProducto(req, res) {
  try {
    const { body } = req;

    const { error: validationError } = createProductoValidation.validate(body);
    if (validationError) {
      return handleErrorClient(res, 400, "Error de validación", validationError.message);
    }

    const [newProducto, error] = await createProductoService(body);
    if (error) return handleErrorClient(res, 400, "Error al crear producto", error);

    handleSuccess(res, 201, "Producto creado exitosamente", newProducto);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function updateProducto(req, res) {
  try {
    const { id } = req.params;
    const { body } = req;

    const [updatedProducto, error] = await updateProductoService(id, body);
    if (error) return handleErrorClient(res, 400, "Error al actualizar producto", error);

    handleSuccess(res, 200, "Producto actualizado exitosamente", updatedProducto);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function deleteProducto(req, res) {
  try {
    const { id } = req.params;
    const [success, error] = await deleteProductoService(id);
    
    if (error) return handleErrorClient(res, 400, "Error al eliminar producto", error);

    handleSuccess(res, 200, "Producto eliminado exitosamente");
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}