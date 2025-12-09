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

export async function getProducciones() {
    try {
        const response = await axios.get('/produccion');
        const data = response.data.data.map(prod => ({
            id: prod.id,
            loteCodigo: prod.loteDeOrigen?.codigo,
            fechaRecepcion: formatTempo(prod.loteDeOrigen?.fecha_recepcion, "DD-MM-YYYY"),
            proveedorNombre: prod.loteDeOrigen?.proveedor?.nombre,
            materiaPrimaNombre: prod.loteDeOrigen?.materiaPrima?.nombre,
            productoFinalNombre: prod.definicion?.nombre,
            estadoLote: prod.loteDeOrigen?.estado ? 'Abierto' : 'Cerrado',
            ubicacionNombre: prod.ubicacion?.nombre,
            peso_neto_kg: prod.peso_neto_kg,
            calibre: prod.calibre || '-'
        }));
        return data;
    } catch (error) {
        return [];
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
      .addSelect("SUM(prod.peso_neto_kg)", "totalKilos")
      .where("prod.estado = :estado", { estado: "En Stock" })
      .andWhere("ubi.tipo = :tipo", { tipo: "camara" })
      .groupBy("ubi.nombre")
      .addGroupBy("def.nombre")
      .orderBy("ubi.nombre", "ASC")
      .getRawMany();

    return [stock, null];
  } catch (error) {
    console.error("Error en getStockCamarasService:", error); // <--- ESTO TE MOSTRARÁ EL ERROR REAL
    throw new Error(error.message);
  }
}

export async function getProduccionesService() {
  try {
    const producciones = await produccionRepository.find({
      relations: [
        "loteDeOrigen",
        "loteDeOrigen.proveedor",
        "loteDeOrigen.materiaPrima",
        "definicion",
        "ubicacion"
      ],
      order: { fecha_produccion: "DESC" }
    });
    return [producciones, null];
  } catch (error) {
    throw new Error(error.message);
  }
}