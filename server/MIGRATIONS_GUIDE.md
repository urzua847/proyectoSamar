# Guía de Migraciones - TypeORM

## ⚠️ IMPORTANTE: Cambios de Esquema en Producción

**NUNCA modifiques las entidades directamente en producción sin migraciones.**

Con `NODE_ENV=production`, TypeORM tiene `synchronize:false`, lo que significa que **cambios en tus archivos `.entity.js` NO se aplicarán automáticamente** a la base de datos.

---

## 🔄 Proceso de Migraciones

### 1. Configuración Inicial (Una sola vez)

Agregar script de migraciones en `server/package.json`:

```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "migration:generate": "typeorm migration:generate -d src/config/configDb.js",
    "migration:run": "typeorm migration:run -d src/config/configDb.js",
    "migration:revert": "typeorm migration:revert -d src/config/configDb.js"
  }
}
```

### 2. Cuando Necesites Modificar el Esquema

#### Ejemplo: Agregar columna `telefono` a la entidad `Proveedor`

**Paso 1: Modificar la entidad (desarrollo)**

```javascript
// src/entity/proveedor.entity.js
const ProveedorSchema = new EntitySchema({
  name: "Proveedor",
  tableName: "proveedores",
  columns: {
    id: { type: "int", primary: true, generated: true },
    nombre: { type: "varchar", length: 100 },
    rut: { type: "varchar", length: 20 },
    // ✅ Nueva columna
    telefono: { type: "varchar", length: 20, nullable: true },
    // ...
  }
});
```

**Paso 2: Generar migración (automático)**

```bash
npm run migration:generate -- -n AddTelefonoToProveedor
```

Esto creará un archivo en `src/migrations/TIMESTAMP-AddTelefonoToProveedor.ts` con SQL automático:

```typescript
export class AddTelefonoToProveedor1234567890 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "proveedores" ADD "telefono" varchar(20)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "proveedores" DROP COLUMN "telefono"`);
    }
}
```

**Paso 3: Revisar y ajustar SQL**

Revisa el archivo generado. TypeORM detecta automáticamente la mayoría de cambios, pero **verifica siempre** que:
- No se borren columnas importantes
- Los tipos de datos sean correctos
- Las restricciones (FK, unique) estén bien

**Paso 4: Ejecutar migración en producción**

```bash
# En el servidor de producción (con NODE_ENV=production)
npm run migration:run
```

---

## 📝 Tipos de Cambios Comunes

### Agregar Columna (Safe)
```javascript
telefono: { type: "varchar", length: 20, nullable: true }
```
✅ Safe - No rompe registros existentes

### Modificar Tipo de Columna (Cuidado)
```javascript
// Antes
precio: { type: "int" }

// Después
precio: { type: "decimal", precision: 10, scale: 2 }
```
⚠️ Requiere conversión de datos - Revisar SQL generado

### Eliminar Columna (PELIGROSO)
```diff
- direccion: { type: "text" }
```
🚨 **EXTREME CAUTION** - Asegúrate que ningún código use esta columna

### Agregar Relación (Moderado)
```javascript
relations: {
  entidad: {
    type: "many-to-one",
    target: "Entidad",
    nullable: true  // ← IMPORTANTE: nullable para registros existentes
  }
}
```
⚠️ Puede requerir script de migración de datos

---

## 🛡️ Mejores Prácticas

1. **Siempre testear en desarrollo primero**
   - Genera la migración en local
   - Ejecútala en tu BD de desarrollo
   - Verifica que la app sigue funcionando

2. **Backup antes de migrar**
   ```bash
   # En producción, SIEMPRE hacer backup
   pg_dump -U postgres -d samar_prod > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Migraciones reversibles**
   - Nunca borres las migraciones old
   - Mantén el método `down()` funcional
   - En caso de error: `npm run migration:revert`

4. **Cambios incrementales**
   - Una migración = un cambio lógico
   - No mezcles "agregar tabla" + "modificar columna"
   - Más fácil de revertir si algo falla

---

## 🔥 Escenarios de Emergencia

### Error durante migración en producción

```bash
# 1. Verificar estado de migraciones
SELECT * FROM migrations;

# 2. Si la última migración falló, revertir
npm run migration:revert

# 3. Corregir el SQL de la migración
# 4. Volver a ejecutar
npm run migration:run
```

### Necesitas forzar sincronización (ÚLTIMA OPCIÓN)

**⚠️ SOLO si estás 100% seguro y tienes backup completo:**

```javascript
// configDb.js - TEMPORAL
synchronize: true,
```

Esto **puede borrar datos**. Solo para ambientes de testing.

---

## 📚 Recursos

- [TypeORM Migrations](https://typeorm.io/migrations)
- [PostgreSQL ALTER TABLE](https://www.postgresql.org/docs/current/sql-altertable.html)

---

## ✅ Checklist Pre-Migración

- [ ] Backup de la base de datos creado
- [ ] Migración testeada en desarrollo
- [ ] SQL revisado manualmente
- [ ] Cambios de código compatibles con esquema nuevo Y viejo (rolling deploy)
- [ ] Plan de rollback documentado
- [ ] Ventana de mantenimiento comunicada (si es cambio grande)
