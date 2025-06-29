#pm2 настроен как сервис — чтобы процессы автоматически запускались после перезагрузки, 
#нужно один раз выполнить команду    pm2 startup
# Скрипт для автоматического деплоя и бэкапа проекта:
# 1. Останавливает приложение (pm2)
# 2. Обновляет код из git (git pull)
# 3. Устанавливает зависимости
# 4. Делает бэкап файлов и базы данных
# 5. Перезапускает приложение и сохраняет процессы pm2
# 6. Перезагружает nginx
# Бэкапы сохраняются в /var/backups/jewelryshop
# Для автозапуска приложения после перезагрузки сервера нужно один раз выполнить pm2 startup

# === Настройки ===
APP_NAME="jewelryshop"
PROJECT_DIR="/home/deploy/JewelryShop"
BACKUP_DIR="/var/backups/jewelryshop"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")
DB_NAME="jewelryshop"  

# остановка скрипта при ошибке
set -e

# Подгружаем переменные окружения
set -a
source /home/deploy/JewelryShop/server/.env
set +a

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

# === 5. Бэкап MariaDB ===
mysqldump -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" > "$BACKUP_DIR/mariadb_backup_$DATE.sql"

# === 6. Перезапустить приложение ===
pm2 start server/server.js --name $APP_NAME

# === 7. Сохранить состояние PM2 ===
pm2 save

echo "Deploy и бэкап завершены!"

sudo systemctl reload nginx 