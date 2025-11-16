# ============================================
# Stage 1: Build del cliente (React + Vite)
# ============================================
FROM node:20-alpine AS builder

WORKDIR /app/client

COPY client/package.json client/package-lock.json ./

RUN npm install
COPY client/ ./
RUN npm run build

# ============================================
# Stage 2: Imagen de producción (servidor Node)
# ============================================
FROM node:20-alpine AS production

WORKDIR /app/server

# Instalar dependencias de servidor
COPY server/package.json server/package-lock.json ./
RUN npm install --production

# Copiar código del servidor
COPY server/ ./

# Copiar build del cliente (para servir estáticamente si aplica)
COPY --from=builder /app/client/dist ./public/

# Exponer puerto
EXPOSE 5000

# Health check (opcional, útil para que Docker sepa si la app está viva)
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api', (r) => {if (r.statusCode !== 404) throw new Error(r.statusCode)})" || exit 1

# Comando para iniciar la aplicación
CMD ["node", "src/index.js"]