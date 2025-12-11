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
    fecha: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
    },
    cliente: {
      type: "varchar",
      length: 255,
      nullable: false,
    },
    n_guia_despacho: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    tipo_venta: {
      type: "enum",
      enum: ["Nacional", "Exportación"],
      default: "Nacional",
      nullable: true,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    productos: {
      type: "one-to-many",
      target: "ProductoTerminado",
      inverseSide: "venta",
    },
  },
});

export default VentaSchema;
