# WiFi Measures

Plataforma para la automatización, visualización y generación de informes de medidas y auditorías **Wi‑Fi** y **LoRa**, a partir de datos sincronizados desde **Link‑Live (NetAlly)**.

Monorepo npm con:

- `apps/api` — backend **NestJS** + **Prisma** + **PostgreSQL** (incluye exportación de informes PDF con Chromium y `pdfjs-dist`).
- `apps/web` — frontend **React 19 + Vite + TypeScript + Tailwind/shadcn‑ui**.

## Características

- Sincronización de medidas de Link‑Live (áreas, unidades NetAlly, encuestas y análisis de espectro).
- Auditorías Wi‑Fi: creación con perfil (umbrales de cobertura/radio/rendimiento), checklist, evaluación automática (PASS/WARNING/FAIL/UNKNOWN), incidencias, recomendaciones y conclusiones.
- Auditorías LoRa: análisis, bloques anidados, muestras y resultados.
- **Informe PDF profesional** con portada, índice con números de página reales (doble pasada con `pdfjs-dist`), apartado "Baremo aplicado", gráficas e imágenes embebidas.
- Mapas de calor por encuesta (planos base64 + puntos según umbrales RSSI/SNR) y heatmaps exteriores.

## Requisitos

- Node.js ≥ 20 (el monorepo usa `npm@10` y `turbo`). El CI valida con Node 20.
- Docker + Docker Compose (para PostgreSQL/Redis y para el despliegue de producción).

## Desarrollo local

1. Instalar dependencias del monorepo:

   ```bash
   npm install
   ```

2. Crear el fichero `.env` en la raíz a partir de `/.env.example` y completarlo (BD, Redis, secretos para cookie/CSRF/sesión y credenciales de Link‑Live):

   ```bash
   cp .env.example .env
   ```

   Los valores de `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME` y `DATABASE_URL` deben coincidir.

> [!IMPORTANT]
> El compose de desarrollo monta los datos de PostgreSQL en `./posgresql-data` (bind mount). Es el almacenamiento real de la BD en local: **no lo borres** y haz copias periódicas (ver [Copia de seguridad](#copia-de-seguridad)).

3. Levantar la infraestructura (Postgres + Redis):

   ```bash
   docker compose up -d
   ```

4. Aplicar migraciones y sembrar datos (usuario inicial y perfiles de auditoría):

   ```bash
   cd apps/api
   npx prisma migrate dev --schema=src/core/database/schema/schema.prisma
   ```

   El usuario semilla y los roles se crean automáticamente al arrancar la API (ver `src/main.ts` y `seeders/`).

5. Arrancar API y frontend en modo desarrollo (libera previamente los puertos 3001/5173):

   ```bash
   cd ..
   npm run dev
   ```

   - API + Swagger: `http://localhost:3001/api`
   - Frontend: `http://localhost:5173`

### Comandos útiles

| Comando                 | Descripción                                                |
| ----------------------- | ---------------------------------------------------------- |
| `npm run dev`           | Arranca API y web en watch                                  |
| `npm run build`         | Compila el monorepo (turbo)                                 |
| `npm run lint`          | ESLint en API y web                                         |
| `npm run check-types`   | Typecheck de API y web (turbo)                              |
| `npm run start:prod`    | Ejecuta la API compilada (`apps/api/dist`)                  |
| `cd apps/api && npm test` | Tests unitarios de la API (motor de evaluación…)          |

## Docker (desarrollo)

```bash
docker compose up -d --build
```

Levanta `template-app` (API + frontend servido por nginx en el mismo contenedor, puerto `3001:80`), `template-postgres` y `template-redis`. Al iniciar `template-app` se ejecutan las migraciones pendientes (`prisma migrate deploy`) y el seed del usuario.

## Despliegue en producción

El flujo empaqueta la API compilada, el frontend compilado, nginx y Chromium (para PDF) en una única imagen.

1. Preparar `.env` en la raíz con valores de producción (ver `/docker-compose.prod.yml`):

   - `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `SECRET_KEY`.
   - `LINKLIVE_CLIENT_ID`, `LINKLIVE_CLIENT_SECRET`, `LINKLIVE_USERNAME`, `LINKLIVE_PASSWORD`, `LINKLIVE_APP_ID`, `LINKLIVE_ORG_ID`.
   - `APP_EXTERNAL_PORT` (puerto expuesto; internamente nginx escucha en 80 y hace `proxy_pass` a la API en 3000).

2. Construir la imagen del backend + frontend:

   ```bash
   docker build -t wifi-measures:latest -f Dockerfile .
   ```

3. Si se desea servir el frontend en un contenedor nginx independiente:

   ```bash
   docker build -t wifi-measures:latest-web -f Dockerfile.frontend .
   ```

4. Levantar infraestructura y la aplicación:

   ```bash
   ./deploy.sh                 # construye imágenes y levanta postgres + redis
   docker compose -f docker-compose.prod.yml up -d template-app
   ```

   o, todo en un solo paso (requiere imagen ya construida):

   ```bash
   IMAGE_NAME=wifi-measures:latest docker compose -f docker-compose.prod.yml up -d
   ```

> [!NOTE]
> En producción Postgres usa un volumen Docker (`postgres_data`) en lugar de un bind mount. Las migraciones se aplican automáticamente en el arranque de `template-app` (`entrypoint.sh`).

### Copia de seguridad

La BD es PostgreSQL. Para copias de seguridad:

```bash
docker exec template-postgres pg_dump -U postgres -d wifi_measures --no-owner --no-acls > backup_$(date +%F).sql
```

Restaurar:

```bash
cat backup.sql | docker exec -i template-postgres psql -U postgres -d wifi_measures
```

## Variables de entorno

Ver `/.env.example` y `/docker-compose.prod.yml`. Resumen:

| Variable                   | Descripción                                                  |
| -------------------------- | ------------------------------------------------------------ |
| `DB_HOST`, `DB_PORT`, `DB_EXTERNAL_PORT` | Host/puerto interno y publicado de PostgreSQL   |
| `DB_USERNAME`, `DB_PASSWORD`, `DB_NAME`, `DATABASE_URL` | Credenciales y URL de conexión Prisma |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_EXTERNAL_PORT`, `REDIS_PASSWORD` | Redis (sesiones/caché) |
| `APP_NAME`, `APP_DESCRIPTION`, `APP_PORT`, `APP_EXTERNAL_PORT`, `APP_HOST`, `APP_ENV`, `LOG_LEVEL` | Configuración de la API |
| `ALLOWED_ORIGINS`          | Orígenes CORS permitidos                                      |
| `COOKIE_SECRET`, `CSRF_SECRET`, `SESSION_SECRET` | Secretos (mín. 32 caracteres) |
| `CSRF_COOKIE_NAME`, `SESSION_COOKIE_NAME`, `SESSION_EXPIRES_IN_SECONDS` | Nombres/duración de la sesión |
| `VITE_APP_NAME`, `VITE_STAGE`, `VITE_APP_VERSION` | Variables del frontend          |
| `LINKLIVE_BASE_URL`, `LINKLIVE_AUTH_URL`, `LINKLIVE_USERNAME`, `LINKLIVE_PASSWORD`, `LINKLIVE_APP_ID`, `LINKLIVE_ORG_ID` | Integración con Link‑Live (NetAlly) |
| `SECRET_KEY`               | Clave de cifrado (fallback en producción)                     |

## Estructura relevante

```
apps/api/src/
  core/database/schema/       schema.prisma + migraciones
  features/audits/            auditorías Wi‑Fi (app, informe PDF, evaluación)
  features/lora/              auditorías LoRa (app, informe PDF con baremo)
  features/netally/           integración Link‑Live
apps/web/src/
  app/(home)/audits/          listado, dashboard, evaluación, informe imprimible
```

## Tests

- API: `cd apps/api && npm test` (motor de evaluación con 41 casos unitarios).
- E2E web (Playwright): `cd apps/web && npm run e2e`.

## CI

El workflow de GitHub Actions (`.github/workflows/ci.yml`) ejecuta sobre Node 20: `npm ci`, type‑check, lint y build en cada push/PR a `main`/`develop`.