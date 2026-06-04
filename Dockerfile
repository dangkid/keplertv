# ===== DOCKERFILE PARA FLY.IO =====
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar package.json y package-lock.json
COPY package*.json ./

# Instalar dependencias
RUN npm ci --only=production

# Copiar todo el proyecto
COPY . .

# Puerto (Fly.io asigna dinámicamente, pero escuchamos en 3000)
EXPOSE 3000

# Variable de entorno
ENV NODE_ENV=production
ENV PORT=3000

# Comando para iniciar
CMD ["node", "backend/server.js"]
