"use strict";

import { EntitySchema } from "typeorm";

const DetallePedidoSchema = new EntitySchema({
  name: "DetallePedido",
  tableName: "detalle_pedidos",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    cantidad_bultos: {
      type: "int",
      nullable: false,
    },
    tipo_formato: {
      type: "varchar",
      length: 100,
      nullable: true,
    },
    kilos_totales: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
    },
  },
  relations: {
    pedido: {
      type: "many-to-one",
      target: "Pedido",
      inverseSide: "detalles",
      nullable: false,
      onDelete: "CASCADE",
    },
    producto: {
      type: "many-to-one",
      target: "ProductoTerminado",
      nullable: false,
    },
  },
});

export default DetallePedidoSchema;
