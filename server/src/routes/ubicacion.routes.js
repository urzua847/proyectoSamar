"use strict";

import { Router } from "express";
import { getUbicaciones, createUbicacion } from "../controllers/ubicacion.controller.js";
import { isAdmin, isOperarioOrAdmin } from "../middlewares/authorization.middleware.js";
import { authenticateJwt } from "../middlewares/authentication.middleware.js";

const router = Router();

router.post("/fix-transit", async (req, res) => {
    try {
        const { AppDataSource } = await import("../config/configDb.js");
        await AppDataSource.query(`UPDATE ubicaciones SET tipo = 'traslado' WHERE nombre = 'En Tránsito'`);
        res.json({ success: true, message: "En Tránsito updated to traslado" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

router.use(authenticateJwt);

router.get("/", isOperarioOrAdmin, getUbicaciones); // Operario necesita verlas
router.post("/", isAdmin, createUbicacion); // Solo admin crea

export default router;