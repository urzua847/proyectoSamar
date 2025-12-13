"use strict";

import User from "../entity/user.entity.js";
import Proveedor from "../entity/proveedor.entity.js";
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
  const count = await repo.count();
  if (count > 0) return;

  await repo.save([
    repo.create({ nombre: "Jaiba" }),
    repo.create({ nombre: "Pulpo" }),
    repo.create({ nombre: "Almeja" }),
  ]);
  console.log("Materias Primas creadas.");
}

/* ==============================================
   3. PROVEEDORES (Datos reales de la pizarra)
   ============================================== */
async function createProveedores() {
  const repo = AppDataSource.getRepository(Proveedor);
  const count = await repo.count();
  if (count > 0) return;

  await repo.save([
    repo.create({ nombre: "Pedro Vidal", rut: "12345678-9" }),
    repo.create({ nombre: "Don Isau", rut: "98765432-1" }),
    repo.create({ nombre: "Julio Gallardo", rut: "11223344-5" }),
    repo.create({ nombre: "Comercial Samar", rut: "55667788-9" }),
  ]);
  console.log("Proveedores creados.");
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
  
  const count = await prodRepo.count();
  if (count > 0) return;

  const jaiba = await matRepo.findOne({ where: { nombre: "Jaiba" } });
  if (!jaiba) return;

  await prodRepo.save([
    // =====================================================
    // 1. PRODUCTOS PRIMARIOS (TABLA 1 - DESCONCHE)
    //    Solo lo básico para calcular rendimiento.
    // =====================================================
    { 
        nombre: "Carne Blanca", 
        tipo: "primario", 
        materiaPrima: jaiba, 
        calibres: null 
    },
    { 
        nombre: "Pinzas", // Pinza entera cocida (antes de clasificar)
        tipo: "primario", 
        materiaPrima: jaiba, 
        calibres: null 
    },

    // =====================================================
    // 2. PRODUCTOS ELABORADOS (TABLA 2 - A CÁMARA)
    //    Clasificados y Envasados
    // =====================================================

    // A. Tres Segmentos (Directo a congelar)
    { 
        nombre: "Tres Segmentos", 
        tipo: "elaborado", 
        materiaPrima: jaiba, 
        calibres: ["250 grs", "500 grs", "1000 grs"] 
    },

    // B. Pinza Coctel (Desconchada) - Combinamos Tamaño y Peso
    { 
        nombre: "Pinza Coctel", 
        tipo: "elaborado", 
        materiaPrima: jaiba, 
        calibres: [
            "Chica - 250 grs", 
            "Chica - 500 grs", 
            "Grande - 250 grs", 
            "Grande - 500 grs"
        ] 
    },

    // C. Pinza Jumbo (Alta Calidad) - Combinamos Tamaño y Peso
    { 
        nombre: "Pinza Jumbo", 
        tipo: "elaborado", 
        materiaPrima: jaiba, 
        calibres: [
            "Chica - 250 grs", 
            "Chica - 500 grs", 
            "Grande - 250 grs", 
            "Grande - 500 grs"
        ] 
    },

    // D. Molde Jaiba (Carne Blanca + Carne Codo para decoración)
    { 
        nombre: "Molde Jaiba", 
        tipo: "elaborado", 
        materiaPrima: jaiba, 
        calibres: ["250 grs", "500 grs", "1000 grs"] 
    }
  ]);
  console.log("=> Catálogo actualizado: Flujo Jaiba Real.");
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
