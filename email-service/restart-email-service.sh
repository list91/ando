#!/bin/bash
# Скрипт пересоздания email-service после рестарта supabase-auth
# Ждём пока auth полностью запустится
sleep 5

# Проверяем что auth работает
if ! docker ps --format '{{.Names}}' | grep -q supabase-auth; then
    echo "supabase-auth not running, exiting"
    exit 1
fi

# Пересоздаём email-service
docker rm -f ando-email-service 2>/dev/null || true
docker run -d     --name ando-email-service     --network container:supabase-auth     --restart unless-stopped     --env-file /opt/ando/email-service/.env     ando-email-service:latest

echo "email-service recreated at 20 фев 2026 г. 18:50:44"
