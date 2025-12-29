"use strict";

import { EntitySchema } from "typeorm";

const LoteRecepcionSchema = new EntitySchema({
  name: "LoteRecepcion",
  tableName: "lotes_recepcion",
  columns: {
    id: {
      type: "int",
      primary: true,
      generated: true,
    },
    codigo: {
      type: "varchar",
      length: 20,
      nullable: false,
      unique: true,
    },
    peso_bruto_kg: {
      type: "decimal",
      precision: 10,
      scale: 2,
      nullable: false,
    },
    numero_bandejas: {
      type: "int",
      nullable: false,
    },
    detalle_pesadas: {
        type: "jsonb", 
        nullable: true,
    },
    estado: {
      type: "boolean",
      default: true, 
      nullable: false,
    },
    en_proceso_produccion: {
        type: "boolean",
        default: false,
    },
    peso_carne_blanca: {
        type: "decimal",
        precision: 10,
        scale: 2,
        nullable: true,
        default: 0
    },
    peso_pinzas: {
        type: "decimal",
        precision: 10,
        scale: 2,
        nullable: true,
        default: 0
    },
    peso_total_producido: {
        type: "decimal",
        precision: 10,
        scale: 2,
        nullable: true,
        default: 0
    },
    observacion_produccion: {
        type: "text",
        nullable: true,
    },
    fecha_inicio_produccion: {
        type: "timestamp with time zone",
        nullable: true,
    },
    fecha_recepcion: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
    },
    createdAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
    },
    updatedAt: {
      type: "timestamp with time zone",
      default: () => "CURRENT_TIMESTAMP",
      onUpdate: "CURRENT_TIMESTAMP",
    },
  },
  relations: {
    proveedor: {
      type: "many-to-one",
      target: "Proveedor",
      inverseSide: "lotes",
      nullable: false, 
    },
    materiaPrima: {
      type: "many-to-one",
      target: "MateriaPrima",
      inverseSide: "lotes",
      nullable: false, 
    },
    operario: {
      type: "many-to-one",
      target: "User",
      nullable: false, 
    },
    productosTerminados: {
        type: "one-to-many",
        target: "ProductoTerminado",
        inverseSide: "loteDeOrigen",
    },
    producciones: {
        type: "one-to-many",
        target: "Produccion",
        inverseSide: "loteRecepcion",
    }
  },
});

export default LoteRecepcionSchema;
