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
async function createProductos() {
  const prodRepo = AppDataSource.getRepository(DefinicionProducto);
  const matRepo = AppDataSource.getRepository(MateriaPrima);
  
  const count = await prodRepo.count();
  if (count > 0) return;

  const jaiba = await matRepo.findOne({ where: { nombre: "Jaiba" } });
  if (!jaiba) return;

await prodRepo.save([
    prodRepo.create({ 
        nombre: "Carne Blanca", 
        tipo: "primario", 
        materiaPrima: jaiba, 
        calibres: ["Primera", "Segunda"] 
    }),
    prodRepo.create({ 
        nombre: "Tres segmentos", 
        tipo: "primario", 
        materiaPrima: jaiba, 
        calibres: ["Grande", "Mediano"] 
    }),
    prodRepo.create({ 
        nombre: "Carne Pinza Chica", 
        tipo: "primario", 
        materiaPrima: jaiba, 
        calibres: null 
    }),
    prodRepo.create({ 
        nombre: "Pinza para Decorar", 
        tipo: "primario", 
        materiaPrima: jaiba, 
        calibres: null 
    }),

    prodRepo.create({ 
        nombre: "Pote Carne Jaiba 1kg", 
        tipo: "elaborado", 
        materiaPrima: jaiba, 
        calibres: null 
    }),
     prodRepo.create({ 
        nombre: "Pote Carne Jaiba 500g", 
        tipo: "elaborado", 
        materiaPrima: jaiba, 
        calibres: null 
    }),
  ]);
  console.log("Productos definidos creados.");
}

/* ==============================================
   6. LOTES DE RECEPCIÓN (Stock Inicial MP)
   ============================================== */
import LoteRecepcion from "../entity/loteRecepcion.entity.js";

async function createLotesRecepcion() {
    const repo = AppDataSource.getRepository(LoteRecepcion);
    const count = await repo.count();
    if (count > 0) return;

    const proveedor = await AppDataSource.getRepository(Proveedor).findOne({ where: { nombre: "Pedro Vidal" } });
    const materiaPrima = await AppDataSource.getRepository(MateriaPrima).findOne({ where: { nombre: "Jaiba" } });
    const operario = await AppDataSource.getRepository(User).findOne({ where: { rol: "operario" } });

    if (!proveedor || !materiaPrima || !operario) return;

    await repo.save([
        repo.create({
            codigo: "LOTE-001",
            peso_bruto_kg: 100.00,
            peso_actual: 100.00,
            numero_bandejas: 10,
            proveedor,
            materiaPrima,
            operario,
            detalle_pesadas: [
                { cajas: 5, kilos: 50 },
                { cajas: 5, kilos: 50 }
            ]
        })
    ]);
    console.log("Lotes de Recepción creados.");
}

/* ==============================================
   7. PRODUCCIÓN (Stock Inicial PT)
   ============================================== */
import ProductoTerminado from "../entity/productoTerminado.entity.js";

async function createProduccion() {
    const repo = AppDataSource.getRepository(ProductoTerminado);
    const count = await repo.count();
    if (count > 0) return;

    const lote = await AppDataSource.getRepository(LoteRecepcion).findOne({ where: { codigo: "LOTE-001" } });
    const definicion = await AppDataSource.getRepository(DefinicionProducto).findOne({ where: { nombre: "Carne Blanca" } });
    const ubicacion = await AppDataSource.getRepository(Ubicacion).findOne({ where: { nombre: "Cámara 1" } });

    if (!lote || !definicion || !ubicacion) return;

    // Crear 5 productos
    const productos = [];
    for (let i = 0; i < 5; i++) {
        productos.push(repo.create({
            peso_neto_kg: 1.0,
            peso_actual: 1.0, // Inicializamos peso_actual
            calibre: "Primera",
            loteDeOrigen: lote,
            definicion: definicion,
            ubicacion: ubicacion,
            estado: "En Stock"
        }));
    }
    
    // Descontar del lote (simulado)
    lote.peso_actual -= 5.0;
    await AppDataSource.getRepository(LoteRecepcion).save(lote);

    await repo.save(productos);
    console.log("Producción inicial creada.");
}

/* ==============================================
   8. VENTAS (Venta Inicial)
   ============================================== */
import Venta from "../entity/venta.entity.js";
import DetalleVenta from "../entity/detalleVenta.entity.js";

async function createVentas() {
    const ventaRepo = AppDataSource.getRepository(Venta);
    const count = await ventaRepo.count();
    if (count > 0) return;

    const productoRepo = AppDataSource.getRepository(ProductoTerminado);
    // Buscar un producto para vender
    const producto = await productoRepo.findOne({ where: { estado: "En Stock" } });
    
    if (!producto) return;

    // Actualizar estado y peso
    producto.estado = "Vendido";
    producto.peso_actual = 0;
    await productoRepo.save(producto);

    const venta = ventaRepo.create({
        cliente: "Cliente Inicial",
        total: 15000,
        detalles: [
            {
                precio_unitario: 15000,
                peso: 1.0, // Agregamos el peso vendido
                producto: producto
            }
        ]
    });

    await ventaRepo.save(venta);
    console.log("Venta inicial creada.");
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
    await createLotesRecepcion();
    await createProduccion();
    await createVentas();      
    console.log("------------------------------------------");
    console.log(" Base de datos poblada exitosamente");
    console.log("------------------------------------------");
  } catch (error) {
    console.error("Error en setup inicial:", error);
  }
}