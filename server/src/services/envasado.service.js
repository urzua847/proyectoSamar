"use strict";
import { AppDataSource } from "../config/configDb.js";
import ProductoTerminado from "../entity/productoTerminado.entity.js";
import LoteRecepcion from "../entity/loteRecepcion.entity.js";
import DefinicionProducto from "../entity/definicionProducto.entity.js";
import Ubicacion from "../entity/ubicacion.entity.js";
import { logCreate } from "./audit.service.js";

const produccionRepository = AppDataSource.getRepository(ProductoTerminado);
const loteRepository = AppDataSource.getRepository(LoteRecepcion);
const productoDefRepository = AppDataSource.getRepository(DefinicionProducto);
const ubicacionRepository = AppDataSource.getRepository(Ubicacion);

export async function createProduccionService(data, user = null) {
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const { loteRecepcionId, items } = data;

    // 1. Validar existencia del lote de origen
    const loteOrigen = await queryRunner.manager.findOne(LoteRecepcion, { where: { id: loteRecepcionId } });
    if (!loteOrigen) {
      await queryRunner.rollbackTransaction();
      return [null, "El Lote de Recepción no existe."];
    }
    if (loteOrigen.estado === false) {
      await queryRunner.rollbackTransaction();
      return [null, "El Lote está CERRADO."];
    }

    // 2. Pre-cargar definiciones de productos
    let newPinzaKg = 0;
    let newCarneKg = 0;
    
    const distinctDefIds = [...new Set(items.map(i => i.definicionProductoId))];
    const definitions = await queryRunner.manager.findByIds(DefinicionProducto, distinctDefIds);
    const defMap = new Map(definitions.map(d => [d.id, d]));

    const normalize = (str) => str ? str.toLowerCase().trim() : '';

    // 3. Calcular totales por origen
    for (const item of items) {
        const def = defMap.get(item.definicionProductoId);
        if (def && def.origen) {
            const org = normalize(def.origen);
            if (org === 'pinza' || org === 'pinzas') newPinzaKg += Number(item.peso_neto_kg);
            if (org === 'carne blanca' || org === 'carne_blanca') newCarneKg += Number(item.peso_neto_kg);
        }
    }

    // 4. Validar límites de rendimiento
    const hasYieldLimits = (Number(loteOrigen.peso_pinzas || 0) > 0) || (Number(loteOrigen.peso_carne_blanca || 0) > 0);

    if (hasYieldLimits) {
        for (const item of items) {
            const def = defMap.get(item.definicionProductoId);
            if (def && def.tipo === 'elaborado' && !normalize(def.origen)) {
                await queryRunner.rollbackTransaction();
                return [null, `Error de Control: El producto '${def.nombre}' no tiene definido un 'Origen' válido (Pinza/Carne).`];
            }
        }
    }

    // 5. Validar límite de Pinzas
    if (newPinzaKg > 0) {
        const currentPinzaSum = await queryRunner.manager.getRepository(ProductoTerminado)
            .createQueryBuilder("prod")
            .leftJoin("prod.definicion", "def")
            .where("prod.loteDeOrigenId = :loteId", { loteId: loteRecepcionId })
            .andWhere("(LOWER(def.origen) = 'pinza' OR LOWER(def.origen) = 'pinzas')")
            .select("SUM(prod.peso_neto_kg)", "sum")
            .getRawOne();
        
        const totalPinza = Number(currentPinzaSum.sum || 0) + newPinzaKg;
        const limitPinza = Number(loteOrigen.peso_pinzas || 0);

        if (totalPinza > limitPinza) {
            await queryRunner.rollbackTransaction();
            return [null, `Error: Se excede el límite de PINZAS. Disponible: ${(limitPinza - Number(currentPinzaSum.sum || 0)).toFixed(2)} kg. Intentas guardar: ${newPinzaKg.toFixed(2)} kg.`];
        }
    }

    // 6. Validar límite de Carne Blanca
    if (newCarneKg > 0) {
        const currentCarneSum = await queryRunner.manager.getRepository(ProductoTerminado)
            .createQueryBuilder("prod")
            .leftJoin("prod.definicion", "def")
            .where("prod.loteDeOrigenId = :loteId", { loteId: loteRecepcionId })
            .andWhere("(LOWER(def.origen) = 'carne blanca' OR LOWER(def.origen) = 'carne_blanca')")
            .select("SUM(prod.peso_neto_kg)", "sum")
            .getRawOne();
        
        const totalCarne = Number(currentCarneSum.sum || 0) + newCarneKg;
        const limitCarne = Number(loteOrigen.peso_carne_blanca || 0);

        if (totalCarne > limitCarne) {
            await queryRunner.rollbackTransaction();
            return [null, `Error: Se excede el límite de CARNE BLANCA. Disponible: ${(limitCarne - Number(currentCarneSum.sum || 0)).toFixed(2)} kg. Intentas guardar: ${newCarneKg.toFixed(2)} kg.`];
        }
    }

    // 7. Crear productos terminados
    const nuevosRegistros = [];

    for (const item of items) {
        const { definicionProductoId, ubicacionId, peso_neto_kg, calibre } = item;

        const definicion = await queryRunner.manager.findOne(DefinicionProducto, { where: { id: definicionProductoId } });
        if (!definicion) {
            await queryRunner.rollbackTransaction();
            return [null, `Producto ID ${definicionProductoId} inválido.`];
        }

        const ubicacion = await queryRunner.manager.findOne(Ubicacion, { where: { id: ubicacionId } });
        if (!ubicacion) {
            await queryRunner.rollbackTransaction();
            return [null, `Ubicación ID ${ubicacionId} inválida.`];
        }

        if (definicion.calibres && definicion.calibres.length > 0) {
            if (calibre && !definicion.calibres.includes(calibre)) {
                await queryRunner.rollbackTransaction();
                return [null, `Calibre '${calibre}' inválido para ${definicion.nombre}.`];
            }
        }

        const nuevoProd = queryRunner.manager.create(ProductoTerminado, {
            peso_neto_kg,
            calibre,
            loteDeOrigen: loteOrigen,
            definicion: definicion,
            ubicacion: ubicacion,
            estado: "En Stock"
        });
        
        nuevosRegistros.push(nuevoProd);
    }

    // 8. Guardar todos los productos en la misma transacción
    await queryRunner.manager.save(ProductoTerminado, nuevosRegistros);

    // Registrar en auditoría con detalle completo
    await logCreate('ProductoTerminado', null, {
      loteRecepcionId: loteOrigen.id,
      lote_codigo: loteOrigen.codigo,
      cantidad_productos: nuevosRegistros.length,
      peso_total_kg: nuevosRegistros.reduce((acc, p) => acc + Number(p.peso_neto_kg), 0).toFixed(2),
      detalle_productos: nuevosRegistros.map(p => ({
        producto: p.definicion.nombre,
        peso_neto_kg: p.peso_neto_kg,
        calibre: p.calibre || 'N/A',
        ubicacion: p.ubicacion.nombre,
        origen: p.definicion.origen || 'N/A'
      }))
    }, user);

    // 9. Commit exitoso
    await queryRunner.commitTransaction();
    return [nuevosRegistros, null];

  } catch (error) {
    // 10. Rollback en caso de error
    await queryRunner.rollbackTransaction();
    console.error("Error en createProduccionService:", error);
    throw new Error(error.message);
  } finally {
    // 11. Liberar recursos
    await queryRunner.release();
  }
}

export async function deleteProduccionService(id) {
    try {
        const prod = await produccionRepository.findOne({ where: { id } });
        if (!prod) return [null, "Producto no encontrado"];

        await produccionRepository.remove(prod);
        return [true, null];
    } catch (error) {
        console.error("Error deleteProduccionService:", error);
        return [null, error.message];
    }
}

export async function deleteManyProduccionService(ids) {
    try {
        if (!ids || ids.length === 0) return [null, "No hay IDs para eliminar"];
        
        await produccionRepository.delete(ids);
        return [true, null];
    } catch (error) {
        console.error("Error deleteManyProduccionService:", error);
        return [null, error.message];
    }
}


export async function getStockCamarasService() {
  try {
    const stock = await produccionRepository
      .createQueryBuilder("prod")
      .leftJoin("prod.ubicacion", "ubi")
      .leftJoin("prod.definicion", "def")
      .leftJoin("prod.loteDeOrigen", "lote")
      .leftJoin("lote.materiaPrima", "mp")
      .select("ubi.nombre", "ubicacionNombre")
      .addSelect("def.nombre", "productoNombre")
      .addSelect("def.id", "definicionProductoId")
      .addSelect("prod.calibre", "calibre")
      .addSelect("lote.codigo", "loteCodigo")
      .addSelect("mp.nombre", "materiaPrimaNombre")
      .addSelect("SUM(prod.peso_neto_kg)", "totalKilos")
      .addSelect("COUNT(prod.id)", "totalCantidad")
      .addSelect("array_agg(prod.id)", "ids")
      .where("prod.estado = :estado", { estado: "En Stock" })
      .andWhere("ubi.tipo = :tipo", { tipo: "camara" })
      .groupBy("ubi.nombre")
      .addGroupBy("def.nombre")
      .addGroupBy("def.id")
      .addGroupBy("prod.calibre")
      .addGroupBy("lote.codigo")
      .addGroupBy("mp.nombre")
      .orderBy("ubi.nombre", "ASC")
      .getRawMany();

    const formattedStock = stock.map(item => ({
        ubicacionNombre: item.ubicacionNombre || item.ubicacionnombre,
        productoNombre: item.productoNombre || item.productonombre,
        definicionProductoId: item.definicionProductoId || item.definicionproductoid,
        calibre: item.calibre,
        loteCodigo: item.loteCodigo || item.lotecodigo,
        materiaPrimaNombre: item.materiaPrimaNombre || item.materiaprimanombre,
        totalKilos: item.totalKilos || item.totalkilos,
        totalCantidad: Number(item.totalCantidad || item.totalcantidad),
        ids: item.ids
    }));

    return [formattedStock, null];
  } catch (error) {
    console.error("Error en getStockCamarasService:", error); 
    throw new Error(error.message);
  }
}

export async function getStockContenedoresService() {
  try {
    const stock = await produccionRepository
      .createQueryBuilder("prod")
      .leftJoin("prod.ubicacion", "ubi")
      .leftJoin("prod.definicion", "def")
      .leftJoin("prod.loteDeOrigen", "lote")
      .select("ubi.nombre", "ubicacionNombre")
      .addSelect("ubi.id", "contenedorId")
      .addSelect("def.nombre", "productoNombre")
      .addSelect("def.id", "definicionProductoId")
      .addSelect("prod.calibre", "calibre")
      .addSelect("lote.codigo", "loteCodigo")
      .addSelect("lote.id", "loteId")
      .addSelect("SUM(prod.peso_neto_kg)", "totalKilos")
      .addSelect("COUNT(prod.id)", "totalCantidad")
      .addSelect("array_agg(prod.id)", "ids")
      .where("prod.estado = :estado", { estado: "En Stock" })
      .andWhere("ubi.tipo = :tipo", { tipo: "contenedor" })
      .groupBy("ubi.nombre")
      .addGroupBy("ubi.id")
      .addGroupBy("def.nombre")
      .addGroupBy("def.id")
      .addGroupBy("prod.calibre")
      .addGroupBy("lote.codigo")
      .addGroupBy("lote.id")
      .orderBy("ubi.nombre", "ASC")
      .getRawMany();

    const formattedStock = stock.map(item => ({
        ubicacionNombre: item.ubicacionNombre || item.ubicacionnombre,
        contenedorId: item.contenedorId || item.contenedorid,
        productoNombre: item.productoNombre || item.productonombre,
        definicionProductoId: item.definicionProductoId || item.definicionproductoid,
        calibre: item.calibre,
        loteCodigo: item.loteCodigo || item.lotecodigo,
        loteId: item.loteId || item.loteid,
        totalKilos: item.totalKilos || item.totalkilos,
        totalCantidad: Number(item.totalCantidad || item.totalcantidad),
        ids: item.ids
    }));

    return [formattedStock, null];
  } catch (error) {
    console.error("Error en getStockContenedoresService:", error);
    throw new Error(error.message);
  }
}

export async function getProduccionesService(options = {}) {
  try {
    // Pagination parameters with defaults
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 50; // Default 50 items per page
    const offset = (page - 1) * limit;

    // Base query builder
    const queryBuilder = produccionRepository.createQueryBuilder("prod")
        .leftJoin("prod.loteDeOrigen", "lote")
        .leftJoin("lote.materiaPrima", "mp")
        .leftJoin("prod.definicion", "def")
        .leftJoin("prod.ubicacion", "ubi")
        .select("lote.codigo", "loteCodigo")
        .addSelect("lote.id", "loteId")
        .addSelect("mp.nombre", "materiaPrimaNombre")
        .addSelect("def.nombre", "productoFinalNombre")
        .addSelect("def.id", "definicionProductoId")
        .addSelect("prod.calibre", "calibre")
        .addSelect("ubi.nombre", "ubicacionNombre")
        .addSelect("TO_CHAR(prod.fecha_produccion, 'HH24:MI DD-MM')", "horaIngreso")
        .addSelect("COUNT(prod.id)", "cantidad")
        .addSelect("SUM(prod.peso_neto_kg)", "peso_neto_kg")
        .addSelect("array_agg(prod.id)", "ids")
        .addSelect("MIN(prod.id)", "id")
        .where("ubi.tipo = :tipo", { tipo: "camara" })
        .groupBy("lote.codigo")
        .addGroupBy("lote.id")
        .addGroupBy("mp.nombre")
        .addGroupBy("def.nombre")
        .addGroupBy("def.id")
        .addGroupBy("prod.calibre")
        .addGroupBy("ubi.nombre")
        .addGroupBy("TO_CHAR(prod.fecha_produccion, 'HH24:MI DD-MM')")
        .orderBy("lote.id", "DESC")
        .addOrderBy("MAX(prod.fecha_produccion)", "DESC");

    // Get total count before applying pagination (for frontend pagination controls)
    const totalCount = await queryBuilder.getCount();

    // Apply pagination
    const producciones = await queryBuilder
        .limit(limit)
        .offset(offset)
        .getRawMany();

    // Transform results
    const formatted = producciones.map(p => ({
        loteCodigo: p.loteCodigo || p.lotecodigo,
        loteId: p.loteId || p.loteid,
        materiaPrimaNombre: p.materiaPrimaNombre || p.materiaprimanombre,
        productoFinalNombre: p.productoFinalNombre || p.productofinalnombre,
        definicionProductoId: p.definicionProductoId || p.definicionproductoid,
        calibre: p.calibre,
        ubicacionNombre: p.ubicacionNombre || p.ubicacionnombre,
        horaIngreso: p.horaIngreso || p.horaingreso,
        peso_neto_kg: Number(p.peso_neto_kg || p.peso_neto_kg).toFixed(2),
        cantidad: Number(p.cantidad),
        ids: p.ids,
        id: p.id
    }));

    // Return data with pagination metadata
    return [{
      data: formatted,
      pagination: {
        currentPage: page,
        pageSize: limit,
        totalItems: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1
      }
    }, null];

  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getResumenProduccionByLoteService(loteId) {
    try {
        const lote = await loteRepository.findOne({ where: { id: loteId } });
        if (!lote) return [null, "Lote no encontrado"];

        const sumCarne = await produccionRepository
            .createQueryBuilder("prod")
            .leftJoin("prod.definicion", "def")
            .where("prod.loteDeOrigenId = :loteId", { loteId })
            .andWhere("(LOWER(def.origen) = 'carne blanca' OR LOWER(def.origen) = 'carne_blanca')")
            .select("SUM(prod.peso_neto_kg)", "total")
            .getRawOne();
        
        const sumPinza = await produccionRepository
            .createQueryBuilder("prod")
            .leftJoin("prod.definicion", "def")
            .where("prod.loteDeOrigenId = :loteId", { loteId })
            .andWhere("(LOWER(def.origen) = 'pinza' OR LOWER(def.origen) = 'pinzas')")
            .select("SUM(prod.peso_neto_kg)", "total")
            .getRawOne();

        const usedCarne = Number(sumCarne.total || 0);
        const usedPinzas = Number(sumPinza.total || 0);

        const limitCarne = Number(lote.peso_carne_blanca || 0);
        const limitPinzas = Number(lote.peso_pinzas || 0);

        return [{
            loteId: lote.id,
            input: {
                carne: limitCarne,
                pinzas: limitPinzas
            },
            used: {
                carne: usedCarne,
                pinzas: usedPinzas
            },
            balance: {
                carne: limitCarne - usedCarne,
                pinzas: limitPinzas - usedPinzas
            }
        }, null];

    } catch (error) {
        console.error("Error getResumenProduccionByLoteService:", error);
        return [null, error.message];
    }
}

// --- OPTIMIZED DASHBOARD SERVICES ---

export async function getDashboardStockCamarasService() {
  try {
    const stock = await produccionRepository
      .createQueryBuilder("prod")
      .leftJoin("prod.ubicacion", "ubi")
      .leftJoin("prod.definicion", "def")
      .select("def.nombre", "productoNombre")
      .addSelect("def.id", "definicionProductoId")
      .addSelect("prod.calibre", "calibre")
      .addSelect("SUM(prod.peso_neto_kg)", "totalKilos")
      .where("prod.estado = :estado", { estado: "En Stock" })
      .andWhere("ubi.tipo = :tipo", { tipo: "camara" })
      .groupBy("def.nombre")
      .addGroupBy("def.id")
      .addGroupBy("prod.calibre")
      .orderBy("def.nombre", "ASC")
      .getRawMany();

    const formattedStock = stock.map(item => ({
        productoNombre: item.productoNombre || item.productonombre,
        definicionProductoId: item.definicionProductoId || item.definicionproductoid,
        calibre: item.calibre,
        totalKilos: item.totalKilos || item.totalkilos,
    }));

    return [formattedStock, null];
  } catch (error) {
    console.error("Error en getDashboardStockCamarasService:", error);
    throw new Error(error.message);
  }
}

export async function getDashboardStockContenedoresService() {
  try {
    const stock = await produccionRepository
      .createQueryBuilder("prod")
      .leftJoin("prod.ubicacion", "ubi")
      .leftJoin("prod.definicion", "def")
      .select("ubi.nombre", "ubicacionNombre")
      .addSelect("def.nombre", "productoNombre")
      .addSelect("prod.calibre", "calibre")
      .addSelect("SUM(prod.peso_neto_kg)", "totalKilos")
      .addSelect("COUNT(prod.id)", "totalCantidad")
      .where("prod.estado = :estado", { estado: "En Stock" })
      .andWhere("ubi.tipo = :tipo", { tipo: "contenedor" })
      .groupBy("ubi.nombre")
      .addGroupBy("def.nombre")
      .addGroupBy("prod.calibre")
      .orderBy("ubi.nombre", "ASC")
      .getRawMany();

    const formattedStock = stock.map(item => ({
        ubicacionNombre: item.ubicacionNombre || item.ubicacionnombre,
        productoNombre: item.productoNombre || item.productonombre,
        calibre: item.calibre,
        totalKilos: item.totalKilos || item.totalkilos,
        totalCantidad: Number(item.totalCantidad || item.totalcantidad)
    }));

    return [formattedStock, null];
  } catch (error) {
    console.error("Error en getDashboardStockContenedoresService:", error);
    throw new Error(error.message);
  }
}