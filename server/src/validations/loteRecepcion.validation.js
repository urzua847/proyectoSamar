"use strict";
import Joi from "joi";

// 1. Definimos el esquema de la Tanda individual
const pesadaSchema = Joi.object({
    peso: Joi.number().positive().required(),
    bandejas: Joi.number().integer().positive().required()
});

// 2. Validación para CREAR
export const createLoteValidation = Joi.object({
  proveedorId: Joi.number().integer().positive().required()
    .messages({ "any.required": "El proveedor es obligatorio." }),
  materiaPrimaId: Joi.number().integer().positive().required()
    .messages({ "any.required": "La materia prima es obligatoria." }),
  peso_bruto_kg: Joi.number().positive().required(),
  numero_bandejas: Joi.number().integer().positive().required(),
  
  // Aceptamos el array de objetos
  pesadas: Joi.array().items(pesadaSchema).optional()
    .messages({ "array.base": "El detalle de pesadas debe ser una lista válida." }),
}).unknown(false);

// 3. Validación para EDITAR
export const updateLoteValidation = Joi.object({
  proveedorId: Joi.number().integer().positive().optional(),
  materiaPrimaId: Joi.number().integer().positive().optional(),
  peso_bruto_kg: Joi.number().positive().optional(),
  numero_bandejas: Joi.number().integer().positive().optional(),
  
  pesadas: Joi.array().items(pesadaSchema).optional(),
  
  estado: Joi.boolean().optional(),
  
  en_proceso_produccion: Joi.boolean().optional(),
  peso_carne_blanca: Joi.number().min(0).optional(),
  peso_pinzas: Joi.number().min(0).optional(),
  peso_total_producido: Joi.number().min(0).optional(),
  observacion_produccion: Joi.string().allow('').optional(),
  fecha_inicio_produccion: Joi.date().optional().allow(null),
}).unknown(false);