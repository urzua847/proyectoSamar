#!/bin/bash
# Script de Respaldo Diario para BD R.V. Inversiones

# Directorio donde se guardarán los respaldos
BACKUP_DIR="/var/backups/samar_db"
mkdir -p "$BACKUP_DIR"

# Nombre del archivo con fecha
DATE=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/backup_rv_inversiones_$DATE.sql.gz"

echo "Iniciando respaldo de base de datos..."

# Ejecutar pg_dump dentro del contenedor de docker
# samar_db es el nombre del contenedor en docker-compose.prod.yml
sudo docker exec samar_db pg_dump -U postgres rv_inversiones | gzip > "$FILENAME"

echo "Respaldo guardado en: $FILENAME"

# Eliminar respaldos más antiguos que 30 días para ahorrar espacio
find "$BACKUP_DIR" -type f -name "*.sql.gz" -mtime +30 -exec rm {} \;

echo "Limpieza de respaldos antiguos completada."

# NOTA PARA CRONTAB:
# Para automatizar esto todos los días a las 3:00 AM, ejecuta "crontab -e" y añade la siguiente línea:
# 0 3 * * * /ruta/absoluta/al/proyectoSamar/scripts/backup.sh >> /var/log/samar_backup.log 2>&1
