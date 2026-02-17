"use strict";

import { Router } from "express";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import {
    getAuditLogs,
    getEntityAuditLogs,
    getUserAuditLogs,
    exportAuditLogsToExcel,
    exportAuditLogsToPDF,
    getAlerts,
    getActivityStats
} from "../controllers/audit.controller.js";

const router = Router();

// Todas las rutas de auditoría requieren autenticación
router.use(authenticateJwt);

/**
 * @route   GET /api/audit
 * @desc    Obtener todos los logs de auditoría (paginado)
 * @access  Private (Administrador recomendado)
 * @query   page, limit
 */
router.get("/", getAuditLogs);

/**
 * @route   GET /api/audit/alerts
 * @desc   Obtener alertas de seguridad
 * @access  Private
 */
router.get("/alerts", getAlerts);

/**
 * @route   GET /api/audit/stats
 * @desc    Obtener estadísticas de actividad
 * @access  Private
 */
router.get("/stats", getActivityStats);

/**
 * @route   GET /api/audit/export/excel
 * @desc    Exportar audit logs a Excel
 * @access  Private
 */
router.get("/export/excel", exportAuditLogsToExcel);

/**
 * @route   GET /api/audit/export/pdf
 * @desc    Exportar audit logs a PDF
 * @access  Private
 */
router.get("/export/pdf", exportAuditLogsToPDF);

/**
 * @route   GET /api/audit/entity/:entityType/:entityId
 * @desc    Obtener historial de una entidad específica
 * @access  Private
 * @example /api/audit/entity/LoteRecepcion/123
 */
router.get("/entity/:entityType/:entityId", getEntityAuditLogs);

/**
 * @route   GET /api/audit/user/:userId
 * @desc    Obtener acciones de un usuario específico
 * @access  Private (Administrador recomendado)
 * @query   limit
 */
router.get("/user/:userId", getUserAuditLogs);

export default router;
