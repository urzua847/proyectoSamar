"use strict";

import { AppDataSource } from "../config/configDb.js";
import Pedido from "../entity/pedido.entity.js";
import DetallePedido from "../entity/detallePedido.entity.js";
import ProductoTerminado from "../entity/productoTerminado.entity.js";
import Ubicacion from "../entity/ubicacion.entity.js";
import DefinicionProducto from "../entity/definicionProducto.entity.js";
import { logCreate } from "./audit.service.js";

export async function createPedidoService(data, user = null) {
    console.log('[DEBUG] User in createPedidoService:', user);
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
                     // Fetch lock usando SQL puro para garantizar 0 LEFT JOINS inyectados
                     const lockedRaw = await queryRunner.query(
                         `SELECT id, peso_neto_kg FROM productos_terminados WHERE id = $1 FOR UPDATE`,
                         [currentId]
                     );
                     
                     if (lockedRaw.length === 0) throw new Error(`Producto ID ${currentId} no encontrado en stock.`);
                     
                     // Fetch de las relaciones separadamente si se necesita
                     const stockItem = await queryRunner.manager.findOne(ProductoTerminado, {
                         where: { id: currentId },
                         relations: ["definicion", "ubicacion"]
                     });
                     
                     if (stockItem) {
                         stockItem.peso_neto_kg = Number(lockedRaw[0].peso_neto_kg); // Usar el peso bloqueado
                     }

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
                 // Fetch lock usando SQL puro para garantizar 0 LEFT JOINS inyectados
                 const lockedRaw = await queryRunner.query(
                     `SELECT id, peso_neto_kg FROM productos_terminados WHERE id = $1 FOR UPDATE`,
                     [legacyId]
                 );

                 if (lockedRaw.length === 0) throw new Error(`Producto ID ${legacyId} no encontrado.`);

                 const stockItem = await queryRunner.manager.findOne(ProductoTerminado, {
                     where: { id: legacyId },
                     relations: ["definicion", "ubicacion"]
                 });
                 
                 if (stockItem) {
                     stockItem.peso_neto_kg = Number(lockedRaw[0].peso_neto_kg);
                 }
                 
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
            } else if (item.definicionProductoId) {
                 // --- MODO PLANIFICACION ---
                 const defId = item.definicionProductoId;
                 const definicion = await queryRunner.manager.findOne(DefinicionProducto, { where: { id: defId } });
                 if (!definicion) throw new Error(`Definición de Producto ID ${defId} no encontrada.`);
                 
                 const pesoCaja = parseFloat(item.peso_caja || 0);
                 const subtotalKilos = cantidadBultosReq * pesoCaja;

                 const detalle = queryRunner.manager.create(DetallePedido, {
                     pedido: nuevoPedido,
                     definicion_producto: { id: defId },
                     cantidad_bultos: cantidadBultosReq,
                     tipo_formato: item.tipo_formato,
                     kilos_totales: subtotalKilos
                 });
                 await queryRunner.manager.save(DetallePedido, detalle);
            } else {
                 throw new Error("Item de pedido sin ID de producto o definición válido.");
            }
        }

        // Obtener detalles completos del pedido para auditoría
        const detallesCompletos = await queryRunner.manager.find(DetallePedido, {
            where: { pedido: { id: nuevoPedido.id } },
            relations: ['producto', 'producto.definicion']
        });

        // Registrar en auditoría con detalle completo
        await logCreate('Pedido', nuevoPedido.id, {
            cliente: nuevoPedido.cliente,
            numero_guia: nuevoPedido.numero_guia,
            fecha: nuevoPedido.fecha,
            total_items: items.length,
            kilos_totales: detallesCompletos.reduce((acc, d) => acc + Number(d.kilos_totales), 0).toFixed(2),
            detalle_productos: detallesCompletos.map(d => ({
                producto: d.producto?.definicion?.nombre || 'N/A',
                cantidad_bultos: d.cantidad_bultos,
                kilos: Number(d.kilos_totales).toFixed(2),
                formato: d.tipo_formato || 'N/A'
            }))
        }, user);

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

export async function getPedidosService(options = {}) {
    try {
        // Pagination parameters with defaults
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 50;
        const offset = (page - 1) * limit;

        const pedidoRepo = AppDataSource.getRepository(Pedido);

        // Build query
        let query = pedidoRepo.createQueryBuilder('pedido')
            .leftJoinAndSelect('pedido.detalles', 'detalles')
            .leftJoinAndSelect('detalles.definicion_producto', 'definicion_producto')
            .leftJoinAndSelect('detalles.producto', 'producto')
            .leftJoinAndSelect('producto.definicion', 'definicion')
            .leftJoinAndSelect('pedido.cajasAsignadas', 'cajasAsignadas')
            .leftJoinAndSelect('cajasAsignadas.definicion', 'cajaDefinicion');

        // Apply filters
        if (options.cliente) {
            query = query.andWhere('LOWER(pedido.cliente) LIKE LOWER(:cliente)', {
                cliente: `%${options.cliente}%`
            });
        }

        if (options.fecha_desde) {
            query = query.andWhere('pedido.fecha >= :desde', { 
                desde: options.fecha_desde 
            });
        }

        if (options.fecha_hasta) {
            query = query.andWhere('pedido.fecha <= :hasta', { 
                hasta: options.fecha_hasta 
            });
        }

        if (options.numero_guia) {
            query = query.andWhere('pedido.numero_guia LIKE :guia', {
                guia: `%${options.numero_guia}%`
            });
        }

        // Get total count
        const totalCount = await query.getCount();

        // Get paginated pedidos
        const pedidos = await query
            .orderBy('pedido.fecha', 'DESC')
            .skip(offset)
            .take(limit)
            .getMany();

        // Return with pagination metadata
        return [{
            data: pedidos,
            pagination: {
                currentPage: page,
                pageSize: limit,
                totalItems: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNextPage: page < Math.ceil(totalCount / limit),
                hasPreviousPage: page > 1
            }
        }, null];
    } catch (error) {
        console.error('[ERROR] getPedidosService:', error);
        return [null, error.message];
    }
}

/**
 * Obtener pedidos para exportación (sin paginación, con todos los detalles)
 */
export async function getPedidosForExport(filters = {}) {
    try {
        const pedidoRepo = AppDataSource.getRepository(Pedido);

        // Build query
        let query = pedidoRepo.createQueryBuilder('pedido')
            .leftJoinAndSelect('pedido.detalles', 'detalles')
            .leftJoinAndSelect('detalles.definicion_producto', 'definicion_producto')
            .leftJoinAndSelect('detalles.producto', 'producto')
            .leftJoinAndSelect('producto.definicion', 'definicion')
            .leftJoinAndSelect('pedido.cajasAsignadas', 'cajasAsignadas')
            .leftJoinAndSelect('cajasAsignadas.definicion', 'cajaDefinicion');

        // Apply filters (same as getPedidosService)
        if (filters.cliente) {
            query = query.andWhere('LOWER(pedido.cliente) LIKE LOWER(:cliente)', {
                cliente: `%${filters.cliente}%`
            });
        }

        if (filters.fecha_desde) {
            query = query.andWhere('pedido.fecha >= :desde', { 
                desde: filters.fecha_desde 
            });
        }

        if (filters.fecha_hasta) {
            query = query.andWhere('pedido.fecha <= :hasta', { 
                hasta: filters.fecha_hasta 
            });
        }

        if (filters.numero_guia) {
            query = query.andWhere('pedido.numero_guia LIKE :guia', {
                guia: `%${filters.numero_guia}%`
            });
        }

        // Get ALL pedidos matching filters (no pagination)
        const pedidos = await query
            .orderBy('pedido.fecha', 'DESC')
            .getMany();

        console.log(`📊 [PedidoService] Pedidos para export: ${pedidos.length} registros`);

        return [pedidos, null];
    } catch (error) {
        console.error('[ERROR] getPedidosForExport:', error);
        return [null, error.message];
    }
}

export async function deletePedidoService(id, user = null) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const pedido = await queryRunner.manager.findOne(Pedido, { 
            where: { id }, 
            relations: ["detalles", "detalles.producto"] 
        });
        if (!pedido) throw new Error("Pedido no encontrado.");

        if (pedido.detalles && pedido.detalles.some(d => (d.cajas_asignadas || 0) > 0)) {
            throw new Error("No se puede eliminar un pedido que ya tiene cajas ingresadas/despachadas.");
        }

        // Restaurar estado de los productos (legacy fallback)
        if (pedido.detalles && pedido.detalles.length > 0) {
            for (const detalle of pedido.detalles) {
                if (detalle.producto) {
                    const prod = await queryRunner.manager.findOne(ProductoTerminado, { where: { id: detalle.producto.id } });
                    if (prod) {
                        prod.estado = "En Stock";
                        await queryRunner.manager.save(ProductoTerminado, prod);
                    }
                }
            }
            await queryRunner.manager.remove(DetallePedido, pedido.detalles);
        }

        await queryRunner.manager.remove(Pedido, pedido);
        await logCreate('EliminarPedido', null, { pedido_id: id }, user);

        await queryRunner.commitTransaction();
        return [true, null];
    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error("Error en deletePedidoService:", error);
        return [null, error.message];
    } finally {
        await queryRunner.release();
    }
}

export async function completarDespachoPedidoService(pedidoId, cajasIds, user, cerrarPedido = false) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const pedido = await queryRunner.manager.findOne(Pedido, {
            where: { id: pedidoId },
            relations: ["detalles", "detalles.definicion_producto"]
        });

        if (!pedido) throw new Error("Pedido no encontrado");

        let cajasDespachadas = [];

        if (cajasIds && cajasIds.length > 0) {
            for (const cajaId of cajasIds) {
                const caja = await queryRunner.manager.findOne(ProductoTerminado, {
                    where: { id: cajaId },
                    relations: ["definicion"]
                });

                if (!caja) throw new Error(`Caja ID ${cajaId} no encontrada`);
                if (caja.estado === "Despachado") throw new Error(`Caja ID ${cajaId} ya se encuentra despachada`);
                
                const requerimiento = pedido.detalles.find(d => 
                    d.definicion_producto && caja.definicion && 
                    d.definicion_producto.id === caja.definicion.id
                );
                
                if (!requerimiento) {
                    throw new Error(`La caja de ${caja.definicion?.nombre || 'Desconocido'} no corresponde a ninguno de los productos solicitados en este pedido.`);
                }

                caja.estado = "Despachado";
                caja.pedido = pedido;
                await queryRunner.manager.save(ProductoTerminado, caja);

                requerimiento.kilos_totales = Number(requerimiento.kilos_totales || 0) + Number(caja.peso_neto_kg);
                requerimiento.cajas_asignadas = (requerimiento.cajas_asignadas || 0) + 1;
                await queryRunner.manager.save(DetallePedido, requerimiento);

                cajasDespachadas.push(caja);
            }
        }

        if (cerrarPedido) {
            const isComplete = pedido.detalles.every(d => (d.cajas_asignadas || 0) >= d.cantidad_bultos);
            if (!isComplete && user.rol !== 'administrador') {
                throw new Error("El pedido no está completo. Solo un administrador puede forzar el cierre de un despacho incompleto.");
            }
            
            // Recalculate actual kilos for each requirement based on assigned boxes
            const cajasAsignadas = await queryRunner.manager.find(ProductoTerminado, {
                where: { pedido: { id: pedidoId } },
                relations: ["definicion"]
            });

            for (const detalle of pedido.detalles) {
                const cajasReales = cajasAsignadas.filter(c => c.definicion && detalle.definicion_producto && c.definicion.id === detalle.definicion_producto.id);
                const sumKilosReales = cajasReales.reduce((sum, caja) => sum + Number(caja.peso_neto_kg || 0), 0);
                
                detalle.kilos_totales = sumKilosReales; // Replace requested estimate with actual delivered sum
                await queryRunner.manager.save(DetallePedido, detalle);
            }

            pedido.estado = "Despachado";
            await queryRunner.manager.save(Pedido, pedido);
        }

        await queryRunner.commitTransaction();
        return [pedido, null];
    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error("Error en completarDespachoPedidoService:", error);
        return [null, error.message];
    } finally {
        await queryRunner.release();
    }
}

export async function liberarCajaDePedidoService(pedidoId, cajaId, user) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const pedido = await queryRunner.manager.findOne(Pedido, {
            where: { id: pedidoId },
            relations: ["detalles", "detalles.definicion_producto"]
        });

        if (!pedido) throw new Error("Pedido no encontrado");
        if (pedido.estado !== "Pendiente") throw new Error("Solo se pueden liberar cajas de pedidos en estado Pendiente.");

        const caja = await queryRunner.manager.findOne(ProductoTerminado, {
            where: { id: cajaId },
            relations: ["definicion", "pedido"]
        });

        if (!caja) throw new Error("Caja no encontrada.");
        if (!caja.pedido || caja.pedido.id !== Number(pedidoId)) throw new Error("Esta caja no está asignada a este pedido.");

        const requerimiento = pedido.detalles.find(d => 
            d.definicion_producto && caja.definicion && 
            d.definicion_producto.id === caja.definicion.id
        );

        if (!requerimiento) {
            throw new Error(`Detalle de requerimiento para ${caja.definicion?.nombre} no encontrado en el pedido.`);
        }

        // Find "En Transito" container
        let transitoContainer = await queryRunner.manager.findOne(Ubicacion, {
            where: { tipo: 'transito' }
        });
        
        if (!transitoContainer) {
            // Fallback just in case
            transitoContainer = await queryRunner.manager.findOne(Ubicacion, {
                where: { nombre: 'En Tránsito' }
            });
        }

        // Revert box state and move to transito
        caja.estado = "En Stock";
        caja.pedido = null;
        if (transitoContainer) {
            caja.ubicacion = transitoContainer;
        }
        await queryRunner.manager.save(ProductoTerminado, caja);

        // Revert requirement state
        requerimiento.kilos_totales = Number(requerimiento.kilos_totales || 0) - Number(caja.peso_neto_kg);
        if (requerimiento.kilos_totales < 0) requerimiento.kilos_totales = 0;
        
        requerimiento.cajas_asignadas = (requerimiento.cajas_asignadas || 0) - 1;
        if (requerimiento.cajas_asignadas < 0) requerimiento.cajas_asignadas = 0;
        
        await queryRunner.manager.save(DetallePedido, requerimiento);

        await logCreate('LiberarCajaPedido', null, { pedido_id: pedidoId, caja_id: cajaId }, user);

        await queryRunner.commitTransaction();
        return [true, null];
    } catch (error) {
        await queryRunner.rollbackTransaction();
        console.error("Error en liberarCajaDePedidoService:", error);
        return [null, error.message];
    } finally {
        await queryRunner.release();
    }
}

