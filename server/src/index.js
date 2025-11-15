"use strict";
import "reflect-metadata";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "passport";
import { PORT } from "./config/configEnv.js";
import { connectDB } from "./config/configDb.js";
import indexRoutes from "./routes/index.routes.js";
import { passportJwtSetup } from "./auth/passport.auth.js";
import { createUsers } from "./config/initialSetup.js";

async function setupServer() {
  try {
    const app = express();
    app.disable("x-powered-by");

    app.use(cors({ credentials: true, origin: true }));
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(cookieParser());

    app.use(passport.initialize());
    passportJwtSetup();

    // Usar las rutas de la API
    app.use("/api", indexRoutes);

    const HOST = process.env.HOST || "0.0.0.0";
    app.listen(PORT, HOST, () => {
      console.log(`Servidor corriendo en: http://${HOST}:${PORT}/api`);
      console.log(`Entorno: ${process.env.NODE_ENV || "development"}`);
    });

  } catch (error) {
    console.error("Error en setupServer: ", error.message);
    process.exit(1);
  }
}

async function setupAPI() {
  try {
    await connectDB();
    await createUsers();
    await setupServer();
  } catch (error) {
    console.error("Error en setupAPI: ", error.message);
    process.exit(1);
  }
}

setupAPI()
  .then(() => console.log("API Iniciada exitosamente"))
  .catch((error) => {
    console.error("Error fatal al iniciar la API: ", error.message);
    process.exit(1);
  });