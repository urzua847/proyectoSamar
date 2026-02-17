"use strict";
import { AppDataSource } from "../config/configDb.js";
import Produccion from "../entity/produccion.entity.js";
import LoteRecepcion from "../entity/loteRecepcion.entity.js";
import { logCreate } from "./audit.service.js";

const produccionRepository = AppDataSource.getRepository(Produccion);
const loteRepository = AppDataSource.getRepository(LoteRecepcion);

export async function createProduccionYieldService(data, user = null) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { loteRecepcionId, peso_carne_blanca, peso_pinzas, observacion } = data;

    // 1. Validar existencia del lote
    const lote = await queryRunner.manager.findOne(LoteRecepcion, { where: { id: loteRecepcionId } });
    if (!lote) {
      await queryRunner.rollbackTransaction();
      return [null, "Lote no encontrado"];
    }

    // 2. Verificar que no exista registro previo
    const existingProduccion = await queryRunner.manager.findOne(Produccion, { 
      where: { loteRecepcion: { id: loteRecepcionId } } 
    });
    if (existingProduccion) {
      await queryRunner.rollbackTransaction();
      return [null, "Ya existe un registro de producción para este lote."];
    }

    // 3. Crear registro de producción
    const nuevoPesoCarne = Number(peso_carne_blanca);
    const nuevoPesoPinzas = Number(peso_pinzas);
    const total = nuevoPesoCarne + nuevoPesoPinzas;

    // VALIDACIÓN DE YIELD (Alta Prioridad)
    // El peso procesado no puede ser mayor al peso bruto original de la materia prima.
    if (total > Number(lote.peso_bruto_kg)) {
        await queryRunner.rollbackTransaction();
        return [null, `Error de Rendimiento: El total procesado (${total.toFixed(2)} kg) excede el peso bruto del lote (${Number(lote.peso_bruto_kg).toFixed(2)} kg).`];
    }

    const produccion = queryRunner.manager.create(Produccion, {
        loteRecepcion: lote,
        peso_carne_blanca: nuevoPesoCarne,
        peso_pinzas: nuevoPesoPinzas,
        peso_total: total,
        observacion
    });

    await queryRunner.manager.save(Produccion, produccion);

    // 4. Recalcular totales del lote
    const allProducciones = await queryRunner.manager.find(Produccion, { 
      where: { loteRecepcion: { id: loteRecepcionId } } 
    });
    
    const totalCarne = allProducciones.reduce((acc, p) => acc + Number(p.peso_carne_blanca), 0);
    const totalPinzas = allProducciones.reduce((acc, p) => acc + Number(p.peso_pinzas), 0);
    
    // 5. Actualizar lote (en la misma transacción)
    lote.peso_carne_blanca = totalCarne;
    lote.peso_pinzas = totalPinzas;
    lote.peso_total_producido = totalCarne + totalPinzas;
    lote.en_proceso_produccion = true; 
    
    await queryRunner.manager.save(LoteRecepcion, lote);

    // Registrar en auditoría
    await logCreate('Produccion', produccion.id, {
      loteRecepcionId: lote.id,
      lote_codigo: lote.codigo,
      peso_carne_blanca: produccion.peso_carne_blanca,
      peso_pinzas: produccion.peso_pinzas,
      peso_total: produccion.peso_total
    }, user);

    // 6. Commit si todo salió bien
    await queryRunner.commitTransaction();
    return [produccion, null];

  } catch (error) {
    // 7. Rollback en caso de error
    await queryRunner.rollbackTransaction();
    console.error("Error createProduccionYieldService:", error);
    return [null, error.message];
  } finally {
    // 8. Liberar recursos
    await queryRunner.release();
  }
}

export async function getProduccionesByLoteService(loteId) {
    try {
        const producciones = await produccionRepository.find({
            where: { loteRecepcion: { id: loteId } },
            order: { createdAt: "DESC" }
        });
        return [producciones, null];
    } catch (error) {
        return [null, error.message];
    }
}
