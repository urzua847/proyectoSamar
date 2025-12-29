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
      rut: "11111111-1",
      email: "admin@correo.com",
      password: await encryptPassword("admin123"),
      rol: "administrador",
    })),
    userRepository.save(userRepository.create({
      nombreCompleto: "Operario",
      rut: "22222222-2",
      email: "operario@correo.com",
      password: await encryptPassword("123456"),
      rol: "operario",
    })),
  ]);
  console.log("Usuarios iniciales creados.");
}

/* ==============================================
   2. MATERIAS PRIMAS (Jaiba, etc.)
   ============================================== */
async function createMateriasPrimas() {
  const repo = AppDataSource.getRepository(MateriaPrima);
  
  const mps = [
      { nombre: "Jaiba" },
      { nombre: "Pulpo" },
      { nombre: "Almeja" }
  ];

  for (const mpData of mps) {
      const exists = await repo.findOne({ where: { nombre: mpData.nombre } });
      if (!exists) {
          await repo.save(repo.create(mpData));
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
  if (count > 0) return;

  await repo.save([
    repo.create({ nombre: "Cámara 1", tipo: "camara" }),
    repo.create({ nombre: "Cámara 2", tipo: "camara" }),
    repo.create({ nombre: "Cámara 3", tipo: "camara" }),
    repo.create({ nombre: "Contenedor 1", tipo: "contenedor" }),
    repo.create({ nombre: "Contenedor 2", tipo: "contenedor" }),
  ]);
  console.log("Ubicaciones creadas.");
}

/* ==============================================
   5. PRODUCTOS (Flujo Real: Primarios vs Elaborados)
   ============================================== */
async function createProductos() {
  const prodRepo = AppDataSource.getRepository(DefinicionProducto);
  const matRepo = AppDataSource.getRepository(MateriaPrima);
  
  const jaiba = await matRepo.findOne({ where: { nombre: "Jaiba" } });
  if (!jaiba) {
     console.error("Error Seeding: Materia Prima 'Jaiba' not found. Skipping Products.");
     return;
  }

  const productosDef = [
    // 1. PRODUCTOS PRIMARIOS
    { 
        nombre: "Carne Blanca", 
        tipo: "primario", 
        materiaPrima: jaiba, 
        calibres: null 
    },
    { 
        nombre: "Pinza",
        tipo: "primario", 
        materiaPrima: jaiba, 
        calibres: null 
    },

    // A. Tres Segmentos (Directo a congelar)
    { 
        nombre: "Tres Segmentos", 
        tipo: "elaborado", 
        materiaPrima: jaiba, 
        calibres: ["250 grs", "500 grs", "1000 grs"],
        origen: "Pinza" 
    },

    // B. Pinza Coctel (Desconchada) - Combinamos Tamaño y Peso
    { 
        nombre: "Pinza Coctel", 
        tipo: "elaborado", 
        materiaPrima: jaiba, 
        calibres: ["Chica - 250 grs", "Chica - 500 grs", "Grande - 250 grs", "Grande - 500 grs"],
        origen: "Pinza" 
    },

    // C. Pinza Jumbo (Alta Calidad) - Combinamos Tamaño y Peso
    { 
        nombre: "Pinza Jumbo", 
        tipo: "elaborado", 
        materiaPrima: jaiba, 
        calibres: ["Chica - 250 grs", "Chica - 500 grs", "Grande - 250 grs", "Grande - 500 grs"],
        origen: "Pinza"
    },

    // D. Molde Jaiba (Carne Blanca + Carne Codo para decoración)
    { 
        nombre: "Molde Jaiba", 
        tipo: "elaborado", 
        materiaPrima: jaiba, 
        calibres: ["250 grs", "500 grs", "1000 grs"],
        origen: "Carne Blanca"
    }
  ];

  for (const prodData of productosDef) {
      const existing = await prodRepo.findOne({ where: { nombre: prodData.nombre } });
      if (existing) {
          existing.materiaPrima = jaiba;
          existing.tipo = prodData.tipo;
          existing.origen = prodData.origen || existing.origen;
          existing.calibres = prodData.calibres || existing.calibres;
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
