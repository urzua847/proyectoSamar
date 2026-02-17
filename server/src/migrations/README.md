# Migración de Base de Datos - Tabla de Auditoría

## Problema
El Dashboard de Auditoría no muestra datos porque la tabla `audit_logs` puede no existir o estar vacía.

## Solución
Ejecutar la migración SQL que crea la tabla y agrega datos de prueba.

---

## Opción 1: Ejecutar desde Docker (Recomendado)

### Paso 1: Copiar archivo SQL al contenedor
```bash
docker cp server/src/migrations/001_create_audit_table.sql samar_db:/tmp/001_create_audit_table.sql
```

### Paso 2: Ejecutar migración
```bash
docker exec -it samar_db psql -U postgres -d samar_db -f /tmp/001_create_audit_table.sql
```

### Paso 3: Verificar
```bash
docker exec -it samar_db psql -U postgres -d samar_db -c "SELECT COUNT(*) FROM audit_logs;"
```

Deberías ver al menos 5 registros de prueba.

---

## Opción 2: Ejecutar directamente con psql

Si tienes PostgreSQL instalado localmente:

```bash
psql -h localhost -p 5432 -U postgres -d samar_db -f server/src/migrations/001_create_audit_table.sql
```

---

## Opción 3: Desde pgAdmin o DBeaver

1. Conectarse a la base de datos `samar_db`
2. Abrir el archivo `server/src/migrations/001_create_audit_table.sql`
3. Ejecutar todo el script
4. Verificar que hay 5 filas en `audit_logs`

---

## Verificación

Después de ejecutar la migración, verifica:

### 1. Tabla creada
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'audit_logs';
```

### 2. Datos insertados
```sql
SELECT id, action, "entityType", description 
FROM audit_logs 
ORDER BY "createdAt" DESC 
LIMIT 5;
```

### 3. Índices creados
```sql
SELECT indexname 
FROM pg_indexes 
WHERE tablename = 'audit_logs';
```

---

## Después de la Migración

1. **Reinicia Docker** (opcional pero recomendado):
   ```bash
   docker-compose restart server
   ```

2. **Abre el Dashboard de Auditoría** en el navegador:
   - Ve a `http://localhost:5173/panelDeControl`
   - Click en "Auditoría"

3. **Revisa la consola del navegador** (F12):
   - Deberías ver logs como: `✅ [AuditDashboard] Logs recibidos`
   - Si hay errores, revisa los logs con emojis ❌

---

## Troubleshooting

### "Table already exists"
✅ **OK** - La tabla ya existía, solo se insertaron datos de prueba.

### "Permission denied"
❌ Verifica que el usuario `postgres` tenga permisos:
```sql
GRANT ALL PRIVILEGES ON TABLE audit_logs TO postgres;
```

### "Database does not exist"
❌ El nombre de la base de datos puede ser diferente. Verifica con:
```bash
docker exec -it samar_db psql -U postgres -l
```

---

## Rollback (Si es necesario)

Para eliminar la tabla y reintentar:

```sql
DROP TABLE IF EXISTS audit_logs CASCADE;
```

Luego vuelve a ejecutar el script de migración.

---

## Contacto
Si persisten problemas, revisa:
1. Logs del contenedor: `docker logs samar_backend`
2. Consola del navegador (F12)
3. Variables de entorno en `.env`
