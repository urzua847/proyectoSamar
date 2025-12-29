"use strict";
import { AppDataSource } from "../config/configDb.js";
import Produccion from "../entity/produccion.entity.js";
import LoteRecepcion from "../entity/loteRecepcion.entity.js";

const produccionRepository = AppDataSource.getRepository(Produccion);
const loteRepository = AppDataSource.getRepository(LoteRecepcion);

export async function createProduccionYieldService(data) {
  try {
    const { loteRecepcionId, peso_carne_blanca, peso_pinzas, observacion } = data;

    const lote = await loteRepository.findOne({ where: { id: loteRecepcionId } });
    if (!lote) return [null, "Lote no encontrado"];

    const existingProduccion = await produccionRepository.findOne({ where: { loteRecepcion: { id: loteRecepcionId } } });
    if (existingProduccion) {
        return [null, "Ya existe un registro de producción para este lote."];
    }

    const nuevoPesoCarne = Number(peso_carne_blanca);
    const nuevoPesoPinzas = Number(peso_pinzas);
    const total = nuevoPesoCarne + nuevoPesoPinzas;

    const produccion = produccionRepository.create({
        loteRecepcion: lote,
        peso_carne_blanca: nuevoPesoCarne,
        peso_pinzas: nuevoPesoPinzas,
        peso_total: total,
        observacion
    });

    await produccionRepository.save(produccion);
    const allProducciones = await produccionRepository.find({ where: { loteRecepcion: { id: loteRecepcionId } } });
    
    const totalCarne = allProducciones.reduce((acc, p) => acc + Number(p.peso_carne_blanca), 0);
    const totalPinzas = allProducciones.reduce((acc, p) => acc + Number(p.peso_pinzas), 0);
    
    lote.peso_carne_blanca = totalCarne;
    lote.peso_pinzas = totalPinzas;
    lote.peso_total_producido = totalCarne + totalPinzas;
    lote.en_proceso_produccion = true; 
    
    await loteRepository.save(lote);

    return [produccion, null];
  } catch (error) {
    console.error("Error createProduccionYieldService:", error);
    return [null, error.message];
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
