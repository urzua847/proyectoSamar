import Joi from 'joi';

export const createProduccionSchema = Joi.object({
    loteRecepcionId: Joi.number().integer().required().messages({
        'any.required': 'El ID del lote de recepción es obligatorio',
        'number.base': 'El ID del lote de recepción debe ser un número'
    }),
    items: Joi.array().items(
        Joi.object({
            definicionProductoId: Joi.number().integer().required(),
            ubicacionId: Joi.number().integer().required(),
            peso_neto_kg: Joi.number().positive().required(),
            calibre: Joi.string().allow(null, '').optional()
        })
    ).min(1).required().messages({
        'array.min': 'Debe ingresar al menos un producto'
    }),
    cerrar_lote: Joi.boolean().optional(),
    merma_kg: Joi.number().min(0).optional()
});

export const createTrasladoSchema = Joi.object({
    destinoId: Joi.number().integer().required().messages({
        'any.required': 'El contenedor de destino es obligatorio'
    }),
    peso_caja: Joi.number().positive().required().messages({
        'any.required': 'El peso por caja es obligatorio',
        'number.positive': 'El peso por caja debe ser un número positivo mayor a 0'
    }),
    items: Joi.array().items(
        Joi.object({
            definicionProductoId: Joi.number().integer().required(),
            cantidad: Joi.number().positive().required(),
            calibre: Joi.string().allow(null, '').optional(),
            loteId: Joi.number().integer().allow(null).optional()
        })
    ).min(1).required().messages({
        'array.min': 'Debe ingresar al menos un producto a trasladar'
    })
});
