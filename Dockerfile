# ===== DOCKERFILE PARA RAILWAY =====
# Solo despliega el backend (Express) - ignora la app Expo/React Native
FROM node:20-alpine

WORKDIR /app

# Copiar SOLO el package.json del backend
COPY backend/package*.json ./

# Instalar dependencias del backend (express, axios, dotenv, etc.)
RUN npm ci

# Copiar el backend completo
COPY backend/ ./backend/

# Copiar el frontend (index.html)
COPY index.html ./

EXPOSE 3000

ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "backend/server.js"]
