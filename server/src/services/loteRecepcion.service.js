"use strict";

import { AppDataSource } from "../config/configDb.js";
import LoteRecepcion from "../entity/loteRecepcion.entity.js";
import Proveedor from "../entity/proveedor.entity.js";
import MateriaPrima from "../entity/materiaPrima.entity.js";
import User from "../entity/user.entity.js";
import Desconche from "../entity/desconche.entity.js";
import ProductoTerminado from "../entity/productoTerminado.entity.js";
import { Like } from "typeorm";

const loteRepository = AppDataSource.getRepository(LoteRecepcion);
const proveedorRepository = AppDataSource.getRepository(Proveedor);
const materiaPrimaRepository = AppDataSource.getRepository(MateriaPrima);
const userRepository = AppDataSource.getRepository(User);
const desconcheRepository = AppDataSource.getRepository(Desconche);
const productoTerminadoRepository = AppDataSource.getRepository(ProductoTerminado);

export async function createLoteService(data, operarioEmail) {
  try {
    const { proveedorId, materiaPrimaId, peso_bruto_kg, numero_bandejas, pesadas } = data;

    const proveedor = await proveedorRepository.findOne({ where: { id: proveedorId } });
    if (!proveedor) return [null, "Proveedor no encontrado"];

    const materiaPrima = await materiaPrimaRepository.findOne({ where: { id: materiaPrimaId } });
    if (!materiaPrima) return [null, "Materia prima no encontrada"];

    const operario = await userRepository.findOne({ where: { email: operarioEmail } });
    if (!operario) return [null, "Operario no encontrado"];

    // Generar Código MMYY-XX
    const hoy = new Date();
    const anio = String(hoy.getFullYear()).slice(-2);
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const codigoBase = `${mes}${anio}`;

    const lotesHoy = await loteRepository.count({ where: { codigo: Like(`${codigoBase}%`) } });
    const secuencia = String(lotesHoy + 1).padStart(2, '0');
    const codigoFinal = `${codigoBase}-${secuencia}`;

    const newLote = loteRepository.create({
      codigo: codigoFinal,
      peso_bruto_kg,
      numero_bandejas,
      detalle_pesadas: pesadas,
      proveedor,
      materiaPrima,
      operario,
      estado: true
    });

    await loteRepository.save(newLote);
    return [newLote, null];
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getLotesActivosService() {
    try {
        const lotes = await loteRepository.find({
            relations: ["proveedor", "materiaPrima", "productosTerminados", "desconche"],
            order: { createdAt: "DESC" }
        });
        if (!lotes) return [null, "No se encontraron lotes"];
        return [lotes, null];
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function getLoteByIdService(id) {
    try {
        const lote = await loteRepository.findOne({
            where: { id },
            relations: ["proveedor", "materiaPrima", "operario", "productosTerminados", "desconche"]
        });
        if (!lote) return [null, "Lote no encontrado"];
        return [lote, null];
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function updateLoteService(id, data) {
    try {
        const lote = await loteRepository.findOne({ 
            where: { id },
            relations: ["productosTerminados", "desconche"] 
        });
        
        if (!lote) return [null, "Lote no encontrado"];

        const tieneProduccion = (lote.productosTerminados && lote.productosTerminados.length > 0) || !!lote.desconche;

        if (tieneProduccion) {
            const intentaEditarFisico = 
                data.proveedorId !== undefined || 
                data.materiaPrimaId !== undefined || 
                data.peso_bruto_kg !== undefined || 
                data.numero_bandejas !== undefined || 
                data.pesadas !== undefined;

            if (intentaEditarFisico) {
                return [null, "No se pueden editar peso/proveedor porque este lote ya tiene producción (Desconche o Productos). Solo puedes cambiar su estado."];
            }
        }

        if (data.proveedorId) {
            const prov = await proveedorRepository.findOne({ where: { id: data.proveedorId } });
            if (prov) lote.proveedor = prov;
        }
        if (data.materiaPrimaId) {
            const mat = await materiaPrimaRepository.findOne({ where: { id: data.materiaPrimaId } });
            if (mat) lote.materiaPrima = mat;
        }
        
        if (data.peso_bruto_kg !== undefined) lote.peso_bruto_kg = data.peso_bruto_kg;
        if (data.numero_bandejas !== undefined) lote.numero_bandejas = data.numero_bandejas;
        if (data.pesadas !== undefined) lote.detalle_pesadas = data.pesadas;
        if (data.estado !== undefined) {
            lote.estado = data.estado;
        }

        const loteActualizado = await loteRepository.save(lote);
        return [loteActualizado, null];
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function deleteLoteService(id, userRole) {
    try {
        const lote = await loteRepository.findOne({ 
            where: { id },
            relations: ["productosTerminados", "desconche"] 
        });
        
        if (!lote) return [null, "Lote no encontrado"];

        const tieneProduccion = (lote.productosTerminados && lote.productosTerminados.length > 0) || !!lote.desconche;

        if (tieneProduccion) {
            if (userRole !== 'administrador') {
                 return [null, "No tienes permisos de Administrador para eliminar este lote con producción iniciada."];
            }
            
            // ADMIN OVERRIDE
            try {
                // 1. Delete Products (if any)
                if (lote.productosTerminados.length > 0) {
                     await productoTerminadoRepository.remove(lote.productosTerminados);
                }
                // 2. Delete Desconche (if any)
                if (lote.desconche) {
                     await desconcheRepository.delete(lote.desconche.id);
                }
            } catch (innerError) {
                // Check for Foreign Key violation (e.g., Sold products or in Cart?)
                if (innerError.code === '23503') { // PostgreSQL FK violation code
                    return [null, "No se puede eliminar toda la cadena porque hay productos que ya fueron VENDIDOS (están en Pedidos)."];
                }
                throw innerError;
            }
        }

        await loteRepository.remove(lote);
        return [lote, null];
    } catch (error) {
        throw new Error(error.message);
    }
}