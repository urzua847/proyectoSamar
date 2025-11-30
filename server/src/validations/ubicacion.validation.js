"use strict";

import Joi from "joi";

export const createUbicacionValidation = Joi.object({
  nombre: Joi.string().min(3).max(100).required(),
  tipo: Joi.string().valid("camara", "contenedor").required(),
}).unknown(false);