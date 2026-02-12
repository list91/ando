# Docker Compose Configuration Guide

## Структура файлов

Проект использует **best practice** подход с разделением конфигурации на 3 файла:

```
ando/
├── docker-compose.yml           # Базовая конфигурация (общая для всех окружений)
├── docker-compose.override.yml  # Автоматические настройки для LOCAL разработки
├── docker-compose.prod.yml      # Явные настройки для PRODUCTION
├── .env.example                 # Шаблон переменных окружения
├── .env                         # Локальные переменные (НЕ коммитить!)
└── .env.production              # Production переменные (НЕ коммитить!)
```

---

## Как это работает

### 1. **docker-compose.yml** (база)

**Назначение:** Общая конфигурация для всех окружений.

**Особенности:**
- Все сервисы с базовыми настройками
- Параметризация через переменные `${VAR_NAME}`
- БЕЗ `restart` policies
- БЕЗ exposed портов
- Volume paths через переменные

**Никогда не запускается отдельно** — только в комбинации с override или prod файлом.

---

### 2. **docker-compose.override.yml** (локальная разработка)

**Назначение:** Автоматические настройки для разработки.

**Особенности:**
- Загружается **автоматически** при `docker-compose up`
- Exposed порты для доступа с хоста:
  - Frontend: `5173` (Vite dev server)
  - Database: `5432` (для pgAdmin/DBeaver)
  - Kong API: `8000`, `8443`
  - Studio: `3000`
- Hot-reload для frontend:
  ```yaml
  volumes:
    - ./src:/app/src
    - ./public:/app/public
  ```
- Локальные volumes: `./docker/volumes/db-local`, `./docker/volumes/storage-local`
- БЕЗ `restart: always` (контейнеры падают при ошибках — это нужно для debugging)
- Frontend `target: development` (в Dockerfile должен быть multi-stage build)

---

### 3. **docker-compose.prod.yml** (production)

**Назначение:** Явные настройки для прода — нужно указывать вручную.

**Особенности:**
- Запускается **только явно** через `-f docker-compose.prod.yml`
- `restart: always` для всех сервисов
- Nginx на портах `80`, `8080` (только он exposed)
- Frontend `target: production`
- Production volumes: `/opt/ando/docker/volumes/...`
- БЕЗ exposed портов для DB/Kong (безопасность)
- Production tuning для PostgreSQL (max_connections, shared_buffers)

---

## Использование

### Local Development (по умолчанию)

```bash
# 1. Создать .env из шаблона
cp .env.example .env

# 2. Отредактировать .env (установить пароли, ключи)
nano .env

# 3. Запустить (override.yml применится автоматически)
docker-compose up -d

# 4. Проверить логи
docker-compose logs -f frontend

# 5. Доступ к сервисам:
# - Frontend dev server: http://localhost:5173
# - Supabase Studio:     http://localhost:3000
# - Kong API:            http://localhost:8000
# - PostgreSQL:          localhost:5432 (для DBeaver)
```

---

### Production Deployment

```bash
# 1. Создать .env.production из шаблона
cp .env.example .env.production

# 2. Отредактировать .env.production:
nano .env.production
# - Установить FRONTEND_BUILD_TARGET=production
# - Установить DB_DATA_PATH=/opt/ando/docker/volumes/db
# - Установить STORAGE_DATA_PATH=/opt/ando/docker/volumes/storage
# - Сгенерировать новые JWT_SECRET, POSTGRES_PASSWORD
# - Настроить SMTP для email

# 3. Запустить с явным указанием prod файла
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d

# 4. Проверить статус
docker-compose -f docker-compose.yml -f docker-compose.prod.yml ps

# 5. Доступ к сервисам:
# - Frontend (через Nginx): http://your-server-ip
# - Supabase Studio:        http://your-server-ip:8080 (с basic auth)
# - PostgreSQL:             НЕТ доступа снаружи (только внутри docker network)
```

---

### Отключение override в dev (если нужно)

Если нужно протестировать "чистую" базовую конфигурацию без override:

```bash
# Явно указать ТОЛЬКО базовый файл
docker-compose -f docker-compose.yml up -d
```

---

### Тестирование prod конфигурации локально

```bash
# Запустить prod конфигурацию на локальной машине
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.production up -d

# Nginx будет на портах 80, 8080
# Frontend будет в production режиме
# БД и Kong НЕ будут exposed
```

---

## Переменные окружения

### Обязательные для ВСЕХ окружений

```env
# Database
POSTGRES_PASSWORD=xxx
JWT_SECRET=xxx
ANON_KEY=xxx
SERVICE_ROLE_KEY=xxx

# URLs
VITE_SUPABASE_URL=http://...
SUPABASE_PUBLIC_URL=http://...
API_EXTERNAL_URL=http://...
SITE_URL=http://...
```

### Обязательные для DEVELOPMENT

```env
FRONTEND_BUILD_TARGET=development
DB_DATA_PATH=./docker/volumes/db-local
STORAGE_DATA_PATH=./docker/volumes/storage-local
```

### Обязательные для PRODUCTION

```env
FRONTEND_BUILD_TARGET=production
DB_DATA_PATH=/opt/ando/docker/volumes/db
STORAGE_DATA_PATH=/opt/ando/docker/volumes/storage
NGINX_CONFIG_PATH=/opt/ando/docker/nginx/prod.conf

# SMTP для email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@example.com
SMTP_PASS=xxx
SMTP_ADMIN_EMAIL=admin@example.com
```

---

## Полезные команды

### Просмотр итоговой конфигурации

```bash
# Для dev (с override)
docker-compose config

# Для prod
docker-compose -f docker-compose.yml -f docker-compose.prod.yml config
```

### Остановка и удаление

```bash
# Dev
docker-compose down

# Prod
docker-compose -f docker-compose.yml -f docker-compose.prod.yml down

# С удалением volumes (ОСТОРОЖНО - удалит данные!)
docker-compose down -v
```

### Пересборка после изменений в Dockerfile

```bash
# Dev
docker-compose up -d --build frontend

# Prod
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build frontend
```

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Только frontend
docker-compose logs -f frontend

# Последние 100 строк
docker-compose logs --tail=100 frontend
```

---

## Troubleshooting

### Frontend не билдится в production режиме

**Проблема:** В Dockerfile нет multi-stage build.

**Решение:** Добавить в `Dockerfile`:

```dockerfile
# Development stage
FROM node:20-alpine AS development
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Production build stage
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production runtime stage
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### База данных не запускается

**Проблема:** Volume path не существует или нет прав.

**Решение:**

```bash
# Development
mkdir -p docker/volumes/db-local
chmod -R 777 docker/volumes/db-local

# Production
sudo mkdir -p /opt/ando/docker/volumes/db
sudo chown -R 999:999 /opt/ando/docker/volumes/db  # UID PostgreSQL в Docker
```

### Nginx не видит upstream сервисы

**Проблема:** Сервисы еще не запустились.

**Решение:** Добавить в `docker-compose.prod.yml`:

```yaml
nginx:
  depends_on:
    frontend:
      condition: service_started
    kong:
      condition: service_healthy
```

### Порты заняты в dev режиме

**Проблема:** Порты 5173, 5432, 8000 уже используются.

**Решение:** Изменить в `docker-compose.override.yml`:

```yaml
frontend:
  ports:
    - "5174:5173"  # Внешний порт 5174
```

---

## Best Practices

1. **НЕ коммитить** `.env` и `.env.production` в Git
2. **Всегда** использовать разные пароли для dev и prod
3. **В production** использовать сильные JWT_SECRET (минимум 32 символа)
4. **Для production** настроить SMTP для отправки email
5. **Регулярно делать бэкапы** production volumes:
   ```bash
   docker run --rm -v /opt/ando/docker/volumes/db:/data -v $(pwd):/backup \
     alpine tar czf /backup/db-backup-$(date +%Y%m%d-%H%M%S).tar.gz /data
   ```
6. **Мониторить логи** в production:
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.prod.yml logs -f --tail=100
   ```

---

## Безопасность

### В production ОБЯЗАТЕЛЬНО:

- [ ] Сгенерировать новый `JWT_SECRET` (минимум 32 символа)
- [ ] Изменить `POSTGRES_PASSWORD` (не использовать дефолтный)
- [ ] Сгенерировать новые `ANON_KEY` и `SERVICE_ROLE_KEY`
- [ ] Настроить `.htpasswd` для Supabase Studio
- [ ] НЕ exposed порты БД и Kong наружу (только через Nginx)
- [ ] Настроить SSL/TLS для Nginx (Let's Encrypt)
- [ ] Включить firewall и открыть только 80, 443, 8080
- [ ] Регулярно обновлять Docker images

### Генерация секретов

```bash
# JWT_SECRET (32 байт в base64)
openssl rand -base64 32

# POSTGRES_PASSWORD (64 символа)
openssl rand -base64 48 | tr -d '/+=' | head -c 64

# ANON_KEY и SERVICE_ROLE_KEY
# Используйте генератор на https://supabase.com/docs/guides/self-hosting/docker
```

---

## Ссылки

- [Docker Compose Best Practices](https://docs.docker.com/compose/production/)
- [Supabase Self-Hosting Guide](https://supabase.com/docs/guides/self-hosting/docker)
- [Docker Compose Environment Variables](https://docs.docker.com/compose/environment-variables/)
