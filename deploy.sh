#!/bin/bash
# ============================================================
# DEPLOY SCRIPT - KeplerTV para Oracle Linux 9
# IP: 147.224.240.142
# ============================================================
# Ejecutar EN LA VPS después de clonar el repositorio
# ============================================================

set -e

echo "========================================"
echo "  KeplerTV - Deploy Script"
echo "  Oracle Linux 9"
echo "========================================"

# 1. Actualizar sistema
echo "[1/8] Actualizando sistema..."
sudo dnf update -y

# 2. Instalar Node.js 20
echo "[2/8] Instalando Node.js 20..."
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# 3. Instalar Nginx
echo "[3/8] Instalando Nginx..."
sudo dnf install -y nginx

# 4. Instalar dependencias del backend
echo "[4/8] Instalando dependencias del backend..."
cd /home/opc/keplertv/backend
npm install

# 5. Crear archivo .env
echo "[5/8] Creando archivo .env..."
echo "PORT=3000" > .env

# 6. Configurar Nginx
echo "[6/8] Configurando Nginx..."
sudo tee /etc/nginx/conf.d/keplertv.conf > /dev/null << 'NGINX'
server {
    listen 80;
    server_name 147.224.240.142;

    # Frontend (index.html)
    root /home/opc/keplertv;
    index index.html;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;
    gzip_min_length 1000;

    # API - proxy al backend Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts largos para streaming de video HLS
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
        proxy_buffering off;
    }

    # Archivos estáticos
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=3600";
    }
}
NGINX

# Deshabilitar configuración por defecto de nginx
sudo rm -f /etc/nginx/conf.d/default.conf

# 7. Configurar firewall
echo "[7/8] Configurando firewall..."
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload

# 8. Instalar PM2 e iniciar backend
echo "[8/8] Instalando PM2 e iniciando backend..."
sudo npm install -g pm2

cd /home/opc/keplertv/backend
pm2 start server.js --name keplertv-backend
pm2 startup
pm2 save

# Iniciar Nginx
sudo systemctl enable nginx
sudo systemctl start nginx

echo ""
echo "========================================"
echo "  ✅ DEPLOY COMPLETADO"
echo "========================================"
echo ""
echo "  Abre en tu navegador:"
echo "  http://147.224.240.142"
echo ""
echo "  Comandos útiles:"
echo "  - Ver logs:       pm2 logs keplertv-backend"
echo "  - Ver estado:     pm2 status"
echo "  - Reiniciar:      pm2 restart keplertv-backend"
echo "  - Actualizar:     cd /home/opc/keplertv && git pull && cd backend && npm install && pm2 restart keplertv-backend"
echo "========================================"
