import { AppDataSource } from './src/config/configDb.js';
import AuditLog from './src/entity/auditLog.entity.js';

async function test() {
  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(AuditLog);
  const logs = await repo.find({
    order: { createdAt: 'DESC' },
    take: 5
  });
  console.log(JSON.stringify(logs, null, 2));
  process.exit(0);
}
test().catch(console.error);
