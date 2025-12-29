"use strict";

import Joi from "joi";

export const createProductoValidation = Joi.object({
  nombre: Joi.string()
    .min(3)
    .max(255)
    .required()
    .messages({
      "string.empty": "El nombre no puede estar vacío.",
      "any.required": "El nombre es obligatorio.",
      "string.min": "El nombre debe tener al menos 3 caracteres.",
    }),
    materiaPrimaId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
        "any.required": "Debes seleccionar la materia prima base.",
        "number.base": "El ID de materia prima debe ser un número."
    }),
  categoria: Joi.string()
    .min(3)
    .max(100)
    .optional() 
    .allow(null, ''),
  tipo: Joi.string()
    .valid("primario", "elaborado")
    .default("elaborado")
    .messages({
      "any.only": "El tipo debe ser 'primario' o 'elaborado'.",
    }),
  origen: Joi.string()
    .max(50)
    .allow(null, '')
    .optional(),
  calibres: Joi.string()
    .optional()
    .allow(null, '')
    .messages({
      "string.base": "Los calibres deben ser un texto separado por comas.",
    })
})
  .unknown(false)
  .messages({
    "object.unknown": "No se permiten propiedades adicionales.",
  });