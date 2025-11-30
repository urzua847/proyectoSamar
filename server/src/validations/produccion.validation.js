"use strict";

import Joi from "joi";

export const createProduccionValidation = Joi.object({
  loteRecepcionId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "any.required": "El Lote de Origen es obligatorio.",
    }),
  definicionProductoId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "any.required": "El Producto es obligatorio.",
    }),
  ubicacionId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "any.required": "La Ubicación (Cámara/Contenedor) es obligatoria.",
    }),
  peso_neto_kg: Joi.number()
    .positive()
    .required()
    .messages({
      "number.base": "El peso debe ser un número.",
      "any.required": "El peso neto es obligatorio.",
    }),
  calibre: Joi.string()
    .max(100)
    .optional()
    .allow(null, '')
    .messages({
      "string.max": "El calibre es muy largo.",
    }),
}).unknown(false);