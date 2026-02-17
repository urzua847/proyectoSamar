"use strict";

import { Router } from "express";
import { 
    createPedido, 
    getPedidos, 
    exportPedidosToExcel, 
    exportPedidosToPDF 
} from "../controllers/pedido.controller.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.use(authenticateJwt);

router.post("/", createPedido);
router.get("/", getPedidos);

// Rutas de exportación
router.get("/export/excel", exportPedidosToExcel);
router.get("/export/pdf", exportPedidosToPDF);

export default router;

