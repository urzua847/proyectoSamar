"use strict";

import { AppDataSource } from "../config/configDb.js";
import LoteRecepcion from "../entity/loteRecepcion.entity.js";
import Proveedor from "../entity/proveedor.entity.js";
import MateriaPrima from "../entity/materiaPrima.entity.js";
import User from "../entity/user.entity.js";
import { Like } from "typeorm";

// Obtenemos los repositorios de todas las entidades que necesitamos
const loteRepository = AppDataSource.getRepository(LoteRecepcion);
const proveedorRepository = AppDataSource.getRepository(Proveedor);
const materiaPrimaRepository = AppDataSource.getRepository(MateriaPrima);
const userRepository = AppDataSource.getRepository(User);

/**
 * Servicio para crear un nuevo lote de recepción.
 */
export async function createLoteService(data, operarioEmail) {
  try {
    const { proveedorId, materiaPrimaId, peso_bruto_kg, numero_bandejas } = data;

    // 1. Buscar las entidades relacionadas por su ID
    const proveedor = await proveedorRepository.findOne({ where: { id: proveedorId } });
    if (!proveedor) return [null, "Proveedor no encontrado"];

    const materiaPrima = await materiaPrimaRepository.findOne({ where: { id: materiaPrimaId } });
    if (!materiaPrima) return [null, "Materia prima no encontrada"];

    const operario = await userRepository.findOne({ where: { email: operarioEmail } });
    if (!operario) return [null, "Operario no encontrado"];


// --- LÓGICA DE GENERACIÓN DE CÓDIGO ---
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0'); // ej: "11"
    const dia = String(hoy.getDate()).padStart(2, '0');      // ej: "18"
    const codigoBase = `${mes}${dia}`; // "1118"

    // Buscamos cuántos lotes existen ya con ese código base para hoy
    // Nota: Esto busca códigos que empiecen por "1118"
    const lotesHoy = await loteRepository.count({
        where: {
            codigo: Like(`${codigoBase}%`),
        }
    });

    // Si ya hay 2 lotes, este será el 03. (1118-03)
    const secuencia = String(lotesHoy + 1).padStart(2, '0');
    const codigoFinal = `${codigoBase}-${secuencia}`; 
    // Resultado: "1118-01", "1118-02", etc.

    // 2. Crear la nueva instancia del lote
    const newLote = loteRepository.create({
      codigo: codigoFinal,
      peso_bruto_kg,
      numero_bandejas,
      proveedor: proveedor,     
      materiaPrima: materiaPrima, 
      operario: operario,      
    });

    // 3. Guardar en la base de datos
    await loteRepository.save(newLote);
    return [newLote, null];

  } catch (error) {
    throw new Error(error.message);
  }
}

/**
 * Servicio para obtener todos los lotes activos (aún no procesados).
 * 
 */
export async function getLotesActivosService() {
    try {
        // Esta lógica es un placeholder. La ajustaremos cuando sepamos
        // qué define a un lote como "activo" (ej. sin productos terminados).
        const lotes = await loteRepository.find({
            relations: ["proveedor", "materiaPrima"] // Incluye los datos del proveedor
        });
        if (!lotes || lotes.length === 0) {
            return [null, "No se encontraron lotes activos"];
        }
        return [lotes, null];
    } catch (error) {
        throw new Error(error.message);
    }
}