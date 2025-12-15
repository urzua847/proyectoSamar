"use strict";
import { AppDataSource } from "../config/configDb.js";
import ProductoTerminado from "../entity/productoTerminado.entity.js";
import LoteRecepcion from "../entity/loteRecepcion.entity.js";
import DefinicionProducto from "../entity/definicionProducto.entity.js";
import Ubicacion from "../entity/ubicacion.entity.js";
import Desconche from "../entity/desconche.entity.js";

const produccionRepository = AppDataSource.getRepository(ProductoTerminado);
const loteRepository = AppDataSource.getRepository(LoteRecepcion);
const productoDefRepository = AppDataSource.getRepository(DefinicionProducto);
const ubicacionRepository = AppDataSource.getRepository(Ubicacion);
const desconcheRepository = AppDataSource.getRepository(Desconche);

export async function createProduccionService(data) {
  try {
    const { loteRecepcionId, items } = data;

    const loteOrigen = await loteRepository.findOne({ where: { id: loteRecepcionId } });
    if (!loteOrigen) return [null, "El Lote de Recepción no existe."];
    if (loteOrigen.estado === false) return [null, "El Lote está CERRADO."];

    // --- VALIDATION: Check Weights ---
    const desconche = await desconcheRepository.findOne({ where: { lote: { id: loteRecepcionId } } });
    
    // Calculate Total Yield Available (from Desconche)
    let maxYield = 0;
    if (desconche) {
        maxYield = Number(desconche.peso_carne_blanca) + Number(desconche.peso_pinzas);
    } else {
        // If no desconche, fallback to Lote Gross Weight (or block it?)
        // For flexibility, let's use Lote weight, but usually Desconche is required.
        // Let's assume Desconche IS required for "Envasado" of "Carne".
        // If user is just moving standard raw material, maybe Desconche is not needed.
        // Let's assume strictly:
        // if (!desconche) return [null, "No existe planilla de Desconche para este Lote."];
        // But to be safe and avoiding blocking work, let's use lote.peso_bruto_kg as fallback bounds.
        maxYield = Number(loteOrigen.peso_bruto_kg);
    }

    // Calculate currently produced total
    const currentProducedSum = await produccionRepository.sum("peso_neto_kg", { loteDeOrigen: { id: loteRecepcionId } });
    const currentTotal = Number(currentProducedSum || 0);

    // Calculate new items total
    const newTotal = items.reduce((acc, item) => acc + Number(item.peso_neto_kg), 0);

    if (currentTotal + newTotal > maxYield) {
        return [null, `Error: Se excede el límite de producción. Disponible: ${(maxYield - currentTotal).toFixed(2)} kg. Intentas guardar: ${newTotal.toFixed(2)} kg.`];
    }
    // -----------------------------

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
        ids: item.ids // Retornar IDs para eliminación masiva
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