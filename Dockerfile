FROM node:20 AS deps
WORKDIR /app

# Copy root package files and install workspace tools
COPY package.json package-lock.json turbo.json ./
RUN npm install -g turbo

FROM deps AS build
WORKDIR /app
# Copy source
COPY . .

# Install JS deps for the monorepo and build both api and web
RUN npm install --legacy-peer-deps
RUN npx prisma generate --schema=apps/api/src/core/database/schema/schema.prisma || true
# Install workspace deps and ensure apps/api deps are installed so runtime has all modules
 RUN npm install --legacy-peer-deps
 # Install apps/api dependencies locally (avoid workspace hoisting)
 RUN npm install --legacy-peer-deps --prefix apps/api
 # Generate Prisma client inside apps/api/node_modules
 RUN npm --prefix apps/api exec -- npx prisma generate --schema=apps/api/src/core/database/schema/schema.prisma || true
RUN npm run build

FROM node:20 AS runtime
WORKDIR /app
ENV NODE_ENV=production

RUN apt-get update && apt-get install -y nginx && rm -rf /var/lib/apt/lists/*

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