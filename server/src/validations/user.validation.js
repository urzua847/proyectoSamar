"use strict";
import Joi from "joi";

export const userQueryValidation = Joi.object({
  id: Joi.number().integer().positive(),
  email: Joi.string().email(),
  rut: Joi.string(),
})
  .or("id", "email", "rut") 
  .messages({
    "object.missing": "Debes proporcionar al menos un parámetro: id, email o rut.",
  });

export const userBodyValidation = Joi.object({
  nombreCompleto: Joi.string().min(3).max(50),
  email: Joi.string().email(),
  newPassword: Joi.string().min(6).allow(''), 
  rut: Joi.string(),
  rol: Joi.string(),
  password: Joi.string(), 
})
  .or("nombreCompleto", "email", "newPassword", "rut", "rol");