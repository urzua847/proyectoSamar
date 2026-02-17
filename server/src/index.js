
"use strict";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import indexRoutes from "./routes/index.routes.js";
import session from "express-session";
import passport from "passport";
import express, { json, urlencoded } from "express";
import path from "path";
import { fileURLToPath } from "url";
import { cookieKey, HOST, PORT } from "./config/configEnv.js";
import { connectDB } from "./config/configDb.js";
import { createInitialData } from "./config/initialSetup.js";
import { passportJwtSetup } from "./auth/passport.auth.js";

async function setupServer() {
  try {
    const app = express();

    app.disable("x-powered-by");

    // CORS Configuration - Environment-aware
    const corsOptions = {
      credentials: true,
      origin: (origin, callback) => {
        const nodeEnv = process.env.NODE_ENV || 'development';
        
        // Development: Allow all origins for easier testing
        if (nodeEnv === 'development') {
          return callback(null, true);
        }
        
        // Production: Strict whitelist
        const allowedOrigins = process.env.ALLOWED_ORIGINS 
          ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
          : [];
        
        // Allow requests with no origin (like mobile apps, Postman, curl)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          console.warn(`CORS blocked request from unauthorized origin: ${origin}`);
          callback(new Error(`CORS policy: Origin ${origin} is not allowed`));
        }
      }
    };

    app.use(cors(corsOptions));

    app.use(
      urlencoded({
        extended: true,
        limit: "1mb",
      }),
    );

    app.use(
      json({
        limit: "1mb",
      }),
    );

    app.use(cookieParser());

    app.use(morgan("dev"));

    app.use(
      session({
        secret: cookieKey,
        resave: false,
        saveUninitialized: false,
        cookie: {
          secure: process.env.NODE_ENV === 'production', // true en producción (HTTPS)
          httpOnly: true,
          sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict', // 'none' es necesario para cross-site cookies si el front y back están en dominios distintos, 'strict' si es el mismo dominio. Asumiendo mismo dominio por defecto mejor 'strict' o 'lax'.
        },
      }),
    );

    app.use(passport.initialize());
    app.use(passport.session());

    passportJwtSetup();

    app.use("/api", indexRoutes);

    // Servir archivos estáticos del frontend
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    // Ajusta la ruta según tu estructura: server/src/index.js -> ../../client/dist
    const buildPath = path.join(__dirname, "../../client/dist");
    
    app.use(express.static(buildPath));

    app.get(/(.*)/, (req, res) => {
      res.sendFile(path.join(buildPath, "index.html"));
    });

    app.listen(PORT, () => {
      console.log(`Servidor corriendo en ${HOST}:${PORT}/api`);
    });
  } catch (error) {
    console.log("Error en index.js -> setupServer(), el error es: ", error);
  }
}

async function setupAPI() {
  try {
    await connectDB();
    await setupServer();
    await createInitialData();
  } catch (error) {
    console.log("Error en index.js -> setupAPI(), el error es: ", error);
  }
}

setupAPI()
  .then(() => console.log("API Iniciada exitosamente"))
  .catch((error) =>
    console.log("Error en index.js -> setupAPI(), el error es: ", error),
  );
