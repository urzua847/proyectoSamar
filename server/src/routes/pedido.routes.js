"use strict";

import { Router } from "express";
import { 
    createPedido, 
    getPedidos, 
    exportPedidosToExcel, 
    exportPedidosToPDF,
    completarDespacho,
    deletePedido,
    liberarCaja
} from "../controllers/pedido.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";
import { isOperarioOrAdmin, isOperarioOrAdminOrControl } from "../middlewares/authorization.middleware.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", isOperarioOrAdmin, createPedido);
router.delete("/:id", isOperarioOrAdmin, deletePedido);
router.post("/:id/despachar", isOperarioOrAdmin, completarDespacho);
router.post("/:id/liberar-caja", isOperarioOrAdmin, liberarCaja);
router.get("/", isOperarioOrAdminOrControl, getPedidos);

// Rutas de exportación
router.get("/export/excel", exportPedidosToExcel);
router.get("/export/pdf", exportPedidosToPDF);

export default router;

