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

export const createUserValidation = Joi.object({
  nombreCompleto: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  rut: Joi.string().required(),
  password: Joi.string().min(6).required(),
  rol: Joi.string().valid('administrador', 'usuario', 'operario').required(),
}).unknown(false);