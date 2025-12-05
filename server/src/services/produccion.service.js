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

    // 1. Validar Lote de Origen
    const loteOrigen = await loteRepository.findOne({ where: { id: loteRecepcionId } });
    if (!loteOrigen) return [null, "El Lote de Recepción no existe."];

    // Inicializar peso_actual si es null
    if (loteOrigen.peso_actual === null || loteOrigen.peso_actual === undefined) {
        loteOrigen.peso_actual = loteOrigen.peso_bruto_kg;
    }

    // 2. Calcular peso total a descontar y validar items
    let pesoTotalDescontar = 0;
    const nuevasProducciones = [];

    for (const item of items) {
        const { definicionProductoId, ubicacionId, peso_neto_kg, calibre } = item;
        pesoTotalDescontar += parseFloat(peso_neto_kg);

        const definicion = await productoDefRepository.findOne({ where: { id: definicionProductoId } });
        if (!definicion) return [null, `El producto ID ${definicionProductoId} no existe.`];

        const ubicacion = await ubicacionRepository.findOne({ where: { id: ubicacionId } });
        if (!ubicacion) return [null, `La ubicación ID ${ubicacionId} no existe.`];

        // Validar Calibre
        if (definicion.calibres && definicion.calibres.length > 0) {
            if (!calibre || !definicion.calibres.includes(calibre)) {
                return [null, `El calibre '${calibre}' no es válido para ${definicion.nombre}.`];
            }
        }

        nuevasProducciones.push(produccionRepository.create({
            peso_neto_kg,
            peso_actual: peso_neto_kg, // Inicializamos con el peso neto
            calibre,
            loteDeOrigen: loteOrigen,
            definicion: definicion,
            ubicacion: ubicacion,
            estado: "En Stock"
        }));
    }

    // 3. Validar Stock Suficiente
    if (parseFloat(loteOrigen.peso_actual) < pesoTotalDescontar) {
        return [null, `Stock insuficiente. Disponible: ${loteOrigen.peso_actual} kg. Intentas usar: ${pesoTotalDescontar} kg`];
    }

    // 4. Transacción: Guardar todo y actualizar lote
    loteOrigen.peso_actual = parseFloat(loteOrigen.peso_actual) - pesoTotalDescontar;

    await AppDataSource.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.save(nuevasProducciones);
        await transactionalEntityManager.save(loteOrigen);
    });

    return [nuevasProducciones, null];

  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getProduccionService() {
    try {
        const produccion = await produccionRepository.find({
            relations: ["definicion", "loteDeOrigen", "ubicacion"]
        });
        return [produccion, null];
    } catch (error) {
        throw new Error(error.message);
    }
}