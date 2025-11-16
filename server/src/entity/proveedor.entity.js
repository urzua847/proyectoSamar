"use strict";

import { EntitySchema } from "typeorm";

const ProveedorSchema = new EntitySchema({
  name: "Proveedor",
  tableName: "proveedores",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    nombre: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      nullable: false,
    },
    updatedAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
      nullable: false,
    },
  },

  relations: {
    lotes: {
        type: "one-to-many",
        target: "LoteRecepcion", 
        inverseSide: "proveedor",
    },
  },
});

export default ProveedorSchema;