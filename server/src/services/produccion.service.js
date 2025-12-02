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
    const { loteRecepcionId, definicionProductoId, ubicacionId, peso_neto_kg, calibre } = data;

    // 1. Validar existencias
    const loteOrigen = await loteRepository.findOne({ where: { id: loteRecepcionId } });
    if (!loteOrigen) return [null, "El Lote de Recepción no existe."];

    const definicion = await productoDefRepository.findOne({ where: { id: definicionProductoId } });
    if (!definicion) return [null, "El Producto seleccionado no existe."];

    const ubicacion = await ubicacionRepository.findOne({ where: { id: ubicacionId } });
    if (!ubicacion) return [null, "La Ubicación seleccionada no existe."];

    // 2. Validar Calibre (Si el producto tiene lista de calibres, debe coincidir)
    if (definicion.calibres && definicion.calibres.length > 0) {
        if (!calibre || !definicion.calibres.includes(calibre)) {
            return [null, `El calibre '${calibre}' no es válido. Opciones: ${definicion.calibres.join(", ")}`];
        }
    }

    // 3. Guardar Producción
    const nuevaProduccion = produccionRepository.create({
      peso_neto_kg,
      calibre,
      loteDeOrigen: loteOrigen,
      definicion: definicion,
      ubicacion: ubicacion,
      estado: "En Stock"
    });

    await produccionRepository.save(nuevaProduccion);
    return [nuevaProduccion, null];

  } catch (error) {
    throw new Error(error.message);
  }
}