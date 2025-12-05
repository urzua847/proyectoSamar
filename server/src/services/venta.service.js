"use strict";

import { AppDataSource } from "../config/configDb.js";
import Venta from "../entity/venta.entity.js";
import DetalleVenta from "../entity/detalleVenta.entity.js";
import ProductoTerminado from "../entity/productoTerminado.entity.js";

const ventaRepository = AppDataSource.getRepository(Venta);
const productoRepository = AppDataSource.getRepository(ProductoTerminado);

export async function createVentaService(data) {
  try {
    const { cliente, items } = data; // items: [{ definicionProductoId, calibre, kilos, precio_kilo }, ...]

    let totalVenta = 0;
    const detallesVenta = [];
    const productosToUpdate = [];

    // Procesar cada ítem solicitado
    for (const item of items) {
        const { definicionProductoId, calibre, kilos, precio_kilo } = item;
        let kilosRequeridos = parseFloat(kilos);
        
        // Buscar lotes disponibles (FIFO)
        const query = productoRepository.createQueryBuilder("prod")
            .where("prod.definicionId = :defId", { defId: definicionProductoId })
            .andWhere("prod.estado = 'En Stock'")
            .andWhere("prod.peso_actual > 0")
            .orderBy("prod.createdAt", "ASC");

        if (calibre) {
            query.andWhere("prod.calibre = :calibre", { calibre });
        }

        const lotesDisponibles = await query.getMany();

        // Calcular stock total disponible
        const stockTotal = lotesDisponibles.reduce((acc, l) => acc + parseFloat(l.peso_actual), 0);
        
        if (stockTotal < kilosRequeridos) {
            return [null, `Stock insuficiente para el producto ID ${definicionProductoId} (Calibre: ${calibre || 'N/A'}). Solicitado: ${kilosRequeridos}, Disponible: ${stockTotal.toFixed(2)}`];
        }

        // Descontar de los lotes
        for (const lote of lotesDisponibles) {
            if (kilosRequeridos <= 0) break;

            const disponibleEnLote = parseFloat(lote.peso_actual);
            let aDescontar = 0;

            if (disponibleEnLote >= kilosRequeridos) {
                // El lote cubre todo lo que falta
                aDescontar = kilosRequeridos;
                lote.peso_actual = disponibleEnLote - kilosRequeridos;
                kilosRequeridos = 0;
            } else {
                // El lote se agota, tomamos todo lo que tiene
                aDescontar = disponibleEnLote;
                lote.peso_actual = 0;
                kilosRequeridos -= disponibleEnLote;
            }

            // Si el lote queda en 0, pasa a Vendido (o se queda en stock con 0, según preferencia. "Vendido" es más limpio)
            if (lote.peso_actual === 0) {
                lote.estado = "Vendido";
            }

            productosToUpdate.push(lote);

            // Crear detalle de venta
            detallesVenta.push({
                precio_unitario: precio_kilo, // Precio por kilo
                peso: aDescontar,
                producto: lote
            });

            totalVenta += (aDescontar * precio_kilo);
        }
    }

    const nuevaVenta = ventaRepository.create({
        cliente,
        total: totalVenta,
        detalles: detallesVenta
    });

    // Guardar en Transacción
    await AppDataSource.transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.save(productosToUpdate);
        await transactionalEntityManager.save(nuevaVenta);
    });

    return [nuevaVenta, null];

  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getVentasService() {
    try {
        const ventas = await ventaRepository.find({
            relations: ["detalles", "detalles.producto", "detalles.producto.definicion"]
        });
        return [ventas, null];
    } catch (error) {
        throw new Error(error.message);
    }
}
