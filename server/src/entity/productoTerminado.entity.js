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
  },
});

export default ProductoTerminadoSchema;