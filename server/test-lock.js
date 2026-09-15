import { AppDataSource } from './src/config/configDb.js';
import ProductoTerminado from './src/entity/productoTerminado.entity.js';

async function testLock() {
    await AppDataSource.initialize();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
        const queryBuild = queryRunner.manager.getRepository(ProductoTerminado)
            .createQueryBuilder("prod")
            .setLock("pessimistic_write")
            .leftJoinAndSelect("prod.ubicacion", "ubi")
            .leftJoinAndSelect("prod.loteDeOrigen", "lote")
            .leftJoinAndSelect("prod.definicion", "def")
            .take(1);
        
        const result = await queryBuild.getMany();
        console.log("Success:", result.length);
    } catch (err) {
        console.error("Lock error:", err.message);
    } finally {
        await queryRunner.rollbackTransaction();
        await queryRunner.release();
        await AppDataSource.destroy();
    }
}

testLock();
