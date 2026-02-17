"use strict";

import { EntitySchema } from "typeorm";

const AuditLogSchema = new EntitySchema({
  name: "AuditLog",
  tableName: "audit_logs",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    action: {
      type: "varchar",
      length: 50,
      nullable: false,
      comment: "Tipo de acción: CREATE, UPDATE, DELETE, LOGIN, etc."
    },
    entityType: {
      type: "varchar",
      length: 100,
      nullable: false,
      comment: "Entidad afectada: LoteRecepcion, ProductoTerminado, etc."
    },
    entityId: {
      type: "int",
      nullable: true,
      comment: "ID del registro afectado"
    },
    userId: {
      type: "int",
      nullable: true,
      comment: "ID del usuario que realizó la acción"
    },
    userName: {
      type: "varchar",
      length: 100,
      nullable: true,
      comment: "Nombre/email del usuario (denormalizado para histórico)"
    },
    previousData: {
      type: "jsonb",
      nullable: true,
      comment: "Estado anterior del registro (para UPDATE/DELETE)"
    },
    newData: {
      type: "jsonb",
      nullable: true,
      comment: "Estado nuevo del registro (para CREATE/UPDATE)"
    },
    metadata: {
      type: "jsonb",
      nullable: true,
      comment: "Información adicional: IP, user-agent, etc."
    },
    description: {
      type: "text",
      nullable: true,
      comment: "Descripción legible de la acción"
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false
    }
  },
  // No relations - Esta tabla es append-only para máxima integridad
  indices: [
    {
      name: "IDX_AUDIT_ENTITY",
      columns: ["entityType", "entityId"]
    },
    {
      name: "IDX_AUDIT_USER",
      columns: ["userId"]
    },
    {
      name: "IDX_AUDIT_ACTION",
      columns: ["action"]
    },
    {
      name: "IDX_AUDIT_CREATED",
      columns: ["createdAt"]
    }
  ]
});

export default AuditLogSchema;
