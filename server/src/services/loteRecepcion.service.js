"use strict";

import { AppDataSource } from "../config/configDb.js";
import LoteRecepcion from "../entity/loteRecepcion.entity.js";
import Proveedor from "../entity/proveedor.entity.js";
import MateriaPrima from "../entity/materiaPrima.entity.js";
import User from "../entity/user.entity.js";
import { Like } from "typeorm";

const loteRepository = AppDataSource.getRepository(LoteRecepcion);
const proveedorRepository = AppDataSource.getRepository(Proveedor);
const materiaPrimaRepository = AppDataSource.getRepository(MateriaPrima);
const userRepository = AppDataSource.getRepository(User);

/**
 * Servicio para crear un nuevo lote de recepción.
 */
export async function createLoteService(data, operarioEmail) {
  try {
    const { proveedorId, materiaPrimaId, peso_bruto_kg, numero_bandejas, pesadas } = data;

    // 1. Buscar las entidades relacionadas
    const proveedor = await proveedorRepository.findOne({ where: { id: proveedorId } });
    if (!proveedor) return [null, "Proveedor no encontrado"];

    const materiaPrima = await materiaPrimaRepository.findOne({ where: { id: materiaPrimaId } });
    if (!materiaPrima) return [null, "Materia prima no encontrada"];

    const operario = await userRepository.findOne({ where: { email: operarioEmail } });
    if (!operario) return [null, "Operario no encontrado"];

    // --- LÓGICA DE GENERACIÓN DE CÓDIGO (MMDD-XX) ---
    const hoy = new Date();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0'); 
    const dia = String(hoy.getDate()).padStart(2, '0');      
    const codigoBase = `${mes}${dia}`; 

    const lotesHoy = await loteRepository.count({
        where: {
            codigo: Like(`${codigoBase}%`),
        }
    });

    const secuencia = String(lotesHoy + 1).padStart(2, '0');
    const codigoFinal = `${codigoBase}-${secuencia}`; 

    // 2. Crear la nueva instancia del lote
    const newLote = loteRepository.create({
      codigo: codigoFinal,
      peso_bruto_kg,
      numero_bandejas,
      detalle_pesadas: pesadas, 
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
 * Servicio para obtener todos los lotes activos.
 */
export async function getLotesActivosService() {
    try {
        const lotes = await loteRepository.find({
            relations: ["proveedor", "materiaPrima"],
            order: { createdAt: "DESC" } 
        });
        if (!lotes || lotes.length === 0) {
            return [null, "No se encontraron lotes activos"];
        }
        return [lotes, null];
    } catch (error) {
        throw new Error(error.message);
    }
}