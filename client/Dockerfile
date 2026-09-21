# Etapa de construcción (Build)
FROM node:20-alpine AS build

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci

# Copiar el código fuente y construir
COPY . .
RUN npm run build

# Etapa de Producción (Nginx)
FROM nginx:alpine

# Copiar los estáticos compilados desde la etapa anterior a Nginx
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]