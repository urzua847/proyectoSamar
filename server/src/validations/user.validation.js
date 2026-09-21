"use strict";
import Joi from "joi";

export const userQueryValidation = Joi.object({
  id: Joi.number().integer().positive(),
  username: Joi.string(),
  rut: Joi.string(),
})
  .or("id", "username", "rut") 
  .messages({
    "object.missing": "Debes proporcionar al menos un parámetro: id, username o rut.",
  });

export const userBodyValidation = Joi.object({
  nombreCompleto: Joi.string().min(3).max(50),
  username: Joi.string().min(3),
  email: Joi.string().email().allow('', null),
  newPassword: Joi.string().min(6).allow(''), 
  rut: Joi.string(),
  rol: Joi.string(),
  password: Joi.string(), 
})
  .or("nombreCompleto", "username", "email", "newPassword", "rut", "rol");

export const createUserValidation = Joi.object({
  nombreCompleto: Joi.string().min(3).max(50).required(),
  username: Joi.string().min(3).required(),
  email: Joi.string().email().allow('', null),
  rut: Joi.string().required(),
  password: Joi.string().min(6).required(),
  rol: Joi.string().valid('administrador', 'usuario', 'operario', 'control_contenedor').required(),
}).unknown(false);