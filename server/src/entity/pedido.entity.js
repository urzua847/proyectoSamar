"use strict";

import { EntitySchema } from "typeorm";

const PedidoSchema = new EntitySchema({
  name: "Pedido",
  tableName: "pedidos",
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
    numero_guia: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    estado: {
      type: "enum",
      enum: ["Borrador", "Despachado"],
      default: "Despachado",
      nullable: false,
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    detalles: {
      type: "one-to-many",
      target: "DetallePedido",
      inverseSide: "pedido",
      cascade: true,
    },
  },
});

export default PedidoSchema;
