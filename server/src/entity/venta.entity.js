"use strict";

import { EntitySchema } from "typeorm";

const VentaSchema = new EntitySchema({
  name: "Venta",
  tableName: "ventas",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    cliente: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    fecha: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
    },
    total: {
      type: "decimal",
      precision: 10,
      scale: 2,
      default: 0,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    detalles: {
      type: "one-to-many",
      target: "DetalleVenta",
      inverseSide: "venta",
      cascade: true,
    },
  },
});

export default VentaSchema;
