"use strict";

import { AppDataSource } from "../config/configDb.js";
import Venta from "../entity/venta.entity.js";
import ProductoTerminado from "../entity/productoTerminado.entity.js";

const productoRepository = AppDataSource.getRepository(ProductoTerminado);
// ubicacionRepo not strictly needed if we assume logic handled by ID search or we join.

export async function createVentaService(data) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // items now: [{ definicionProductoId, cantidad, contenedorId, calibre }]
        const { cliente, tipo_venta, items } = data; 

        if (!items || items.length === 0) throw new Error("La lista de productos está vacía.");

        // 1. AUTO-INCREMENT Guía Despacho
        // Buscamos la última venta creada para obtener su n_guia_despacho
        // Buscamos la última venta creada para obtener su n_guia_despacho
        const [lastVenta] = await queryRunner.manager.find(Venta, {
            order: { id: 'DESC' },
            take: 1
        });

        let nextGuia = 1;
        if (lastVenta && lastVenta.n_guia_despacho) {
            const currentNum = parseInt(lastVenta.n_guia_despacho, 10);
            if (!isNaN(currentNum)) {
                nextGuia = currentNum + 1;
            }
        }

        // 2. Crear Venta
        const nuevaVenta = queryRunner.manager.create(Venta, {
            cliente,
            n_guia_despacho: String(nextGuia),
            tipo_venta
        });
        await queryRunner.manager.save("Venta", nuevaVenta);

        // 2. Procesar Items (Lógica FIFO por Contenedor)
        for (const item of items) {
            let kilosPorVender = parseFloat(item.cantidad);
            const { definicionProductoId, contenedorId, calibre } = item;

            // Buscar stock en ese contenedor, producto y calibre specific
            // Ordenar por fecha_produccion ASC (FIFO)
            const stockDisponible = await queryRunner.manager.getRepository(ProductoTerminado)
                .createQueryBuilder("prod")
                .leftJoinAndSelect("prod.ubicacion", "ubi")
                .leftJoinAndSelect("prod.loteDeOrigen", "lote")
                .leftJoinAndSelect("prod.definicion", "def")
                .where("prod.definicion = :defId", { defId: definicionProductoId })
                .andWhere("prod.estado = :estado", { estado: "En Stock" })
                .andWhere("ubi.id = :ubiId", { ubiId: contenedorId }) // Specific container
                .andWhere(calibre ? "prod.calibre = :calibre" : "prod.calibre IS NULL", { calibre })
                .orderBy("prod.fecha_produccion", "ASC")
                .getMany();

            const totalDisponible = stockDisponible.reduce((acc, curr) => acc + Number(curr.peso_neto_kg), 0);
            if (totalDisponible < kilosPorVender) {
                throw new Error(`Stock insuficiente en contenedor para producto ID ${definicionProductoId}. Solicitado: ${kilosPorVender}, Disponible: ${totalDisponible}`);
            }

            for (const loteObj of stockDisponible) {
                if (kilosPorVender <= 0) break;
                const pesoLote = parseFloat(loteObj.peso_neto_kg);

                if (pesoLote <= kilosPorVender) {
                    // Consumir todo
                    loteObj.estado = "Vendido"; // o Despachado
                    loteObj.venta = nuevaVenta;
                    await queryRunner.manager.save("ProductoTerminado", loteObj);
                    kilosPorVender -= pesoLote;
                } else {
                    // Split
                    // 1. Remanente queda En Stock (modificar original)
                    const remanente = pesoLote - kilosPorVender;
                    loteObj.peso_neto_kg = remanente;
                    await queryRunner.manager.save("ProductoTerminado", loteObj);

                    // 2. Nuevo lote "Vendido" (el que se lleva el cliente)
                    const nuevoLoteVendido = queryRunner.manager.create(ProductoTerminado, {
                        ...loteObj,
                        id: undefined,
                        peso_neto_kg: kilosPorVender,
                        estado: "Vendido",
                        venta: nuevaVenta,
                        fecha_produccion: loteObj.fecha_produccion // Keep age
                    });
                    await queryRunner.manager.save("ProductoTerminado", nuevoLoteVendido);
                    kilosPorVender = 0;
                }
            }
        }

        await queryRunner.commitTransaction();
        return [nuevaVenta, null];

    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error("Error en createVentaService:", error);
        return [null, error.message];
    } finally {
        await queryRunner.release();
    }
}

export async function getVentasService() {
    try {
        const ventas = await AppDataSource.getRepository(Venta).find({
            relations: {
                productos: {
                    definicion: true,
                    loteDeOrigen: true
                }
            },
            order: {
                fecha: "DESC"
            }
        });
        return [ventas, null];
    } catch (error) {
        console.error("Error en getVentasService:", error);
        return [null, error.message];
    }
}
