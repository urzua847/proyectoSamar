"use strict";

import { AppDataSource } from "../config/configDb.js";
import AuditLog from "../entity/auditLog.entity.js";

const auditLogRepository = AppDataSource.getRepository(AuditLog);

/**
 * Detecta actividades sospechosas en el sistema
 * @returns {Promise<Array>} Lista de alertas detectadas
 */
export async function detectSuspiciousActivity() {
    const alerts = [];

    try {
        // Regla 1: Más de 10 eliminaciones en 1 hora
        const oneHourAgo = new Date(Date.now() - 3600000);
        const recentDeletes = await auditLogRepository
            .createQueryBuilder("log")
            .where("log.action = :action", { action: "SOFT_DELETE" })
            .andWhere("log.createdAt >= :since", { since: oneHourAgo })
            .getMany();

        if (recentDeletes.length > 10) {
            const users = [...new Set(recentDeletes.map(d => d.userName))];
            alerts.push({
                type: "EXCESSIVE_DELETES",
                severity: "HIGH",
                message: `¡ALERTA! ${recentDeletes.length} eliminaciones en la última hora`,
                users: users,
                count: recentDeletes.length,
                timestamp: new Date()
            });
        }

        // Regla 2: Usuario haciendo muchas acciones en poco tiempo (posible bot/script)
        const fiveMinutesAgo = new Date(Date.now() - 300000);
        const rapidActions = await auditLogRepository
            .createQueryBuilder("log")
            .select("log.userId", "userId")
            .addSelect("log.userName", "userName")
            .addSelect("COUNT(*)", "count")
            .where("log.createdAt >= :since", { since: fiveMinutesAgo })
            .groupBy("log.userId")
            .addGroupBy("log.userName")
            .having("COUNT(*) > :threshold", { threshold: 30 })
            .getRawMany();

        rapidActions.forEach(action => {
            alerts.push({
                type: "RAPID_ACTIONS",
                severity: "MEDIUM",
                message: `Usuario ${action.userName || '#' + action.userId} realizó ${action.count} acciones en 5 minutos`,
                userId: action.userId,
                userName: action.userName,
                count: action.count,
                timestamp: new Date()
            });
        });

        // Regla 3: Eliminaciones fuera de horario laboral (10 PM - 6 AM)
        const now = new Date();
        const currentHour = now.getHours();
        const isOffHours = currentHour >= 22 || currentHour < 6;

        if (isOffHours) {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const offHoursDeletes = await auditLogRepository
                .createQueryBuilder("log")
                .where("log.action = :action", { action: "SOFT_DELETE" })
                .andWhere("log.createdAt >= :since", { since: today })
                .andWhere("(EXTRACT(HOUR FROM log.createdAt) >= 22 OR EXTRACT(HOUR FROM log.createdAt) < 6)")
                .getMany();

            if (offHoursDeletes.length > 0) {
                alerts.push({
                    type: "OFF_HOURS_ACTIVITY",
                    severity: "MEDIUM",
                    message: `${offHoursDeletes.length} eliminaciones fuera de horario laboral hoy`,
                    count: offHoursDeletes.length,
                    timestamp: new Date()
                });
            }
        }

        // Regla 4: Múltiples intentos de restauración (posible error o manipulación)
        const recentRestores = await auditLogRepository
            .createQueryBuilder("log")
            .where("log.action = :action", { action: "RESTORE" })
            .andWhere("log.createdAt >= :since", { since: oneHourAgo })
            .getMany();

        if (recentRestores.length > 5) {
            alerts.push({
                type: "EXCESSIVE_RESTORES",
                severity: "LOW",
                message: `${recentRestores.length} restauraciones en la última hora (posible corrección de errores)`,
                count: recentRestores.length,
                timestamp: new Date()
            });
        }

        return alerts;
    } catch (error) {
        console.error("Error detecting suspicious activity:", error);
        return [];
    }
}

/**
 * Obtiene estadísticas recientes de actividad para el dashboard
 * @returns {Promise<Object>} Estadísticas de actividad
 */
export async function getActivityStats() {
    try {
        const oneDayAgo = new Date(Date.now() - 86400000);
        const oneWeekAgo = new Date(Date.now() - 604800000);

        // Acciones en las últimas 24 horas
        const last24Hours = await auditLogRepository
            .createQueryBuilder("log")
            .select("log.action", "action")
            .addSelect("COUNT(*)", "count")
            .where("log.createdAt >= :since", { since: oneDayAgo })
            .groupBy("log.action")
            .getRawMany();

        // Usuarios más activos (última semana)
        const topUsers = await auditLogRepository
            .createQueryBuilder("log")
            .select("log.userName", "userName")
            .addSelect("COUNT(*)", "count")
            .where("log.createdAt >= :since", { since: oneWeekAgo })
            .andWhere("log.userName IS NOT NULL")
            .groupBy("log.userName")
            .orderBy("count", "DESC")
            .limit(5)
            .getRawMany();

        // Total de acciones por día (última semana)
        const dailyActions = await auditLogRepository
            .createQueryBuilder("log")
            .select("DATE(log.createdAt)", "date")
            .addSelect("COUNT(*)", "count")
            .where("log.createdAt >= :since", { since: oneWeekAgo })
            .groupBy("DATE(log.createdAt)")
            .orderBy("date", "DESC")
            .getRawMany();

        return {
            last24Hours,
            topUsers,
            dailyActions,
            timestamp: new Date()
        };
    } catch (error) {
        console.error("Error getting activity stats:", error);
        return null;
    }
}
