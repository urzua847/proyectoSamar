FROM node:20-alpine

WORKDIR /app

# Instalar dependencias de producción y compilación si es necesario
COPY package*.json ./
RUN npm ci --only=production

# Copiar el resto del código
COPY . .

# Exponer el puerto
EXPOSE 5000

# Iniciar la API
CMD ["npm", "start"]