"use strict";

import { EntitySchema } from "typeorm";

const DetalleVentaSchema = new EntitySchema({
  name: "DetalleVenta",
  tableName: "detalle_ventas",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    precio_unitario: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
    },
    peso: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
    },
  },
  relations: {
    venta: {
      type: "many-to-one",
      target: "Venta",
      inverseSide: "detalles",
      nullable: false,
    },
    producto: {
      type: "many-to-one", // Changed from one-to-one to allow multiple sales from same batch
      target: "ProductoTerminado",
      joinColumn: true,
      nullable: false,
    },
  },
});

export default DetalleVentaSchema;
