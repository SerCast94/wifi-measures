# syntax=docker/dockerfile:1.5

FROM node:20 AS deps
WORKDIR /app

# Copiar solo manifiestos → la capa de dependencias solo se invalida si cambian
COPY package.json package-lock.json turbo.json ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json

# Instalar dependencias del monorepo (turbo ya es devDependency raíz; npm ci usa el lockfile)
RUN --mount=type=cache,target=/root/.npm npm ci --legacy-peer-deps
# Dependencias locales de la API en una capa propia (evita hoisting del workspace en runtime)
RUN --mount=type=cache,target=/root/.npm npm install --legacy-peer-deps --prefix apps/api

FROM deps AS build
WORKDIR /app

# Reutilizar node_modules instalados (capa cacheada) y luego copiar el resto del código
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY . .

# Generar cliente Prisma tras copiar el schema actual y compilar ambos paquetes
RUN npx prisma generate --schema=apps/api/src/core/database/schema/schema.prisma || true \
	&& npm --prefix apps/api exec -- npx prisma generate --schema=apps/api/src/core/database/schema/schema.prisma || true
RUN npm run build

FROM node:20 AS runtime
WORKDIR /app
ENV NODE_ENV=production

# nginx sirve el frontend; chromium habilita la exportación real a PDF
RUN apt-get update && apt-get install -y --no-install-recommends nginx chromium \
	&& rm -rf /var/lib/apt/lists/* \
	&& ln -sf /usr/bin/chromium /usr/bin/google-chrome || true

ENV CHROMIUM_PATH=/usr/bin/chromium \
	PUPPETEER_SKIP_DOWNLOAD=true

COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/apps/api/src/core/database/schema ./apps/api/src/core/database/schema
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
COPY --from=build /app/entrypoint.sh /usr/local/bin/entrypoint.sh
COPY --from=build /app/nginx.conf /etc/nginx/conf.d/default.conf

RUN sed -i 's/\r$//' /usr/local/bin/entrypoint.sh \
	&& sed -i '1s/^\xEF\xBB\xBF//' /usr/local/bin/entrypoint.sh \
	&& chmod +x /usr/local/bin/entrypoint.sh \
	&& rm -f /etc/nginx/sites-enabled/default

EXPOSE 80 3000
CMD ["/usr/local/bin/entrypoint.sh"]