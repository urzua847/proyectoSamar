"use strict";

import { createVentaService, getVentasService } from "../services/venta.service.js";
import {
  handleErrorClient,
  handleErrorServer,
  handleSuccess,
} from "../handlers/responseHandlers.js";

export async function createVenta(req, res) {
  try {
    const { body } = req;

    // Validación básica
    if (!body.cliente || !body.productos || body.productos.length === 0) {
        return handleErrorClient(res, 400, "Faltan datos requeridos (cliente, productos).");
    }

    const [newVenta, error] = await createVentaService(body);
    if (error) {
      return handleErrorClient(res, 400, "Error al registrar venta", error);
    }

    handleSuccess(res, 201, "Venta registrada exitosamente", newVenta);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getVentas(req, res) {
    try {
        const [ventas, error] = await getVentasService();
        if (error) {
            return handleErrorClient(res, 400, "Error al obtener ventas", error);
        }
        handleSuccess(res, 200, "Ventas obtenidas exitosamente", ventas);
    } catch (error) {
        handleErrorServer(res, 500, error.message);
    }
}
