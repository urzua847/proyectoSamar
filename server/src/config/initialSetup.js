"use strict";

import User from "../entity/user.entity.js";
import Entidad from "../entity/entidad.entity.js";
import Proveedor from "../entity/proveedor.entity.js";
import Cliente from "../entity/cliente.entity.js";
import MateriaPrima from "../entity/materiaPrima.entity.js";
import Ubicacion from "../entity/ubicacion.entity.js";
import DefinicionProducto from "../entity/definicionProducto.entity.js";
import { AppDataSource } from "./configDb.js";
import { encryptPassword } from "../helpers/bcrypt.helper.js";

/* ==============================================
   1. USUARIOS (Admin y Operario)
   ============================================== */
async function createUsers() {
  const userRepository = AppDataSource.getRepository(User);
  const count = await userRepository.count();
  if (count > 0) return;

  await Promise.all([
    userRepository.save(userRepository.create({
      nombreCompleto: "Admin",
      username: "admin",
      rut: "11111111-1",
      email: "admin@correo.com",
      password: await encryptPassword("admin123"),
      rol: "administrador",
    })),
    userRepository.save(userRepository.create({
      nombreCompleto: "Operario",
      username: "operario",
      rut: "22222222-2",
      email: "operario@correo.com",
      password: await encryptPassword("123456"),
      rol: "operario",
    })),
  ]);
  console.log("Usuarios iniciales creados.");
}

/* ==============================================
   2. MATERIAS PRIMAS (Jaiba, Pulpo)
   ============================================== */
async function createMateriasPrimas() {
  const repo = AppDataSource.getRepository(MateriaPrima);
  
  const mps = [
      { nombre: "Jaiba", rendimiento_teorico_global: 14.87 },
      { nombre: "Pulpo", rendimiento_teorico_global: 76.80 }
  ];

  for (const mpData of mps) {
      const exists = await repo.findOne({ where: { nombre: mpData.nombre } });
      if (!exists) {
          await repo.save(repo.create(mpData));
      } else {
          exists.rendimiento_teorico_global = mpData.rendimiento_teorico_global;
          await repo.save(exists);
      }
  }
  console.log("Materias Primas creadas.");
}

/* ==============================================
   3. ENTIDADES (Clientes y Proveedores - Tabla Única)
   ============================================== */
async function createProveedores() { 
  const repo = AppDataSource.getRepository(Entidad); 
  const repoProv = AppDataSource.getRepository(Proveedor); 
  const repoCli = AppDataSource.getRepository(Cliente); 

  const count = await repo.count();
  if (count > 0) return; 

  console.log("Entidades Iniciales creadas.");

  // PROVEEDORES
  await repoProv.save([
    repoProv.create({ nombre: "Pedro Vidal", rut: "12345678-9", tipo: "proveedor" }),
    repoProv.create({ nombre: "Don Isau", rut: "98765432-1", tipo: "proveedor" }),
    repoProv.create({ nombre: "Julio Gallardo", rut: "11223344-5", tipo: "proveedor" }),
    repoProv.create({ nombre: "Comercial Samar", rut: "55667788-9", tipo: "proveedor" }),
  ]);

  // CLIENTES
  await repoCli.save([
      repoCli.create({ nombre: "Sodexo", rut: "111-1", tipo: "cliente" }),
      repoCli.create({ nombre: "Restaurante El Puerto", rut: "222-2", tipo: "cliente" })
  ]);

  console.log("Entidades (Proveedores y Clientes) creadas.");
}

/* ==============================================
   4. UBICACIONES (Cámaras y Contenedores)
   ============================================== */
async function createUbicaciones() {
  const repo = AppDataSource.getRepository(Ubicacion);
  const count = await repo.count();
  if (count === 0) {
    await repo.save([
      repo.create({ nombre: "Cámara 1", tipo: "camara" }),
      repo.create({ nombre: "Cámara 2", tipo: "camara" }),
      repo.create({ nombre: "Cámara 3", tipo: "camara" }),
      repo.create({ nombre: "Contenedor 1", tipo: "contenedor" }),
      repo.create({ nombre: "Contenedor 2", tipo: "contenedor" }),
    ]);
    console.log("Ubicaciones base creadas.");
  }

  // Asegurar siempre que existe En Tránsito (incluso si la BD ya tenía datos previos)
  const existeTransito = await repo.findOne({ where: { nombre: "En Tránsito", tipo: "contenedor" } });
  if (!existeTransito) {
    await repo.save(repo.create({ nombre: "En Tránsito", tipo: "contenedor", capacidad_maxima: 100000 }));
    console.log("Ubicación 'En Tránsito' añadida.");
  }
}

/* ==============================================
   5. PRODUCTOS (Flujo Real: Primarios vs Elaborados)
   ============================================== */
async function createProductos() {
  const prodRepo = AppDataSource.getRepository(DefinicionProducto);
  const matRepo = AppDataSource.getRepository(MateriaPrima);
  
  const jaiba = await matRepo.findOne({ where: { nombre: "Jaiba" } });
  const pulpo = await matRepo.findOne({ where: { nombre: "Pulpo" } });
  if (!jaiba || !pulpo) {
     console.error("Error Seeding: Materias Primas not found. Skipping Products.");
     return;
  }

  const productosDef = [
    // 1. PRODUCTOS JAIBA PRIMARIOS
    { nombre: "Carne Blanca", tipo: "primario", materiaPrima: jaiba, origen: "Jaiba" },
    { nombre: "Pinza", tipo: "primario", materiaPrima: jaiba, origen: "Jaiba" },

    // 2. PRODUCTOS PULPO PRIMARIOS
    { nombre: "Tentáculo", tipo: "primario", materiaPrima: pulpo, origen: "Pulpo" },
    { nombre: "Pulpo Entero", tipo: "primario", materiaPrima: pulpo, origen: "Pulpo" },

    // JAIBA ELABORADOS
    { 
        nombre: "Pinza Carne de Jaiba Cocida Congelada Super Premium", 
        tipo: "elaborado", materiaPrima: jaiba, origen: "Pinza",
        calibres: ["200 grs", "400 grs", "500 grs", "1000 grs"],
        fichaTecnica: {
            especieCientifica: "Cancer edwarsii",
            ingredientes: "100% carne entera",
            vidaUtil: "Congelado 24 meses",
            almacenamiento: "Mantener entre -18 a -22 ºC",
            ph: "6.7 - 7.3",
            color: "Ámbar",
            textura: "Semi blanda e hidratada"
        }
    },
    { 
        nombre: "Carne de Jaiba Cocida Congelada Premium", 
        tipo: "elaborado", materiaPrima: jaiba, origen: "Carne Blanca",
        calibres: ["200 grs", "400 grs", "500 grs", "1000 grs"],
        fichaTecnica: {
            especieCientifica: "Cancer edwarsii",
            ingredientes: "50% carne entera y 50% carne blanca molida",
            vidaUtil: "Congelado 24 meses",
            almacenamiento: "Mantener entre -18 a -22 ºC",
            ph: "6.7 - 7.3",
            color: "Ámbar",
            textura: "Semi blanda e hidratada"
        }
    },
    { 
        nombre: "Pinza Coctel de Jaiba Cocida Congelada", 
        tipo: "elaborado", materiaPrima: jaiba, origen: "Pinza",
        calibres: ["Chica - 250 grs", "Chica - 500 grs", "Grande - 250 grs", "Grande - 500 grs", "Jumbo - 500 grs"],
        fichaTecnica: {
            especieCientifica: "Cancer edwarsii",
            ingredientes: "Pinzas de Jaiba Coctel en bolsa (uña con su carne)",
            vidaUtil: "Congelado 24 meses",
            almacenamiento: "Mantener entre -18 a -22 ºC",
            ph: "6.7 - 7.3",
            color: "Ámbar",
            textura: "Semi blanda e hidratada"
        }
    },

    // PULPO ELABORADOS
    { 
        nombre: "Carne de Pulpo Cocido Congelado", 
        tipo: "elaborado", materiaPrima: pulpo, origen: "Pulpo Entero",
        calibres: ["300 grs", "500 grs", "1000 grs", "1500 grs"],
        fichaTecnica: {
            especieCientifica: "Octopus vulgaris",
            ingredientes: "Pulpo cocido congelado entero",
            vidaUtil: "Congelado 12 meses",
            almacenamiento: "Mantener entre -18 a -22 ºC",
            ph: "6.7 - 7.3",
            color: "Burdeos o Morado",
            textura: "Semi blanda"
        }
    },
    { 
        nombre: "Carne de Pulpo Cocido Trozo Tentáculo Congelado", 
        tipo: "elaborado", materiaPrima: pulpo, origen: "Tentáculo",
        calibres: ["500 grs", "1000 grs"],
        fichaTecnica: {
            especieCientifica: "Octopus vulgaris – Enteroctopus megalocyathus",
            ingredientes: "Pulpo cocido congelado Trozo Tentáculo",
            vidaUtil: "Congelado 12 meses",
            almacenamiento: "Mantener entre -18 a -22 ºC",
            ph: "6.7 - 7.3",
            color: "Burdeos o Morado",
            textura: "Semi blanda"
        }
    },
    { 
        nombre: "Carne de Pulpo Crudo Congelado", 
        tipo: "elaborado", materiaPrima: pulpo, origen: "Pulpo Entero",
        calibres: ["Peso variable", "500 grs", "1000 grs"],
        fichaTecnica: {
            especieCientifica: "Octopus vulgaris / Enteroctopus megalocyathus",
            ingredientes: "Pulpo crudo congelado",
            vidaUtil: "Congelado 12 meses",
            almacenamiento: "Mantener entre -18 a -22 ºC",
            ph: "6.7 - 7.3",
            color: "Burdeos o Morado",
            textura: "Semi blanda"
        }
    }
  ];

  for (const prodData of productosDef) {
      const existing = await prodRepo.findOne({ where: { nombre: prodData.nombre } });
      if (existing) {
          existing.materiaPrima = prodData.materiaPrima;
          existing.tipo = prodData.tipo;
          existing.origen = prodData.origen || existing.origen;
          existing.calibres = prodData.calibres || existing.calibres;
          existing.fichaTecnica = prodData.fichaTecnica || existing.fichaTecnica;
          await prodRepo.save(existing);
      } else {
          await prodRepo.save(prodRepo.create(prodData));
      }
  }

  console.log("Catálogo creado.");
}

/* ==============================================
   FUNCIÓN PRINCIPAL (Exportada)
   ============================================== */
export async function createInitialData() {
  try {
    await createUsers();
    await createMateriasPrimas(); 
    await createProveedores();
    await createUbicaciones();
    await createProductos();      
    console.log("------------------------------------------");
    console.log(" Base de datos poblada exitosamente");
    console.log("------------------------------------------");
  } catch (error) {
    console.error("Error en setup inicial:", error);
  }
}
 