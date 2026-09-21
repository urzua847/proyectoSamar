"use strict";

import Joi from "joi";

export const createProduccionYieldValidation = Joi.object({
  loteRecepcionId: Joi.number().integer().positive().required()
    .messages({ "any.required": "El ID del Lote es obligatorio." }),
  
  detalles: Joi.array().items(
    Joi.object({
      productoId: Joi.number().integer().positive().required(),
      peso: Joi.number().min(0).required(),
      nombre: Joi.string().required()
    })
  ).min(1).required(),
  observacion: Joi.string().allow('', null).optional()
}).unknown(false);

export const updateProduccionYieldValidation = Joi.object({
  detalles: Joi.array().items(
    Joi.object({
      productoId: Joi.number().integer().positive().required(),
      peso: Joi.number().min(0).required(),
      nombre: Joi.string().required()
    })
  ).min(1).required(),
  observacion: Joi.string().allow('', null).optional()
}).unknown(false);
