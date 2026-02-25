# Backend - ProyectoSamar

API REST para sistema ERP de trazabilidad e inventario para plantas de procesamiento de salmones.

## Stack Tecnológico

- **Runtime**: Node.js v22+
- **Framework**: Express 5
- **ORM**: TypeORM 0.3
- **Base de Datos**: PostgreSQL 15
- **Autenticación**: JWT + Passport.js
- **Validación**: Joi

---

## Estructura del Proyecto

server/
├── src/
│   ├── auth/              # Configuración de autenticación (Passport JWT)
│   ├── config/            # Configuración de BD y variables de entorno
│   │   ├── configDb.js    # Configuración TypeORM con soporte entornos
│   │   └── configEnv.js   # Carga de variables .env
│   ├── controllers/       # Controladores de endpoints
│   ├── entity/            # Entidades de TypeORM (modelos)
│   ├── handlers/          # Manejadores de respuestas HTTP
│   ├── middlewares/       # Middleware de autenticación
│   ├── routes/            # Definición de rutas de API
│   ├── services/          # Lógica de negocio
│   │   ├── *.service.js   # Ahora con transacciones ACID
│   └── validations/       # Esquemas de validación Joi
├── index.js               # Punto de entrada
└── package.json


---

## Inicio Rápido

### 1. Variables de Entorno

Copia el archivo de ejemplo y configúralo:


cp .env.example .env
nano .env  # O tu editor favorito
```

**Variables obligatorias**:
```env
NODE_ENV=development
DB_USERNAME=postgres
PASSWORD=tu_password
DATABASE=samar_dev
ACCESS_TOKEN_SECRET=clave_generada_con_openssl
cookieKey=otra_clave_diferente
```

### 2. Instalación de Dependencias

```bash
npm install
```

### 3. Ejecutar en Desarrollo

```bash
npm run dev  # Con nodemon (recarga automática)
# o
npm start    # Sin recarga automática
```

El servidor estará disponible en `http://localhost:3000/api`

---

## Docker

### Desarrollo con Docker Compose

```bash
# Desde la raíz del proyecto (no desde /server)
docker-compose up --build
```

Esto levanta:
- PostgreSQL en `samar_db:5432`
- Backend en `samar_backend:5000`
- Frontend en `samar_frontend:5173`


## Características Implementadas

### Transacciones ACID

Los siguientes servicios usan `QueryRunner` para garantizar atomicidad:

- `produccion.service.js` → `createProduccionYieldService()`
- `envasado.service.js` → `createProduccionService()`
- `loteRecepcion.service.js` → `deleteLoteService()`
- `traslado.service.js` → `trasladoStockService()`
- `pedido.service.js` → `createPedidoService()`

Si alguna operación falla, **TODAS** se revierten automáticamente.

### Paginación Server-Side

Endpoints con soporte de paginación:

```bash
GET /api/envasado/producciones?page=1&limit=50
GET /api/lote/activos?page=1&limit=30
GET /api/pedido?page=1&limit=25


### Error: "Cannot find package 'cors'"

```bash
cd server
npm install
```

### Error: "Connection refused" al iniciar

Verifica que PostgreSQL esté corriendo:

```bash
# Con Docker
docker ps | grep samar_db

# Local
sudo systemctl status postgresql
```

### Error: "synchronize:true in production"

Esto es intencional. Cambia `NODE_ENV=production` en tu `.env` y **lee la guía de migraciones**.

---

## Scripts Disponibles

```bash
npm start          # Inicia servidor en modo producción
npm run dev        # Inicia con nodemon (desarrollo)
npm audit          # Verifica vulnerabilidades
npm audit fix      # Intenta corregir vulnerabilidades automáticamente
```

---

## Contribución

1. Crea una rama feature: `git checkout -b feature/nueva-funcionalidad`
2. Commit con mensajes descriptivos
3. Push y crea Pull Request
4. Asegúrate que el código pase las validaciones de seguridad

---

## Licencia

Este proyecto es parte de una tesis universitaria.

---

## Soporte

Para problemas de configuración o preguntas, revisa primero:
1. Esta documentación
2. `MIGRATIONS_GUIDE.md`
3. Los logs del servidor (`docker logs samar_backend`)
