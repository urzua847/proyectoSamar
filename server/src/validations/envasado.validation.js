"use strict";

import Joi from "joi";

const itemProduccionSchema = Joi.object({
  definicionProductoId: Joi.number().integer().positive().required(),
  ubicacionId: Joi.number().integer().positive().required(),
  peso_neto_kg: Joi.number().positive().required(),
  calibre: Joi.string().max(100).optional().allow(null, ''),
});

export const createProduccionValidation = Joi.object({
  loteRecepcionId: Joi.number().integer().positive().required()
    .messages({ "any.required": "El Lote de Origen es obligatorio." }),
  
  items: Joi.array().items(itemProduccionSchema).min(1).required()
    .messages({ "array.min": "Debes registrar al menos un producto." })
}).unknown(false);