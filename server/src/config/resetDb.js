import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: join(__dirname, '../../../.env') });
import { AppDataSource } from './configDb.js';
import { createInitialData } from './initialSetup.js';

async function reset() {
    await AppDataSource.initialize();
    await AppDataSource.dropDatabase();
    await AppDataSource.synchronize();
    console.log("Database schema reset.");
    await createInitialData();
    console.log("Setup complete.");
    process.exit(0);
}

reset().catch(console.error);
