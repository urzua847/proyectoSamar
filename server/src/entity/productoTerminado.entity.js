"use strict";

import { EntitySchema } from "typeorm";

const ProductoTerminadoSchema = new EntitySchema({
  name: "ProductoTerminado",
  tableName: "productos_terminados",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    peso_neto_kg: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
    },
    calibre: {
      type: "varchar",
      length: 100, 
      nullable: true, 
    },
    fecha_produccion: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
    },
    estado: {
      type: "varchar",
      length: 50,
      default: "En Stock", // "En Stock", "Despachado"
    },
    deletedAt: {
      type: "timestamp with time zone",
      nullable: true,
      default: null,
      comment: "Soft delete - Fecha de eliminación lógica"
    },
    piezas_internas: {
      type: "int",
      default: 1,
      comment: "Lleva el conteo de moldes agrupados en este ítem (para cajas de contenedor)"
    },
  },
  relations: {
    loteDeOrigen: {
      type: "many-to-one",
      target: "LoteRecepcion",
      inverseSide: "productosTerminados",
      nullable: false,
    },
    definicion: {
        type: "many-to-one",
        target: "DefinicionProducto",
        inverseSide: "productosTerminados",
        nullable: false,
    },
    ubicacion: {
      type: "many-to-one",
      target: "Ubicacion",
      inverseSide: "productos",
      nullable: false,
    },
    pedido: {
      type: "many-to-one",
      target: "Pedido",
      nullable: true,
      onDelete: "SET NULL",
    },
  },
});

export default ProductoTerminadoSchema;