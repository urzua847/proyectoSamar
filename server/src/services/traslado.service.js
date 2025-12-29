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
        const { items, destinoId, peso_caja } = data;

        // 1. Validar Destino
        const destino = await ubicacionRepository.findOne({ where: { id: destinoId, tipo: "contenedor" } });
        if (!destino) throw new Error("Ubicación de destino inválida o no es un contenedor.");

        const movimientos = [];
        const boxWeight = peso_caja ? parseFloat(peso_caja) : null;

        for (const item of items) {
            let kilosPorMover = parseFloat(item.cantidad);
            const { definicionProductoId, calibre, loteId } = item;
            
            const queryBuild = queryRunner.manager.getRepository(ProductoTerminado)
                .createQueryBuilder("prod")
                .leftJoinAndSelect("prod.ubicacion", "ubi")
                .leftJoinAndSelect("prod.loteDeOrigen", "lote")
                .leftJoinAndSelect("prod.definicion", "def")
                .where("prod.definicion = :defId", { defId: definicionProductoId })
                .andWhere("prod.estado = :estado", { estado: "En Stock" })
                .andWhere("ubi.tipo = :tipo", { tipo: "camara" })
                .andWhere(calibre ? "prod.calibre = :calibre" : "prod.calibre IS NULL", { calibre });
                
            if (loteId) {
                queryBuild.andWhere("lote.id = :loteId", { loteId });
            }

            const stockDisponible = await queryBuild.orderBy("prod.fecha_produccion", "ASC").getMany();
            
            const totalDisponible = stockDisponible.reduce((acc, curr) => acc + Number(curr.peso_neto_kg), 0);
            if (totalDisponible < kilosPorMover) {
                throw new Error(`Stock insuficiente para el producto ID ${definicionProductoId}. Solicitado: ${kilosPorMover}, Disponible: ${totalDisponible}`);
            }

            const stockPorLote = {};
            stockDisponible.forEach(item => {
                const lId = item.loteDeOrigen?.id || 'sin_lote';
                if (!stockPorLote[lId]) stockPorLote[lId] = [];
                stockPorLote[lId].push(item);
            });

            for (const loteKey in stockPorLote) {
                if (kilosPorMover < 0.01) break;

                const itemsDelLote = stockPorLote[loteKey];
                const totalPesoLote = itemsDelLote.reduce((acc, i) => acc + Number(i.peso_neto_kg), 0);                
                let targetConsumption = 0;

                if (boxWeight) {
                   const canGive = totalPesoLote;                   
                   const limit = Math.min(kilosPorMover, canGive); 
                   
                   const numCajas = Math.floor(limit / boxWeight);
                   
                   if (numCajas === 0) {
                       continue; 
                   }

                   targetConsumption = numCajas * boxWeight;
                   
                   const refItem = itemsDelLote[0];
                    for (let i = 0; i < numCajas; i++) {
                        const nuevaCaja = queryRunner.manager.create(ProductoTerminado, {
                            calibre: refItem.calibre,
                            loteDeOrigen: refItem.loteDeOrigen,
                            definicion: refItem.definicion,
                            fecha_produccion: refItem.fecha_produccion,
                            peso_neto_kg: boxWeight,
                            ubicacion: destino,
                            estado: "En Stock"
                        });
                        await queryRunner.manager.save(ProductoTerminado, nuevaCaja);
                    }

                } else {
                    targetConsumption = Math.min(totalPesoLote, kilosPorMover);
                }

                if (targetConsumption > 0) {
                    let remainingToConsume = targetConsumption;

                    for (const item of itemsDelLote) {
                        if (remainingToConsume <= 0.001) break;

                        const pesoItem = Number(item.peso_neto_kg);
                        
                        if (pesoItem <= remainingToConsume) {
                             const discount = pesoItem;
                             remainingToConsume -= discount;                             
                             if (boxWeight) {
                                 await queryRunner.manager.delete(ProductoTerminado, item.id);
                             } else {
                                 item.ubicacion = destino;
                                 await queryRunner.manager.save(ProductoTerminado, item);
                                 movimientos.push({ id: item.id, accion: "movido_total", kilos: discount });
                             }

                        } else {
                            const discount = remainingToConsume;
                            remainingToConsume = 0;
                            
                            item.peso_neto_kg = pesoItem - discount;
                            await queryRunner.manager.save(ProductoTerminado, item);

                            if (!boxWeight) {
                                const movedPart = queryRunner.manager.create(ProductoTerminado, {
                                    calibre: item.calibre,
                                    loteDeOrigen: item.loteDeOrigen,
                                    definicion: item.definicion,
                                    fecha_produccion: item.fecha_produccion,
                                    peso_neto_kg: discount,
                                    ubicacion: destino,
                                    estado: "En Stock"
                                });
                                await queryRunner.manager.save(ProductoTerminado, movedPart);
                                movimientos.push({ idOriginal: item.id, idNuevo: movedPart.id, accion: "split", kilos: discount });
                            }
                        }
                    }
                    kilosPorMover -= targetConsumption;
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
