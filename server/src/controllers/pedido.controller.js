"use strict";

import { createPedidoService, getPedidosService } from "../services/pedido.service.js";
import { handleErrorClient, handleErrorServer, handleSuccess } from "../handlers/responseHandlers.js";
import Joi from "joi";

const pedidoSchema = Joi.object({
  cliente: Joi.string().required(),
  numero_guia: Joi.string().required(),
  fecha: Joi.date().optional(),
  items: Joi.array().items(
      Joi.object({
          productoId: Joi.number().optional(),
          productoIds: Joi.array().items(Joi.number()).optional(),
          cantidad_bultos: Joi.number().positive().integer().required()
      }).or('productoId', 'productoIds')
  ).min(1).required()
});

export async function createPedido(req, res) {
  try {
    const { error } = pedidoSchema.validate(req.body);
    if (error) return handleErrorClient(res, 400, "Error de validación", error.message);

    const [pedido, errorService] = await createPedidoService(req.body);
    if (errorService) return handleErrorClient(res, 400, errorService);

    handleSuccess(res, 201, "Pedido registrado exitosamente", pedido);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}

export async function getPedidos(req, res) {
  try {
    const [pedidos, error] = await getPedidosService();
    if (error) return handleErrorClient(res, 404, error);
    handleSuccess(res, 200, "Historial de pedidos obtenido", pedidos);
  } catch (error) {
    handleErrorServer(res, 500, error.message);
  }
}
