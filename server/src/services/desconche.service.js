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
    
    // VALIDACIÓN: No producir más de lo recibido
    if (totalNeto > Number(lote.peso_bruto_kg)) {
        throw new Error(`El total producido (${totalNeto.toFixed(2)} kg) excede los Kilos Netos recibidos en el Lote (${lote.peso_bruto_kg} kg).`);
    }

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
      relations: ["lote", "lote.proveedor", "lote.materiaPrima"],
      order: { createdAt: "DESC" }
    });
    return desconches;
  } catch (error) {
    throw error;
  }
}

export async function deleteDesconche(id, userRole) {
    try {
        const desconcheRepo = AppDataSource.getRepository(Desconche);
        
        // Find with relations to check for downstream products
        const desconche = await desconcheRepo.findOne({
            where: { id },
            relations: ["lote", "lote.productosTerminados"]
        });

        if (!desconche) {
            throw new Error("Desconche no encontrado");
        }

        const tieneProductos = desconche.lote?.productosTerminados?.length > 0;
        if (tieneProductos && userRole !== 'administrador') {
            throw new Error("No puedes eliminar este desconche porque el lote asociado ya tiene Productos Terminados.");
        }

        const result = await desconcheRepo.delete(id);
        
        if (result.affected === 0) {
            throw new Error("Desconche no encontrado");
        }
        return result;
        return result;
    } catch (error) {
        throw error;
    }
}

export async function updateDesconche(id, data) {
    try {
        const desconcheRepo = AppDataSource.getRepository(Desconche);
        const desconche = await desconcheRepo.findOne({ 
            where: { id },
            relations: ["lote"] 
        });

        if (!desconche) {
            throw new Error("Desconche no encontrado");
        }

        const { peso_carne_blanca, peso_pinzas, observacion } = data;
        
        // Recalculate totals and yield if weights change
        if (peso_carne_blanca !== undefined) desconche.peso_carne_blanca = peso_carne_blanca;
        if (peso_pinzas !== undefined) desconche.peso_pinzas = peso_pinzas;
        if (observacion !== undefined) desconche.observacion = observacion;

        const totalNeto = parseFloat(desconche.peso_carne_blanca) + parseFloat(desconche.peso_pinzas);
        
        // VALIDACIÓN: No producir más de lo recibido
        if (desconche.lote && totalNeto > Number(desconche.lote.peso_bruto_kg)) {
            throw new Error(`El total producido actualiza (${totalNeto.toFixed(2)} kg) excede los Kilos recibidos (${desconche.lote.peso_bruto_kg} kg).`);
        }

        if (desconche.lote && desconche.lote.peso_bruto_kg > 0) {
            desconche.porcentaje_rendimiento = (totalNeto / desconche.lote.peso_bruto_kg) * 100;
        }
        
        desconche.peso_total = totalNeto;

        return await desconcheRepo.save(desconche);
    } catch (error) {
        throw error;
    }
}
