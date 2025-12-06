"use strict";

import { AppDataSource } from "../config/configDb.js";
import ProductoTerminado from "../entity/productoTerminado.entity.js";
import LoteRecepcion from "../entity/loteRecepcion.entity.js";
import DefinicionProducto from "../entity/definicionProducto.entity.js";
import Ubicacion from "../entity/ubicacion.entity.js";

const produccionRepository = AppDataSource.getRepository(ProductoTerminado);
const loteRepository = AppDataSource.getRepository(LoteRecepcion);
const productoDefRepository = AppDataSource.getRepository(DefinicionProducto);
const ubicacionRepository = AppDataSource.getRepository(Ubicacion);

export async function createProduccionService(data) {
  try {
    const { loteRecepcionId, items } = data;

    // 1. Validar que el Lote de Origen existe y está ABIERTO
    const loteOrigen = await loteRepository.findOne({ where: { id: loteRecepcionId } });
    if (!loteOrigen) return [null, "El Lote de Recepción no existe."];
    if (loteOrigen.estado === false) return [null, "El Lote está CERRADO, no se puede agregar producción."];

    const nuevosRegistros = [];

    // 2. Procesar cada item de la lista
    for (const item of items) {
        const { definicionProductoId, ubicacionId, peso_neto_kg, calibre } = item;

        // Validar Producto
        const definicion = await productoDefRepository.findOne({ where: { id: definicionProductoId } });
        if (!definicion) return [null, `El producto ID ${definicionProductoId} no existe.`];

        // Validar Ubicación
        const ubicacion = await ubicacionRepository.findOne({ where: { id: ubicacionId } });
        if (!ubicacion) return [null, `La ubicación ID ${ubicacionId} no existe.`];

        // Validar Calibre (Si aplica)
        if (definicion.calibres && definicion.calibres.length > 0) {
             // Si el producto tiene calibres, y el enviado no está en la lista (o es nulo), error.
             // Ojo: Si viene calibre, debe coincidir. Si no viene y es obligatorio en tu lógica, ajusta aquí.
            if (calibre && !definicion.calibres.includes(calibre)) {
                return [null, `El calibre '${calibre}' no es válido para ${definicion.nombre}.`];
            }
        }

        // Preparar instancia
        const nuevoProd = produccionRepository.create({
            peso_neto_kg,
            calibre,
            loteDeOrigen: loteOrigen,
            definicion: definicion,
            ubicacion: ubicacion,
            estado: "En Stock"
        });
        
        nuevosRegistros.push(nuevoProd);
    }

    // 3. Guardar todo (en una transacción idealmente, pero save con array funciona bien)
    await produccionRepository.save(nuevosRegistros);
    
    return [nuevosRegistros, null];

  } catch (error) {
    throw new Error(error.message);
  }
}