-- Migración: Crear tabla de Auditoría
-- Fecha: 2026-01-14
-- Descripción: Crea la tabla audit_logs y sus índices si no existen

-- Crear tabla principal
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    action VARCHAR(50) NOT NULL,
    "entityType" VARCHAR(100) NOT NULL,
    "entityId" INTEGER,
    "userId" INTEGER,
    "userName" VARCHAR(100),
    "previousData" JSONB,
    "newData" JSONB,
    metadata JSONB,
    description TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT check_action_valid CHECK (
        action IN ('CREATE', 'UPDATE', 'DELETE', 'SOFT_DELETE', 'RESTORE', 'LOGIN', 'LOGOUT', 'EXPORT')
    )
);

-- Crear índices para optimizar consultas
CREATE INDEX IF NOT EXISTS "IDX_AUDIT_ENTITY" ON audit_logs("entityType", "entityId");
CREATE INDEX IF NOT EXISTS "IDX_AUDIT_USER" ON audit_logs("userId");
CREATE INDEX IF NOT EXISTS "IDX_AUDIT_ACTION" ON audit_logs(action);
CREATE INDEX IF NOT EXISTS "IDX_AUDIT_CREATED" ON audit_logs("createdAt");

-- Comentarios de documentación
COMMENT ON TABLE audit_logs IS 'Tabla de auditoría append-only para rastrear todas las acciones del sistema';
COMMENT ON COLUMN audit_logs.action IS 'Tipo de acción: CREATE, UPDATE, DELETE, SOFT_DELETE, RESTORE, LOGIN, etc.';
COMMENT ON COLUMN audit_logs."entityType" IS 'Nombre de la entidad afectada (LoteRecepcion, User, etc.)';
COMMENT ON COLUMN audit_logs."entityId" IS 'ID del registro afectado';
COMMENT ON COLUMN audit_logs."userId" IS 'ID del usuario que realizó la acción';
COMMENT ON COLUMN audit_logs."userName" IS 'Nombre/email del usuario (denormalizado para preservar histórico)';
COMMENT ON COLUMN audit_logs."previousData" IS 'Estado anterior del registro en formato JSON';
COMMENT ON COLUMN audit_logs."newData" IS 'Estado nuevo del registro en formato JSON';
COMMENT ON COLUMN audit_logs.metadata IS 'Información adicional: IP, user-agent, navegador, etc.';
COMMENT ON COLUMN audit_logs.description IS 'Descripción legible en lenguaje natural de la acción';

-- Insertar datos de prueba para validar funcionamiento
INSERT INTO audit_logs (action, "entityType", "entityId", "userId", "userName", description, "createdAt")
VALUES 
    ('CREATE', 'User', 1, 1, 'admin@samar.cl', 'Usuario administrador creado en el sistema', NOW() - INTERVAL '2 hours'),
    ('UPDATE', 'LoteRecepcion', 10, 1, 'admin@samar.cl', 'Lote de recepción #10 actualizado con nuevos pesos', NOW() - INTERVAL '1 hour'),
    ('SOFT_DELETE', 'ProductoTerminado', 5, 1, 'admin@samar.cl', 'Producto terminado #5 marcado como eliminado', NOW() - INTERVAL '30 minutes'),
    ('CREATE', 'Entidad', 3, 1, 'admin@samar.cl', 'Nueva entidad cliente registrada', NOW() - INTERVAL '15 minutes'),
    ('LOGIN', 'Auth', NULL, 1, 'admin@samar.cl', 'Inicio de sesión exitoso desde IP 192.168.1.100', NOW() - INTERVAL '5 minutes')
ON CONFLICT DO NOTHING;

-- Verificación
SELECT COUNT(*) as total_logs FROM audit_logs;
