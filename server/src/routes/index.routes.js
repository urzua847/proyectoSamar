"use strict";
import { Router } from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import materiaPrimaRoutes from "./materiaPrima.routes.js";
import productoRoutes from "./definicionProducto.routes.js";
import entidadRoutes from "./entidad.routes.js";
import dashboardRoutes from "./dashboard.routes.js"; 
import loteRecepcionRoutes from "./loteRecepcion.routes.js";
import ubicacionRoutes from "./ubicacion.routes.js";
import produccionRoutes from "./produccion.routes.js";
import trasladoRoutes from "./traslado.routes.js";
import pedidoRoutes from "./pedido.routes.js";
import envasadoRoutes from "./envasado.routes.js";


const router = Router();

router.use("/auth", authRoutes);
router.use("/user", userRoutes);
router.use("/entidades", entidadRoutes); 
router.use("/dashboard", dashboardRoutes);
router.use("/materiasPrimas", materiaPrimaRoutes);
router.use("/productos", productoRoutes);
router.use("/recepcion", loteRecepcionRoutes);
router.use("/ubicaciones", ubicacionRoutes);
router.use("/produccion", produccionRoutes);
router.use("/envasado", envasadoRoutes);
router.use("/traslado", trasladoRoutes);
router.use("/pedidos", pedidoRoutes);

export default router;