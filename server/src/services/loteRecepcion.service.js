"use strict";

import { AppDataSource } from "../config/configDb.js";
import LoteRecepcion from "../entity/loteRecepcion.entity.js";
import Proveedor from "../entity/proveedor.entity.js";
import MateriaPrima from "../entity/materiaPrima.entity.js";
import User from "../entity/user.entity.js";
import ProductoTerminado from "../entity/productoTerminado.entity.js";
import { Like } from "typeorm";
import Produccion from "../entity/produccion.entity.js";
import { logCreate, logUpdate } from "./audit.service.js";
const loteRepository = AppDataSource.getRepository(LoteRecepcion);
const proveedorRepository = AppDataSource.getRepository(Proveedor);
const materiaPrimaRepository = AppDataSource.getRepository(MateriaPrima);
const userRepository = AppDataSource.getRepository(User);
const productoTerminadoRepository = AppDataSource.getRepository(ProductoTerminado);
const produccionRepository = AppDataSource.getRepository(Produccion);

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
    
    // Registrar en auditoría con TODOS los detalles
    await logCreate('LoteRecepcion', newLote.id, {
      codigo: newLote.codigo,
      peso_bruto_kg: newLote.peso_bruto_kg,
      numero_bandejas: newLote.numero_bandejas,
      proveedor: proveedor.nombre,
      materiaPrima: materiaPrima.nombre,
      operario: operario.username || operario.email,
      detalle_pesadas: pesadas
    }, { id: operario.id, email: operario.email });

    return [newLote, null];
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getLotesActivosService(options = {}) {
    try {
        // Pagination parameters with defaults
        const page = parseInt(options.page) || 1;
        const limit = parseInt(options.limit) || 100;
        const offset = (page - 1) * limit;

        // Get total count (exclude soft-deleted)
        const totalCount = await loteRepository.count({ where: { deletedAt: null } });

        // Get paginated lotes (exclude soft-deleted)
        const lotes = await loteRepository.find({
            where: { deletedAt: null },  // ← Filtrar registros eliminados
            relations: ["proveedor", "materiaPrima", "productosTerminados"],
            order: { createdAt: "DESC" },
            skip: offset,
            take: limit
        });

        if (!lotes) return [null, "No se encontraron lotes"];

        // Return with pagination metadata
        return [{
            data: lotes,
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
        throw new Error(error.message);
    }
}

export async function getRecepcionesByEntidadService(entidadId) {
    try {
        const lotes = await loteRepository.find({
            where: { proveedor: { id: entidadId } },
            relations: ["proveedor", "materiaPrima", "productosTerminados"],
            order: { createdAt: "DESC" }
        });
        return [lotes, null];
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function getLoteByIdService(id) {
    try {
        const lote = await loteRepository.findOne({
            where: { id },
            relations: [
                "proveedor",
                "materiaPrima",
                "operario",
                "productosTerminados",
                "productosTerminados.definicion",
                "productosTerminados.ubicacion"
            ]
        });

        return [lote, null];
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function updateLoteService(id, data, user = null) {
    try {
        const lote = await loteRepository.findOne({ 
            where: { id },
            relations: ["productosTerminados"] 
        });
        
        if (!lote) return [null, "Lote no encontrado"];

        // Guardar estado previo para la auditoría
        const previousData = {
            codigo: lote.codigo,
            peso_bruto_kg: Number(lote.peso_bruto_kg),
            estado: lote.estado,
            en_proceso_produccion: lote.en_proceso_produccion
        };

        const tieneProduccion = (lote.productosTerminados && lote.productosTerminados.length > 0) || lote.en_proceso_produccion;

        const intentaEditarFisico = 
            data.proveedorId !== undefined || 
            data.materiaPrimaId !== undefined || 
            data.peso_bruto_kg !== undefined || 
            data.numero_bandejas !== undefined || 
            data.pesadas !== undefined;

        if (tieneProduccion && intentaEditarFisico) {
            return [null, "No se pueden editar peso/proveedor porque este lote ya tiene producción iniciada. Solo puedes cambiar su estado o datos de rendimiento."];
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
        if (data.estado !== undefined) lote.estado = data.estado;

        if (data.en_proceso_produccion !== undefined) lote.en_proceso_produccion = data.en_proceso_produccion;
        if (data.peso_carne_blanca !== undefined) lote.peso_carne_blanca = data.peso_carne_blanca;
        if (data.peso_pinzas !== undefined) lote.peso_pinzas = data.peso_pinzas;
        if (data.peso_total_producido !== undefined) lote.peso_total_producido = data.peso_total_producido;
        if (data.observacion_produccion !== undefined) lote.observacion_produccion = data.observacion_produccion;
        if (data.fecha_inicio_produccion !== undefined) lote.fecha_inicio_produccion = data.fecha_inicio_produccion;

        const loteActualizado = await loteRepository.save(lote);
        
        // Registrar en auditoría
        await logUpdate('LoteRecepcion', lote.id, previousData, {
          codigo: loteActualizado.codigo,
          peso_bruto_kg: Number(loteActualizado.peso_bruto_kg),
          estado: loteActualizado.estado,
          en_proceso_produccion: loteActualizado.en_proceso_produccion
        }, user);
        
        return [loteActualizado, null];
    } catch (error) {
        throw new Error(error.message);
    }
}

export async function deleteLoteService(id, userRole, force = false, user = null) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // 1. Buscar lote con relaciones
        const lote = await queryRunner.manager.findOne(LoteRecepcion, { 
            where: { id, deletedAt: null },  // Solo lotes no eliminados
            relations: ["productosTerminados", "producciones", "proveedor", "materiaPrima"] 
        });
        
        if (!lote) {
            await queryRunner.rollbackTransaction();
            return [null, "Lote no encontrado o ya fue eliminado"];
        }

        // 2. Verificar si tiene producción asociada
        const hasProduccion = (lote.producciones && lote.producciones.length > 0) || 
                              (lote.productosTerminados && lote.productosTerminados.length > 0);

        if (hasProduccion) {
            // 2.1 Verificar permisos de administrador
            if (userRole !== 'administrador') {
                await queryRunner.rollbackTransaction();
                return [null, "No tienes permisos de Administrador para eliminar este lote con producción iniciada."];
            }

            // 2.2 Verificar confirmación explícita
            if (!force) {
                await queryRunner.rollbackTransaction();
                return [null, "El lote tiene producciones asociadas. Se requiere confirmación de Administrador para eliminar todo."];
            }
            
            // 2.3 Soft Delete de datos relacionados en cascada
            try {
                // Marcar producciones como eliminadas (si existen)
                if (lote.producciones && lote.producciones.length > 0) {
                    for (const produccion of lote.producciones) {
                        produccion.deletedAt = new Date();
                        await queryRunner.manager.save(produccion);
                    }
                }

                // Marcar productos terminados como eliminados
                if (lote.productosTerminados && lote.productosTerminados.length > 0) {
                    for (const producto of lote.productosTerminados) {
                        // Verificar que no esté vendido
                        if (producto.estado === 'Vendido') {
                            await queryRunner.rollbackTransaction();
                            return [null, "No se puede eliminar: hay productos que ya fueron VENDIDOS (están en Pedidos)."];
                        }
                        producto.deletedAt = new Date();
                        await queryRunner.manager.save(producto);
                    }
                }
            } catch (innerError) {
                await queryRunner.rollbackTransaction();
                return [null, `Error al eliminar datos relacionados: ${innerError.message}`];
            }
        }

        // 3. Soft Delete del lote
        const loteDataSnapshot = {
            id: lote.id,
            codigo: lote.codigo,
            peso_bruto_kg: lote.peso_bruto_kg,
            proveedor: lote.proveedor?.nombre,
            materiaPrima: lote.materiaPrima?.nombre
        };

        lote.deletedAt = new Date();
        await queryRunner.manager.save(LoteRecepcion, lote);

        // 4. Registrar en auditlog (importar el servicio al inicio del archivo)
        const { logSoftDelete } = await import('./audit.service.js');
        await logSoftDelete('LoteRecepcion', lote.id, loteDataSnapshot, user);

        // 5. Commit exitoso
        await queryRunner.commitTransaction();
        return [lote, null];

    } catch (error) {
        // 6. Rollback en caso de error
        await queryRunner.rollbackTransaction();
        throw new Error(error.message);
    } finally {
        // 7. Liberar recursos
        await queryRunner.release();
    }
}

/**
 * Restaurar un lote eliminado (Soft Delete Undo)
 */
export async function restoreLoteService(id, userRole, user = null) {
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        // 1. Buscar lote eliminado (withDeleted equivalent)
        const lote = await queryRunner.manager
            .createQueryBuilder(LoteRecepcion, "lote")
            .where("lote.id = :id", { id })
            .andWhere("lote.deletedAt IS NOT NULL")  // Solo lotes eliminados
            .leftJoinAndSelect("lote.productosTerminados", "productos")
            .leftJoinAndSelect("lote.producciones", "producciones")
            .getOne();
        
        if (!lote) {
            await queryRunner.rollbackTransaction();
            return [null, "Lote no encontrado o no está eliminado"];
        }

        // 2. Verificar permisos (solo admin puede restaurar)
        if (userRole !== 'administrador') {
            await queryRunner.rollbackTransaction();
            return [null, "Solo administradores pueden restaurar lotes eliminados"];
        }

        // 3. Restaurar lote
        lote.deletedAt = null;
        await queryRunner.manager.save(LoteRecepcion, lote);

        // 4. Restaurar datos relacionados si existen
        if (lote.producciones && lote.producciones.length > 0) {
            for (const produccion of lote.producciones) {
                produccion.deletedAt = null;
                await queryRunner.manager.save(produccion);
            }
        }

        if (lote.productosTerminados && lote.productosTerminados.length > 0) {
            for (const producto of lote.productosTerminados) {
                producto.deletedAt = null;
                await queryRunner.manager.save(producto);
            }
        }

        // 5. Registrar en audit log
        const { createAuditLog } = await import('./audit.service.js');
        await createAuditLog({
            action: "RESTORE",
            entityType: "LoteRecepcion",
            entityId: lote.id,
            user,
            newData: { codigo: lote.codigo },
            description: `LoteRecepcion #${lote.id} restaurado por ${user?.email || 'sistema'}`
        });

        // 6. Commit
        await queryRunner.commitTransaction();
        return [lote, null];

    } catch (error) {
        await queryRunner.rollbackTransaction();
        throw new Error(error.message);
    } finally {
        await queryRunner.release();
    }
}