"use strict";

import {
  getProveedoresService,
  createProveedorService,
} from "../services/proveedor.service.js";
import { createProveedorValidation } from "../validations/proveedor.validation.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js"; 

export async function getProveedores(req, res) {
  try {
    const [proveedores, error] = await getProveedoresService();
    if (error) {
      return handleErrorClient(res, 404, error);
    }
    handleSuccess(res, 200, "Proveedores encontrados", proveedores);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function createProveedor(req, res) {
  try {
    const { body } = req;

    // 1. Validar los datos de entrada
    const { error: validationError } = createProveedorValidation.validate(body);
    if (validationError) {
      return handleErrorClient(res, 400, "Error de validación", validationError.message);
    }

    // 2. Llamar al servicio para crear
    const [newProveedor, error] = await createProveedorService(body);
    if (error) {
      return handleErrorClient(res, 400, "Error al crear proveedor", error);
    }

    // 3. Enviar respuesta de éxito
    handleSuccess(res, 201, "Proveedor creado exitosamente", newProveedor);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}