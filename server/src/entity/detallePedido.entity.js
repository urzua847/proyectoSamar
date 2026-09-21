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
    cajas_asignadas: {
      type: "int",
      default: 0,
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
      nullable: true, // Se hace nullable porque un plan no tiene cajas físicas aún
    },
    definicion_producto: {
      type: "many-to-one",
      target: "DefinicionProducto",
      nullable: true, // Opcional, usado principalmente para requerimientos teóricos
    }
  },
});

export default DetallePedidoSchema;
