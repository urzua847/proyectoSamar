"use strict";
import Joi from "joi";

export const authValidation = Joi.object({
  username: Joi.string()
    .required()
    .messages({
      "string.empty": "El nombre de usuario no puede estar vacío.",
      "any.required": "El nombre de usuario es obligatorio.",
    }),
  password: Joi.string()
    .required()
    .messages({
      "string.empty": "La contraseña no puede estar vacía.",
      "any.required": "La contraseña es obligatoria.",
    }),
}).unknown(false).messages({
  "object.unknown": "No se permiten propiedades adicionales.",
});


export const registerValidation = Joi.object({
  nombreCompleto: Joi.string()
    .min(8) 
    .max(50)
    .required()
    .messages({
      "string.empty": "El nombre completo no puede estar vacío.",
      "any.required": "El nombre completo es obligatorio.",
      "string.min": "El nombre completo debe tener al menos 3 caracteres.",
    }),
  rut: Joi.string() 
    .required()
    .messages({
      "string.empty": "El rut no puede estar vacío.",
    }),
  username: Joi.string()
    .min(3)
    .required()
    .messages({
      "string.empty": "El nombre de usuario no puede estar vacío.",
      "any.required": "El nombre de usuario es obligatorio.",
      "string.min": "El nombre de usuario debe tener al menos 3 caracteres.",
    }),
  password: Joi.string()
    .min(5) 
    .required()
    .messages({
      "string.empty": "La contraseña no puede estar vacía.",
      "any.required": "La contraseña es obligatoria.",
      "string.min": "La contraseña debe tener al menos 6 caracteres.",
    }),
})
  .unknown(false)
  .messages({
  "object.unknown": "No se permiten propiedades adicionales.",
});