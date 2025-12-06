"use strict";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

const _filename = fileURLToPath(import.meta.url);

const _dirname = path.dirname(_filename);

const envFilePath = path.resolve(_dirname, ".env");

dotenv.config({ path: envFilePath });

console.log("Environment variables loaded:", Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('XDG_')));
console.log("HOST value:", process.env.HOST);

export const PORT = process.env.PORT; 
export const HOST = process.env.DB_HOST;
export const DB_USERNAME = process.env.DB_USERNAME;
export const PASSWORD = process.env.PASSWORD;
export const DATABASE = process.env.DATABASE;
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET;
export const cookieKey = process.env.cookieKey;