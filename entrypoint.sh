#!/bin/sh
set -e

cd /app

echo "Aplicando migraciones..."
cd apps/api && npx prisma migrate deploy --schema=src/core/database/schema/schema.prisma

echo "Iniciando API..."
cd /app && node apps/api/dist/main.js &

echo "Iniciando nginx..."
exec nginx -g 'daemon off;'
