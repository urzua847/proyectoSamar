"use strict";

import Joi from "joi";

export const createMateriaPrimaValidation = Joi.object({
  nombre: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.empty": "El nombre no puede estar vacío.",
      "any.required": "El nombre es obligatorio.",
      "string.min": "El nombre debe tener al menos 3 caracteres.",
    }),
  rendimiento_teorico_global: Joi.number()
    .min(0)
    .max(100)
    .allow(null, "")
    .optional()
    .messages({
      "number.min": "El rendimiento teórico no puede ser menor a 0%.",
      "number.max": "El rendimiento teórico no puede ser mayor a 100%.",
      "number.base": "El rendimiento teórico debe ser un número válido.",
    }),
})
  .unknown(false)
  .messages({
    "object.unknown": "No se permiten propiedades adicionales.",
  });

export const updateMateriaPrimaValidation = Joi.object({
  nombre: Joi.string()
    .min(3)
    .max(100)
    .optional()
    .messages({
      "string.empty": "El nombre no puede estar vacío.",
      "string.min": "El nombre debe tener al menos 3 caracteres.",
    }),
  rendimiento_teorico_global: Joi.number()
    .min(0)
    .max(100)
    .allow(null, "")
    .optional()
    .messages({
      "number.min": "El rendimiento teórico no puede ser menor a 0%.",
      "number.max": "El rendimiento teórico no puede ser mayor a 100%.",
      "number.base": "El rendimiento teórico debe ser un número válido.",
    }),
})
  .unknown(false)
  .messages({
    "object.unknown": "No se permiten propiedades adicionales.",
  });