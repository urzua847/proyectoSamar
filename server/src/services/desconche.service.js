"use strict";

import { AppDataSource } from "../config/configDb.js";
import Desconche from "../entity/desconche.entity.js";
import LoteRecepcion from "../entity/loteRecepcion.entity.js";

export async function createDesconche(loteId, data) {
  try {
    const desconcheRepo = AppDataSource.getRepository(Desconche);
    const loteRepo = AppDataSource.getRepository(LoteRecepcion);

    const lote = await loteRepo.findOne({ 
        where: { id: loteId },
        relations: ["desconche"]
    });

    if (!lote) {
      throw new Error("Lote no encontrado");
    }

    if (lote.desconche) {
      throw new Error("Este lote ya tiene un desconche registrado");
    }

    const { peso_carne_blanca, peso_pinzas, observacion } = data;
    const totalNeto = parseFloat(peso_carne_blanca) + parseFloat(peso_pinzas);
    const rendimiento = (totalNeto / lote.peso_bruto_kg) * 100;

    const nuevoDesconche = desconcheRepo.create({
      peso_carne_blanca,
      peso_pinzas,
      observacion,
      porcentaje_rendimiento: rendimiento,
      peso_total: totalNeto,
      lote: lote
    });

    await desconcheRepo.save(nuevoDesconche);

    return nuevoDesconche;
  } catch (error) {
    throw error;
  }
}

export async function getDesconcheByLote(loteId) {
  try {
    const desconcheRepo = AppDataSource.getRepository(Desconche);
    
    // Buscar donde la relación 'lote' tenga el id dado
    // En TypeORM 'one-to-one', a veces se busca por relation id
    const desconche = await desconcheRepo.findOne({
      where: { lote: { id: loteId } },
      relations: ["lote"]
    });

    return desconche;
  } catch (error) {
    throw error;
  }
}

export async function getAllDesconches() {
  try {
    const desconcheRepo = AppDataSource.getRepository(Desconche);
    const desconches = await desconcheRepo.find({
      relations: ["lote", "lote.proveedor"],
      order: { createdAt: "DESC" }
    });
    return desconches;
  } catch (error) {
    throw error;
  }
}
