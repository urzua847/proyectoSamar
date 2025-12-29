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

    const loteOrigen = await loteRepository.findOne({ where: { id: loteRecepcionId } });
    if (!loteOrigen) return [null, "El Lote de Recepción no existe."];
    if (loteOrigen.estado === false) return [null, "El Lote está CERRADO."];

    let newPinzaKg = 0;
    let newCarneKg = 0;
    
    const distinctDefIds = [...new Set(items.map(i => i.definicionProductoId))];
    const definitions = await productoDefRepository.findByIds(distinctDefIds);
    const defMap = new Map(definitions.map(d => [d.id, d]));

    const normalize = (str) => str ? str.toLowerCase().trim() : '';

    for (const item of items) {
        const def = defMap.get(item.definicionProductoId);
        if (def && def.origen) {
            const org = normalize(def.origen);
            if (org === 'pinza' || org === 'pinzas') newPinzaKg += Number(item.peso_neto_kg);
            if (org === 'carne blanca' || org === 'carne_blanca') newCarneKg += Number(item.peso_neto_kg);
        }
    }

    const hasYieldLimits = (Number(loteOrigen.peso_pinzas || 0) > 0) || (Number(loteOrigen.peso_carne_blanca || 0) > 0);

    if (hasYieldLimits) {
        for (const item of items) {
            const def = defMap.get(item.definicionProductoId);
            if (def && def.tipo === 'elaborado' && !normalize(def.origen)) {
                return [null, `Error de Control: El producto '${def.nombre}' no tiene definido un 'Origen' válido (Pinza/Carne).`];
            }
        }
    }

    if (newPinzaKg > 0) {
        const currentPinzaSum = await produccionRepository
            .createQueryBuilder("prod")
            .leftJoin("prod.definicion", "def")
            .where("prod.loteDeOrigenId = :loteId", { loteId: loteRecepcionId })
            .andWhere("(LOWER(def.origen) = 'pinza' OR LOWER(def.origen) = 'pinzas')")
            .select("SUM(prod.peso_neto_kg)", "sum")
            .getRawOne();
        
        const totalPinza = Number(currentPinzaSum.sum || 0) + newPinzaKg;
        const limitPinza = Number(loteOrigen.peso_pinzas || 0);

        if (totalPinza > limitPinza) {
            return [null, `Error: Se excede el límite de PINZAS. Disponible: ${(limitPinza - Number(currentPinzaSum.sum || 0)).toFixed(2)} kg. Intentas guardar: ${newPinzaKg.toFixed(2)} kg.`];
        }
    }

    if (newCarneKg > 0) {
        const currentCarneSum = await produccionRepository
            .createQueryBuilder("prod")
            .leftJoin("prod.definicion", "def")
            .where("prod.loteDeOrigenId = :loteId", { loteId: loteRecepcionId })
            .andWhere("(LOWER(def.origen) = 'carne blanca' OR LOWER(def.origen) = 'carne_blanca')")
            .select("SUM(prod.peso_neto_kg)", "sum")
            .getRawOne();
        
        const totalCarne = Number(currentCarneSum.sum || 0) + newCarneKg;
        const limitCarne = Number(loteOrigen.peso_carne_blanca || 0);

        if (totalCarne > limitCarne) {
            return [null, `Error: Se excede el límite de CARNE BLANCA. Disponible: ${(limitCarne - Number(currentCarneSum.sum || 0)).toFixed(2)} kg. Intentas guardar: ${newCarneKg.toFixed(2)} kg.`];
        }
    }

    const nuevosRegistros = [];

    for (const item of items) {
        const { definicionProductoId, ubicacionId, peso_neto_kg, calibre } = item;

        const definicion = await productoDefRepository.findOne({ where: { id: definicionProductoId } });
        if (!definicion) return [null, `Producto ID ${definicionProductoId} inválido.`];

        const ubicacion = await ubicacionRepository.findOne({ where: { id: ubicacionId } });
        if (!ubicacion) return [null, `Ubicación ID ${ubicacionId} inválida.`];

        if (definicion.calibres && definicion.calibres.length > 0) {
            if (calibre && !definicion.calibres.includes(calibre)) {
                return [null, `Calibre '${calibre}' inválido para ${definicion.nombre}.`];
            }
        }

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

    await produccionRepository.save(nuevosRegistros);
    return [nuevosRegistros, null];

  } catch (error) {
    console.error("Error en createProduccionService:", error);
    throw new Error(error.message);
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

export async function getProduccionesService() {
  try {
    const producciones = await produccionRepository.createQueryBuilder("prod")
        .leftJoinAndSelect("prod.loteDeOrigen", "lote")
        .leftJoinAndSelect("lote.proveedor", "proveedor")
        .leftJoinAndSelect("lote.materiaPrima", "materiaPrima")
        .leftJoinAndSelect("prod.definicion", "definicion")
        .leftJoinAndSelect("prod.ubicacion", "ubicacion")
        .where("ubicacion.tipo = :tipo", { tipo: "camara" })
        .orderBy("prod.fecha_produccion", "DESC")
        .getMany();
        
    return [producciones, null];
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