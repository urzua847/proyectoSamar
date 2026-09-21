"use strict";
import { AppDataSource } from "../config/configDb.js";
import Produccion from "../entity/produccion.entity.js";
import LoteRecepcion from "../entity/loteRecepcion.entity.js";
import ProductoTerminado from "../entity/productoTerminado.entity.js";
import { logCreate, logUpdate } from "./audit.service.js";

const produccionRepository = AppDataSource.getRepository(Produccion);
const loteRepository = AppDataSource.getRepository(LoteRecepcion);

export async function createProduccionYieldService(data, user = null) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { loteRecepcionId, detalles, observacion } = data;

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
    const total = detalles.reduce((acc, item) => acc + Number(item.peso), 0);

    // VALIDACIÓN DE YIELD (Alta Prioridad)
    if (total > Number(lote.peso_bruto_kg)) {
        await queryRunner.rollbackTransaction();
        return [null, `Error de Rendimiento: El total procesado (${total.toFixed(2)} kg) excede el peso bruto del lote (${Number(lote.peso_bruto_kg).toFixed(2)} kg).`];
    }

    const produccion = queryRunner.manager.create(Produccion, {
        loteRecepcion: lote,
        detalles,
        peso_total: total,
        observacion
    });

    await queryRunner.manager.save(Produccion, produccion);

    // 4. Actualizar lote (en la misma transacción)
    lote.peso_total_producido = total;
    lote.observacion_produccion = observacion || null;
    lote.en_proceso_produccion = true; 
    
    await queryRunner.manager.save(LoteRecepcion, lote);

    // Registrar en auditoría
    await logCreate('Produccion', produccion.id, {
      loteRecepcionId: lote.id,
      lote_codigo: lote.codigo,
      detalles: produccion.detalles,
      peso_total: produccion.peso_total
    }, user);

    // 5. Commit si todo salió bien
    await queryRunner.commitTransaction();
    return [produccion, null];

  } catch (error) {
    // 6. Rollback en caso de error
    await queryRunner.rollbackTransaction();
    console.error("Error createProduccionYieldService:", error);
    return [null, error.message];
  } finally {
    // 7. Liberar recursos
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

export async function getProduccionByLoteService(loteId) {
    try {
        const produccion = await produccionRepository.findOne({
            where: { loteRecepcion: { id: loteId } }
        });
        return [produccion, null];
    } catch (error) {
        return [null, error.message];
    }
}

export async function updateProduccionYieldService(loteId, data, user = null) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const { detalles, observacion } = data;

        // 1. Buscar la producción existente del lote
        const produccion = await queryRunner.manager.findOne(Produccion, {
            where: { loteRecepcion: { id: loteId } }
        });
        if (!produccion) {
            await queryRunner.rollbackTransaction();
            return [null, "No existe registro de producción para este lote."];
        }

        // 2. Verificar si ya fue editada
        if (produccion.editada) {
            await queryRunner.rollbackTransaction();
            return [null, "Este registro ya fue editado una vez. No se permiten más modificaciones."];
        }

        // Guardar estado previo para la auditoría
        const previousData = {
            detalles: produccion.detalles,
            peso_total: Number(produccion.peso_total)
        };

        // 3. Verificar que no haya productos en cámara para este lote
        const productosEnCamara = await queryRunner.manager.count(ProductoTerminado, {
            where: { loteDeOrigen: { id: loteId } }
        });
        if (productosEnCamara > 0) {
            await queryRunner.rollbackTransaction();
            return [null, "No se puede editar: ya existen productos de este lote ingresados en Cámaras."];
        }

        // 4. Obtener el lote para validar y recalcular
        const lote = await queryRunner.manager.findOne(LoteRecepcion, { where: { id: loteId } });
        if (!lote) {
            await queryRunner.rollbackTransaction();
            return [null, "Lote no encontrado."];
        }

        const total = detalles.reduce((acc, item) => acc + Number(item.peso), 0);

        // 5. Validación de yield
        if (total > Number(lote.peso_bruto_kg)) {
            await queryRunner.rollbackTransaction();
            return [null, `Error de Rendimiento: El total procesado (${total.toFixed(2)} kg) excede el peso bruto del lote (${Number(lote.peso_bruto_kg).toFixed(2)} kg).`];
        }

        // 6. Actualizar producción y marcar como editada
        produccion.detalles = detalles;
        produccion.peso_total = total;
        produccion.observacion = observacion || produccion.observacion;
        produccion.editada = true;
        await queryRunner.manager.save(Produccion, produccion);

        // 7. Recalcular y actualizar lote
        lote.peso_total_producido = total;
        lote.observacion_produccion = observacion !== undefined ? observacion : lote.observacion_produccion;
        await queryRunner.manager.save(LoteRecepcion, lote);

        await logUpdate('Produccion', produccion.id, previousData, {
            detalles,
            peso_total: total
        }, user);

        await queryRunner.commitTransaction();
        return [produccion, null];

    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error("Error updateProduccionYieldService:", error);
        return [null, error.message];
    } finally {
        await queryRunner.release();
    }
}
