FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Puerto común de Vite (5173) o React Scripts (3000). Ajusta según uses.
EXPOSE 5173

# Necesario para que Vite escuche fuera del contenedor
ENV HOST=0.0.0.0 

CMD ["npm", "run", "dev"]