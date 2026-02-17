"use strict";

import { AppDataSource } from "../config/configDb.js";
import AuditLog from "../entity/auditLog.entity.js";

const auditLogRepository = AppDataSource.getRepository(AuditLog);

/**
 * Registra una acción en el log de auditoría
 * @param {Object} params - Parámetros del log
 * @param {string} params.action - Tipo de acción (CREATE, UPDATE, DELETE, etc.)
 * @param {string} params.entityType - Tipo de entidad afectada
 * @param {number} params.entityId - ID del registro afectado
 * @param {Object} params.user - Usuario que realizó la acción {id, email}
 * @param {Object} params.previousData - Estado anterior (opcional)
 * @param {Object} params.newData - Estado nuevo (opcional)
 * @param {Object} params.metadata - Información adicional (IP, user-agent, etc.)
 * @param {string} params.description - Descripción legible
 */
export async function createAuditLog({
  action,
  entityType,
  entityId = null,
  user = null,
  previousData = null,
  newData = null,
  metadata = null,
  description = null
}) {
  try {
    const auditLog = auditLogRepository.create({
      action,
      entityType,
      entityId,
      userId: user?.id || null,
      userName: user?.email || user?.nombre || null,
      previousData,
      newData,
      metadata,
      description
    });

    console.log(`[AUDIT] Creating log: ${action} - ${entityType} #${entityId}`);
    await auditLogRepository.save(auditLog);
    console.log(`[AUDIT] ✅ Log saved successfully: ID ${auditLog.id}`);
    return [auditLog, null];
  } catch (error) {
    console.error("Error creating audit log:", error);
    // NO lanzar error - Los logs de auditoría no deben romper la operación principal
    return [null, error.message];
  }
}

/**
 * Obtiene el historial de auditoría para una entidad específica
 */
export async function getAuditLogsByEntity(entityType, entityId) {
  try {
    const logs = await auditLogRepository.find({
      where: { entityType, entityId },
      order: { createdAt: "DESC" }
    });
    return [logs, null];
  } catch (error) {
    return [null, error.message];
  }
}

/**
 * Obtiene el historial de auditoría por usuario
 */
export async function getAuditLogsByUser(userId, limit = 50) {
  try {
    const logs = await auditLogRepository.find({
      where: { userId },
      order: { createdAt: "DESC" },
      take: limit
    });
    return [logs, null];
  } catch (error) {
    return [null, error.message];
  }
}

/**
 * Obtiene todos los logs de auditoría (con paginación)
 */
export async function getAllAuditLogs(options = {}) {
  try {
    const page = parseInt(options.page) || 1;
    const limit = parseInt(options.limit) || 50;
    const offset = (page - 1) * limit;

    const [logs, totalCount] = await auditLogRepository.findAndCount({
      order: { createdAt: "DESC" },
      skip: offset,
      take: limit
    });

    return [{
      data: logs,
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
    return [null, error.message];
  }
}

/**
 * Helper: Registra una eliminación (Soft Delete)
 */
export async function logSoftDelete(entityType, entityId, entityData, user) {
  return await createAuditLog({
    action: "SOFT_DELETE",
    entityType,
    entityId,
    user,
    previousData: entityData,
    description: `${entityType} #${entityId} marcado como eliminado por ${user?.email || 'sistema'}`
  });
}

/**
 * Helper: Registra una creación
 */
export async function logCreate(entityType, entityId, entityData, user) {
  return await createAuditLog({
    action: "CREATE",
    entityType,
    entityId,
    user,
    newData: entityData,
    description: `${entityType} #${entityId} creado por ${user?.email || 'sistema'}`
  });
}

/**
 * Helper: Registra una actualización
 */
export async function logUpdate(entityType, entityId, previousData, newData, user) {
  return await createAuditLog({
    action: "UPDATE",
    entityType,
    entityId,
    user,
    previousData,
    newData,
    description: `${entityType} #${entityId} actualizado por ${user?.email || 'sistema'}`
  });
}
