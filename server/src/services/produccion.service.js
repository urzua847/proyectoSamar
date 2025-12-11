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



export async function getStockCamarasService() {
  try {
    const stock = await produccionRepository
      .createQueryBuilder("prod")
      .leftJoin("prod.ubicacion", "ubi")
      .leftJoin("prod.definicion", "def")
      .select("ubi.nombre", "ubicacionNombre")
      .addSelect("def.nombre", "productoNombre")
      .addSelect("def.id", "definicionProductoId")
      .addSelect("prod.calibre", "calibre")
      .addSelect("SUM(prod.peso_neto_kg)", "totalKilos")
      .where("prod.estado = :estado", { estado: "En Stock" })
      .andWhere("ubi.tipo = :tipo", { tipo: "camara" })
      .groupBy("ubi.nombre")
      .addGroupBy("def.nombre")
      .addGroupBy("def.id")
      .addGroupBy("prod.calibre")
      .orderBy("ubi.nombre", "ASC")
      .getRawMany();

    const formattedStock = stock.map(item => ({
        ubicacionNombre: item.ubicacionNombre || item.ubicacionnombre,
        productoNombre: item.productoNombre || item.productonombre,
        definicionProductoId: item.definicionProductoId || item.definicionproductoid,
        calibre: item.calibre,
        totalKilos: item.totalKilos || item.totalkilos
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
      .addSelect("SUM(prod.peso_neto_kg)", "totalKilos")
      .where("prod.estado = :estado", { estado: "En Stock" })
      .andWhere("ubi.tipo = :tipo", { tipo: "contenedor" })
      .groupBy("ubi.nombre")
      .addGroupBy("ubi.id")
      .addGroupBy("def.nombre")
      .addGroupBy("def.id")
      .addGroupBy("prod.calibre")
      .addGroupBy("lote.codigo")
      .orderBy("ubi.nombre", "ASC")
      .getRawMany();

    const formattedStock = stock.map(item => ({
        ubicacionNombre: item.ubicacionNombre || item.ubicacionnombre,
        contenedorId: item.contenedorId || item.contenedorid,
        productoNombre: item.productoNombre || item.productonombre,
        definicionProductoId: item.definicionProductoId || item.definicionproductoid,
        calibre: item.calibre,
        loteCodigo: item.loteCodigo || item.lotecodigo,
        totalKilos: item.totalKilos || item.totalkilos
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