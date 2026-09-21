#!/bin/bash
# Script de Despliegue para R.V. Inversiones en Ubuntu Server 24.04

echo "Iniciando configuración de servidor R.V. Inversiones..."

# 1. Actualizar sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Docker y Docker Compose
if ! command -v docker &> /dev/null
then
    echo "Instalando Docker..."
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    
    # Agregar usuario al grupo docker
    sudo usermod -aG docker $USER
    echo "Docker instalado."
else
    echo "Docker ya está instalado."
fi

# 3. Levantar servicios con Docker Compose
echo "Construyendo y levantando contenedores..."
cd ..
sudo docker compose -f docker-compose.prod.yml down
sudo docker compose -f docker-compose.prod.yml up -d --build

echo ""
echo "¡Despliegue inicial completado!"
echo "Los contenedores están corriendo. Puedes revisar el estado con: sudo docker compose -f docker-compose.prod.yml ps"
echo ""
echo "=== CONFIGURACIÓN DE ACCESO REMOTO (Tailscale Funnel) ==="
echo "Para exponer el sistema de forma gratuita y segura:"
echo "1. Instala Tailscale: curl -fsSL https://tailscale.com/install.sh | sh"
echo "2. Autentica tu servidor: sudo tailscale up"
echo "3. Activa Funnel para exponer el puerto 80:"
echo "   sudo tailscale serve --bg 80"
echo "   sudo tailscale funnel --bg 80"
echo "4. El sistema te dará una URL (ej: https://tu-maquina.tailscale.net) accesible desde cualquier lugar."
