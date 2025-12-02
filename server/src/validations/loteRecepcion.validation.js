"use strict";
import Joi from "joi";

export const createLoteValidation = Joi.object({
  // Usamos 'Id' porque el frontend nos enviará el ID del <select>
  proveedorId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "number.base": "El ID del proveedor debe ser un número.",
      "any.required": "El proveedor es obligatorio.",
    }),
  materiaPrimaId: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      "number.base": "El ID de la materia prima debe ser un número.",
      "any.required": "La materia prima es obligatoria.",
    }),
  peso_bruto_kg: Joi.number()
    .positive()
    .required()
    .messages({
        "number.base": "El peso bruto debe ser un número.",
        "number.positive": "El peso bruto debe ser un número positivo.",
        "any.required": "El peso bruto es obligatorio.",
    }),
  numero_bandejas: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
        "number.base": "El número de bandejas debe ser un número.",
        "number.integer": "El número de bandejas debe ser un entero.",
        "number.positive": "El número de bandejas debe ser positivo.",
        "any.required": "El número de bandejas es obligatorio.",
    }),
    pesadas: Joi.array()
    .items(Joi.number().positive()) 
    .optional() 
    .messages({
        "array.base": "El detalle de pesadas debe ser una lista.",
    }),
})
  .unknown(false)
  .messages({
    "object.unknown": "No se permiten propiedades adicionales.",
  });

export const updateLoteValidation = Joi.object({
  proveedorId: Joi.number()
    .integer()
    .positive()
    .optional(),
  materiaPrimaId: Joi.number()
    .integer()
    .positive()
    .optional(),
  peso_bruto_kg: Joi.number()
    .positive()
    .optional(),
  numero_bandejas: Joi.number()
    .integer()
    .positive()
    .optional(),
  pesadas: Joi.array()
    .items(Joi.number().positive())
    .optional(),
})
  .unknown(false)
  .messages({
    "object.unknown": "No se permiten propiedades adicionales.",
  });