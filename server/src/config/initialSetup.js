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
   5. PRODUCTOS (Definiciones y Calibres)
   ============================================== */
/* ==============================================
   5. PRODUCTOS (Ordenado: Primarios -> Elaborados)
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
    // 1. PRODUCTOS PRIMARIOS (Salen directo de la Jaiba)
    //    Estos son los que suman al % de Rendimiento.
    // =====================================================

    // A. Del Cuerpo
    prodRepo.create({ 
        nombre: "Carne Blanca", 
        tipo: "primario", 
        materiaPrima: jaiba, 
        calibres: null // Es carne molida/desmenuzada, no tiene calibre
    }),

    // B. De las Pinzas (Con Cáscara)
    prodRepo.create({ 
        nombre: "Tres segmentos", 
        tipo: "primario", 
        materiaPrima: jaiba, 
        calibres: ["Grande", "Mediano"] 
    }),

    // C. Del Desconche (Sin Cáscara - Relleno)
    prodRepo.create({ 
        nombre: "Carne Codo y Brazo", 
        tipo: "primario", 
        materiaPrima: jaiba, 
        calibres: null // Se usa para rellenar moldes o decorar
    }),

    // D. Del Desconche (Sin Cáscara - Pinzas Enteras)
    prodRepo.create({ 
        nombre: "Pinza Coctel", 
        tipo: "primario", 
        materiaPrima: jaiba, 
        calibres: ["Chica", "Grande"] 
    }),
    prodRepo.create({ 
        nombre: "Pinza Yumbo", // La calidad más alta
        tipo: "primario", 
        materiaPrima: jaiba, 
        calibres: ["Standard"] 
    }),


    // =====================================================
    // 2. PRODUCTOS ELABORADOS (Mezclas y Envasados)
    //    Estos NO suman al rendimiento (ya se contó la carne antes).
    // =====================================================

    // Moldes (Mezcla de Carne Blanca + Codo/Brazo)
    prodRepo.create({ 
        nombre: "Molde Jaiba", 
        tipo: "elaborado", 
        materiaPrima: jaiba, 
        // Usamos los 'calibres' para definir los formatos de venta
        calibres: ["1 Kg", "500 grs", "250 grs"] 
    }),
  ]);
  console.log("=> Productos definidos creados (Estructura Correcta).");
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