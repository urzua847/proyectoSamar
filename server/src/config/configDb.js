"use strict";
import { DataSource } from "typeorm";
import { DATABASE, DB_USERNAME, HOST, PASSWORD, NODE_ENV } from "./configEnv.js";

const isProduction = NODE_ENV === 'production';
const isDevelopment = NODE_ENV === 'development' || !NODE_ENV;

const dbConfig = {
  type: "postgres",
  host: `${HOST}`,
  port: 5432,
  username: `${DB_USERNAME}`,
  password: `${PASSWORD}`,
  database: `${DATABASE}`,
  entities: ["src/entity/**/*.js"],
  
  synchronize: isDevelopment,
  
  logging: isDevelopment ? ['error', 'warn', 'schema'] : ['error'],
  
  ...(isProduction && {
    poolSize: 20,
    connectTimeoutMS: 10000,
    extra: {
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  }),
  
  extra: {
    timezone: 'America/Santiago' // Zona horaria de Chile
  }
};

export const AppDataSource = new DataSource(dbConfig);

export async function connectDB() {
  try {
    await AppDataSource.initialize();
    
    console.log(`✅ Conexión exitosa a la base de datos`);
    console.log(`📊 Entorno: ${NODE_ENV || 'development (default)'}`);
    
    if (isProduction && AppDataSource.options.synchronize) {
      console.error(`
⛔ CRITICAL WARNING ⛔
synchronize:true is ENABLED in PRODUCTION!
This can DELETE DATA if you modify entities!
Set NODE_ENV=production and ensure synchronize:false
      `);
      process.exit(1);
    }
    
    if (isDevelopment) {
      console.log(`⚙️  Schema Auto-Sync: ${AppDataSource.options.synchronize ? 'ENABLED (Dev Mode)' : 'DISABLED'}`);
    }
    
  } catch (error) {
    console.error("❌ Error al conectar con la base de datos:", error);
    process.exit(1);
  }
}