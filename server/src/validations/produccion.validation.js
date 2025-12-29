"use strict";

import Joi from "joi";

export const createProduccionYieldValidation = Joi.object({
  loteRecepcionId: Joi.number().integer().positive().required()
    .messages({ "any.required": "El ID del Lote es obligatorio." }),
  
  peso_carne_blanca: Joi.number().min(0).required(),
  peso_pinzas: Joi.number().min(0).required(),
  observacion: Joi.string().allow('', null).optional()
}).unknown(false);
