"use strict";

import { AppDataSource } from "../config/configDb.js";
import ProductoTerminado from "../entity/productoTerminado.entity.js";
import Ubicacion from "../entity/ubicacion.entity.js";

const productoRepository = AppDataSource.getRepository(ProductoTerminado);
const ubicacionRepository = AppDataSource.getRepository(Ubicacion);

export async function trasladoStockService(data) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const { items, destinoId } = data; // items: [{ definicionProductoId, cantidad, calibre }]

        // 1. Validar Destino
        const destino = await ubicacionRepository.findOne({ where: { id: destinoId, tipo: "contenedor" } });
        if (!destino) throw new Error("Ubicación de destino inválida o no es un contenedor.");

        const movimientos = [];

        for (const item of items) {
            let kilosPorMover = parseFloat(item.cantidad);
            const { definicionProductoId, calibre } = item;

            // 2. Buscar Stock FIFO en Cámaras
            // Busca productos del tipo y calibre especificado, que estén en 'camara' y 'En Stock'
            // Ordena por fecha_produccion ASC (FIFO)
            const stockDisponible = await queryRunner.manager.getRepository(ProductoTerminado)
                .createQueryBuilder("prod")
                .leftJoinAndSelect("prod.ubicacion", "ubi")
                .leftJoinAndSelect("prod.loteDeOrigen", "lote")
                .leftJoinAndSelect("prod.definicion", "def")
                .where("prod.definicion = :defId", { defId: definicionProductoId })
                .andWhere("prod.estado = :estado", { estado: "En Stock" })
                .andWhere("ubi.tipo = :tipo", { tipo: "camara" })
                .andWhere(calibre ? "prod.calibre = :calibre" : "prod.calibre IS NULL", { calibre })
                .orderBy("prod.fecha_produccion", "ASC")
                .getMany();

            // Calcular total disponible
            const totalDisponible = stockDisponible.reduce((acc, curr) => acc + Number(curr.peso_neto_kg), 0);

            if (totalDisponible < kilosPorMover) {
                throw new Error(`Stock insuficiente para el producto ID ${definicionProductoId} (Calibre ${calibre || 'N/A'}). Solicitado: ${kilosPorMover}, Disponible: ${totalDisponible}`);
            }

            // 3. Iterar y mover/dividir
            for (const loteObj of stockDisponible) {
                if (kilosPorMover <= 0) break;

                const pesoLote = parseFloat(loteObj.peso_neto_kg);

                if (pesoLote <= kilosPorMover) {
                    // Caso A: Consumimos todo el registro
                    loteObj.ubicacion = destino;
                    await queryRunner.manager.save("ProductoTerminado", loteObj);
                    
                    kilosPorMover -= pesoLote;
                    movimientos.push({ id: loteObj.id, accion: "movido_total", kilos: pesoLote });

                } else {
                    // Caso B: Split. El registro tiene más de lo que necesitamos.
                    // 1. Modificar el original para que se quede con el Remanente en CÁMARA
                    const remanente = pesoLote - kilosPorMover;
                    loteObj.peso_neto_kg = remanente;
                    await queryRunner.manager.save("ProductoTerminado", loteObj);

                    // 2. Crear nuevo registro con la parte movida en CONTENEDOR
                    // Clonamos el objeto pero con nuevo ID, peso y ubicación
                    const nuevoLote = queryRunner.manager.create(ProductoTerminado, {
                        ...loteObj,
                        id: undefined, // Nuevo ID
                        peso_neto_kg: kilosPorMover,
                        ubicacion: destino,
                        fecha_produccion: loteObj.fecha_produccion // Mantiene antigüedad
                    });
                    
                    await queryRunner.manager.save("ProductoTerminado", nuevoLote);

                    movimientos.push({ idOriginal: loteObj.id, idNuevo: nuevoLote.id, accion: "split", kilos: kilosPorMover });
                    kilosPorMover = 0;
                }
            }
        }

        await queryRunner.commitTransaction();
        return [movimientos, null];

    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error("Error en trasladoStockService:", error);
        return [null, error.message];
    } finally {
        await queryRunner.release();
    }
}
