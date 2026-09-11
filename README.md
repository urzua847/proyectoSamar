# Proyecto SAMAR - ERP de Trazabilidad e Inventario

Sistema ERP para la gestión, trazabilidad e inventario de plantas de procesamiento de salmones.

---

## Tabla de Contenidos

- [Requisitos Previos](#-requisitos-previos)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Stack Tecnológico](#-stack-tecnológico)
- [Despliegue Rápido con Docker](#-despliegue-rápido-con-docker)
  - [1. Clonar el Repositorio](#1-clonar-el-repositorio)
  - [2. Configurar Variables de Entorno](#2-configurar-variables-de-entorno)
  - [3. Levantar los Contenedores](#3-levantar-los-contenedores)
  - [4. Verificar el Estado](#4-verificar-el-estado)
- [Puertos y Accesos](#-puertos-y-accesos)
- [Comandos Utiles de Docker](#️-comandos-útiles-de-docker)
- [Solución de Problemas Frecuentes](#-solución-de-problemas-frecuentes)

---

## Requisitos Previos

Para ejecutar este proyecto en cualquier sistema operativo (**Windows, macOS o Linux**), solo necesitas tener instaladas las siguientes herramientas:

1. **Git**: [Descargar Git](https://git-scm.com/)
2. **Docker Desktop** (en Windows/macOS) o **Docker Engine + Docker Compose** (en Linux):
   - [Instalar Docker Desktop para Windows](https://docs.docker.com/desktop/install/windows-install/)
   - [Instalar Docker Desktop para Mac](https://docs.docker.com/desktop/install/mac-install/)
   - [Instalar Docker en Linux](https://docs.docker.com/engine/install/)

> **Nota para Windows**: Asegúrate de tener habilitado **WSL 2** (Windows Subsystem for Linux) y que Docker Desktop esté en ejecución antes de ejecutar los comandos.

---

## Estructura del Proyecto

```text
proyectoSamar/
├── client/                # Aplicación Frontend (React + Vite)
│   ├── src/               # Código fuente del cliente
│   ├── Dockerfile         # Configuración Docker para Frontend
│   └── package.json
├── server/                # Aplicación Backend (Node.js + Express + TypeORM)
│   ├── src/               # API, controladores, servicios y modelos
│   ├── Dockerfile         # Configuración Docker para Backend
│   └── package.json
├── .env.example           # Plantilla de variables de entorno
├── docker-compose.yml     # Orquestador de servicios (DB, Backend, Frontend)
└── README.md              # Documentación principal del proyecto
```

---

## Stack Tecnológico

| Componente | Tecnología |
| :--- | :--- |
| **Frontend** | React 19, Vite, React Router 7, Axios, SweetAlert2, Tabulator |
| **Backend** | Node.js (v20+), Express 5, TypeORM 0.3, Passport.js (JWT), Joi |
| **Base de Datos** | PostgreSQL 15 |
| **Infraestructura** | Docker & Docker Compose |

---

## Despliegue Rápido con Docker

Sigue estos 3 pasos simples para ejecutar todo el sistema desde cero en cualquier equipo:

### 1. Clonar el Repositorio

Abre una terminal (PowerShell, Command Prompt o Bash) y ejecuta:

```bash
git clone <URL_DEL_REPOSITORIO>
cd proyectoSamar
```

### 2. Configurar Variables de Entorno

Copia el archivo de ejemplo `.env.example` para crear el archivo `.env` en la raíz del proyecto:

**En Linux / macOS / Bash:**
```bash
cp .env.example .env
```

**En Windows (PowerShell):**
```powershell
copy .env.example .env
```

**En Windows (CMD):**
```cmd
copy .env.example .env
```

> **Configuración del `.env`**:
> Puedes abrir el archivo `.env` recién creado con un editor de texto y ajustar los valores de ser necesario. Los valores por defecto funcionan directamente para entornos de desarrollo con Docker.
> 
> ```env
> # Base de Datos
> DB_HOST=samar_db     
> DB_USERNAME=postgres
> DATABASE=samar_db
> PASSWORD=tu_password_seguro_aqui
> 
> # Claves de Seguridad
> ACCESS_TOKEN_SECRET=cambiar_por_clave_segura_minimo_32_caracteres
> cookieKey=cambiar_por_otra_clave_segura_minimo_32_caracteres
> ```

### 3. Levantar los Contenedores

Ejecuta el siguiente comando en la raíz del proyecto para construir las imágenes y levantar todos los servicios automáticamente:

```bash
docker compose up --build
```

*(Si utilizas una versión más antigua de Docker Compose, puedes usar `docker-compose up --build`)*

Este proceso realizará lo siguiente de forma totalmente automatizada:
1. Descargará e iniciará la base de datos **PostgreSQL 15**.
2. Construirá y ejecutará la API Backend en **Node.js**.
3. Construirá y ejecutará la aplicación Frontend en **React / Vite**.
4. Sincronizará la base de datos mediante TypeORM una vez que el servicio de base de datos esté listo.

Para ejecutar los contenedores en segundo plano (modo desatendido / detached), agrega la bandera `-d`:

```bash
docker compose up -d --build
```

---

## Puertos y Accesos

Una vez iniciados los servicios, la aplicación estará disponible en las siguientes direcciones:

| Servicio | URL / Dirección | Descripción |
| :--- | :--- | :--- |
| **Frontend (React)** | [http://localhost:5173](http://localhost:5173) | Interfaz web del sistema ERP |
| **Backend (API)** | [http://localhost:5000/api](http://localhost:5000/api) | API REST del servidor |
| **Base de Datos** | `samar_db:5432` *(Interno)* | PostgreSQL (accesible desde el backend) |

---

## Comandos Útiles de Docker

- **Ver el estado de los contenedores en ejecución:**
  ```bash
  docker compose ps
  ```

- **Ver los logs de todos los servicios en tiempo real:**
  ```bash
  docker compose logs -f
  ```

- **Ver los logs de un servicio específico (ej: backend o frontend):**
  ```bash
  docker compose logs -f server
  docker compose logs -f client
  docker compose logs -f db
  ```

- **Detener la aplicación:**
  ```bash
  docker compose down
  ```

- **Detener y eliminar volúmenes (Reiniciar la base de datos desde cero):**
  ```bash
  docker compose down -v
  ```

- **Reconstruir los contenedores tras realizar cambios en las dependencias (`package.json`):**
  ```bash
  docker compose up --build
  ```

---

## Solución de Problemas Frecuentes

### 1. El puerto 5173 o 5000 ya está ocupado
Si obtienes un error del tipo `port is already allocated`:
- Revisa qué proceso está ocupando el puerto en tu equipo local.
- O bien, edita la sección `ports` en `docker-compose.yml` para mapear a otro puerto externo (ejemplo: `"5001:3000"` o `"5174:5173"`).

### 2. Error de conexión con la base de datos (`Connection refused`)
- Docker Compose incluye un *healthcheck* en el servicio de PostgreSQL que asegura que el Backend no inicie hasta que la BD acepte conexiones.
- Si ves reintentos, espera unos segundos. Si persiste, verifica los logs con:
  ```bash
  docker compose logs db
  ```

### 3. Reiniciar la base de datos si hay inconsistencias de datos
Si necesitas limpiar la base de datos y recrear los esquemas desde cero:
```bash
docker compose down -v
docker compose up --build
```
