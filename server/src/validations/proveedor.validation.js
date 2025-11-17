"use strict";

import Joi from "joi";

export const createProveedorValidation = Joi.object({
  nombre: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
      "string.empty": "El nombre no puede estar vacío.",
      "any.required": "El nombre es obligatorio.",
      "string.min": "El nombre debe tener al menos 3 caracteres.",
    }),
})
  .unknown(false) 
  .messages({
    "object.unknown": "No se permiten propiedades adicionales.",
  });