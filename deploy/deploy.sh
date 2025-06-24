#!/bin/bash

# === Настройки ===
APP_NAME="jewelryshop"
PROJECT_DIR="/var/www/jewelryshop"
BACKUP_DIR="/var/backups/jewelryshop"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
DB_NAME="your_db_name"   # <-- Укажите имя вашей БД

# === 1. Остановить приложение ===
pm2 stop $APP_NAME

# === 2. Обновить код ===
cd $PROJECT_DIR
git pull

# === 3. Установить зависимости ===
npm install --prefix server

# === 4. Бэкап файлов ===
mkdir -p "$BACKUP_DIR"
tar czf "$BACKUP_DIR/files_backup_$DATE.tar.gz" \
    "$PROJECT_DIR/client/images" \
    "$PROJECT_DIR/client/public" \
    "$PROJECT_DIR/server/templates" \
    "$PROJECT_DIR/server/views" \
    "$PROJECT_DIR/server/modules" \
    "$PROJECT_DIR/server/routes"

# === 5. Бэкап MongoDB ===
mongodump --db "$DB_NAME" --out "$BACKUP_DIR/mongodump_$DATE"

# === 6. Перезапустить приложение ===
pm2 start server/server.js --name $APP_NAME

# === 7. Сохранить состояние PM2 ===
pm2 save

echo "Deploy и бэкап завершены!" 