#!/bin/sh

echo "Aplicando migraciones..."
cd apps/api && npx prisma migrate deploy --schema=src/core/database/schema/schema.prisma

echo "Iniciando la aplicación..."
exec npm run start:prod