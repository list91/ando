# Docker Compose - Quick Start

## Структура

```
docker-compose.yml           # Базовая конфигурация (общая)
docker-compose.override.yml  # Development (автоматически)
docker-compose.prod.yml      # Production (явно)
```

---

## Development (локалка)

```bash
# Первый запуск
cp .env.example .env
nano .env  # Установить пароли и ключи
docker-compose up -d

# Логи
docker-compose logs -f frontend

# Остановка
docker-compose down
```

**Доступ:**
- Frontend dev: http://localhost:5173
- Supabase Studio: http://localhost:3000
- Kong API: http://localhost:8000
- PostgreSQL: localhost:5432

---

## Production

```bash
# Первый запуск
cp .env.example .env.production
nano .env.production  # Настроить продакшн переменные
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d

# Логи
docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f

# Остановка
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down
```

**Доступ:**
- Frontend: http://your-server-ip
- Studio (с auth): http://your-server-ip:8080
- БД: только внутри Docker network

---

## Полезные команды

```bash
# Просмотр конфигурации
docker-compose config

# Пересборка после изменений
docker-compose up -d --build frontend

# Удаление с volumes (ОСТОРОЖНО!)
docker-compose down -v

# Проверка статуса
docker-compose ps

# Выполнить команду в контейнере
docker-compose exec frontend sh
docker-compose exec db psql -U postgres
```

---

## Генерация секретов для production

```bash
# JWT_SECRET
openssl rand -base64 32

# POSTGRES_PASSWORD
openssl rand -base64 48 | tr -d '/+=' | head -c 64
```

---

## Переменные окружения (.env)

### Обязательные

```env
# Database
POSTGRES_PASSWORD=xxx
JWT_SECRET=xxx
ANON_KEY=xxx
SERVICE_ROLE_KEY=xxx

# URLs
VITE_SUPABASE_URL=http://localhost:8000
SUPABASE_PUBLIC_URL=http://localhost:8000
API_EXTERNAL_URL=http://localhost:8000
SITE_URL=http://localhost:3000
```

### Development

```env
FRONTEND_BUILD_TARGET=development
DB_DATA_PATH=./docker/volumes/db-local
STORAGE_DATA_PATH=./docker/volumes/storage-local
```

### Production

```env
FRONTEND_BUILD_TARGET=production
DB_DATA_PATH=/opt/ando/docker/volumes/db
STORAGE_DATA_PATH=/opt/ando/docker/volumes/storage

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=xxx
```

---

## Troubleshooting

### Порты заняты

```bash
# Изменить порт в docker-compose.override.yml
frontend:
  ports:
    - "5174:5173"  # Внешний порт 5174
```

### БД не запускается

```bash
# Создать volume directory
mkdir -p docker/volumes/db-local
chmod -R 777 docker/volumes/db-local
```

### Frontend не билдится

```bash
# Очистить и пересобрать
docker-compose down
docker-compose build --no-cache frontend
docker-compose up -d
```

---

Подробная документация: [DOCKER-COMPOSE-GUIDE.md](DOCKER-COMPOSE-GUIDE.md)
