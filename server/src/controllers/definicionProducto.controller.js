"use strict";

import {
  getProductosService,
  createProductoService,
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