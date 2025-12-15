"use strict";

import { AppDataSource } from "../config/configDb.js";
import Pedido from "../entity/pedido.entity.js";
import DetallePedido from "../entity/detallePedido.entity.js";
import ProductoTerminado from "../entity/productoTerminado.entity.js";

export async function createPedidoService(data) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const { cliente, numero_guia, fecha, items } = data; 
        // items: [{ productoId, cantidad_bultos }]

        if (!items || items.length === 0) throw new Error("La lista de productos está vacía.");

        // 1. Validar Unicidad de Guía
        if (numero_guia) {
            const existingPedido = await queryRunner.manager.findOne(Pedido, { where: { numero_guia } });
            if (existingPedido) {
                throw new Error(`El N° de Guía "${numero_guia}" ya existe en el sistema.`);
            }
        }

        // 2. Crear Cabecera Pedido
        const nuevoPedido = queryRunner.manager.create(Pedido, {
            cliente,
            numero_guia,
            fecha: fecha ? new Date(fecha) : new Date(),
            estado: "Despachado"
        });
        
        await queryRunner.manager.save("Pedido", nuevoPedido);

        // 2. Procesar Detalles
        for (const item of items) {
            const cantidadBultosReq = parseInt(item.cantidad_bultos);
            const productoIds = item.productoIds || [];
            const legacyId = item.productoId;

            if (productoIds.length > 0) {
                 // --- MODO MULTI-BOX (Packing) ---
                 let qtyConsumed = 0;
                 let idIndex = 0;
                 
                 while (qtyConsumed < cantidadBultosReq) {
                     if (idIndex >= productoIds.length) {
                         throw new Error(`Stock insuficiente. Se solicitaron ${cantidadBultosReq} bultos y solo se encontraron ${qtyConsumed} disponibles/seleccionados de la lista.`);
                     }

                     const currentId = productoIds[idIndex];
                     const stockItem = await queryRunner.manager.findOne(ProductoTerminado, {
                         where: { id: currentId },
                         relations: ["definicion", "ubicacion"]
                     });

                     // Verify Availability
                     if (stockItem && stockItem.estado === 'En Stock' && stockItem.ubicacion.tipo === 'contenedor' && Number(stockItem.peso_neto_kg) > 0) {
                         // Consume Box
                         const pesoCaja = Number(stockItem.peso_neto_kg);
                         
                         stockItem.estado = "Vendido";
                         stockItem.peso_neto_kg = pesoCaja; // Keep weight for history but status is Vendido
                         
                         await queryRunner.manager.save(ProductoTerminado, stockItem);
 
                         // Create Detalle (1 per Box for traceability)
                         const detalle = queryRunner.manager.create(DetallePedido, {
                             pedido: nuevoPedido,
                             producto: { id: stockItem.id },
                             cantidad_bultos: 1,
                             tipo_formato: stockItem.calibre,
                             kilos_totales: pesoCaja
                         });
                         await queryRunner.manager.save(DetallePedido, detalle);
                         qtyConsumed++;
                     }
                     idIndex++;
                 }

            } else if (legacyId) {
                 // --- MODO LEGACY / GRANEL ---
                 const stockItem = await queryRunner.manager.findOne(ProductoTerminado, {
                     where: { id: legacyId },
                     relations: ["definicion", "ubicacion"]
                 });
    
                 if (!stockItem) throw new Error(`Producto ID ${legacyId} no encontrado.`);
                 
                 // Strict Container Check
                 if (stockItem.ubicacion.tipo !== 'contenedor') {
                     throw new Error(`El producto ${stockItem.id} solo se puede despachar desde un Contenedor.`);
                 }
    
                 // Auto-detect format weight (Regex)
                 const formatMatch = (stockItem.calibre || "").match(/(\d+(?:\.\d+)?)\s*(?:kg|grs)/i);
                 let pesoUnitario = 0;
                 if (formatMatch) {
                     const num = parseFloat(formatMatch[1]);
                     pesoUnitario = stockItem.calibre.toLowerCase().includes("grs") ? num / 1000 : num;
                 } else {
                     pesoUnitario = Number(stockItem.peso_neto_kg); // Fallback unsafe
                 }
    
                 const subtotalKilos = cantidadBultosReq * pesoUnitario; // Approximate logic for bulk
    
                 if (Number(stockItem.peso_neto_kg) < subtotalKilos - 0.01) { 
                     throw new Error(`Stock insuficiente (Kilos) para producto ${stockItem.id}. Disp: ${stockItem.peso_neto_kg}kg, Req: ${subtotalKilos}kg`);
                 }
    
                 stockItem.peso_neto_kg -= subtotalKilos;
                 
                 if (stockItem.peso_neto_kg <= 0.01) { 
                     stockItem.peso_neto_kg = 0;
                     stockItem.estado = "Agotado"; 
                 }
                 
                 await queryRunner.manager.save(ProductoTerminado, stockItem);
    
                 // Create Aggregate Detalle
                 const detalle = queryRunner.manager.create(DetallePedido, {
                     pedido: nuevoPedido,
                     producto: { id: stockItem.id },
                     cantidad_bultos: cantidadBultosReq,
                     tipo_formato: stockItem.calibre,
                     kilos_totales: subtotalKilos
                 });
                 await queryRunner.manager.save(DetallePedido, detalle);
            } else {
                 throw new Error("Item de pedido sin ID de producto válido.");
            }
        }

        await queryRunner.commitTransaction();
        return [nuevoPedido, null];

    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error("Error en createPedidoService:", error);
        return [null, error.message];
    } finally {
        await queryRunner.release();
    }
}

export async function getPedidosService() {
    try {
        const pedidos = await AppDataSource.getRepository(Pedido).find({
            relations: {
                detalles: {
                    producto: {
                        definicion: true
                    }
                }
            },
            order: {
                fecha: "DESC"
            }
        });
        return [pedidos, null];
    } catch (error) {
        return [null, error.message];
    }
}
