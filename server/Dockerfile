FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# Instalamos dependencias (incluyendo morgan por si acaso no estaba en el package.json)
RUN npm install && npm install morgan

COPY . .

# Usamos puerto 5000 según tu configuración
EXPOSE 5000

CMD ["npm", "run", "dev"]