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

# Backend runtime image (NestJS)
FROM node:20 AS backend
WORKDIR /app
ENV NODE_ENV=production

# Copy built app from build stage
COPY --from=build /app/apps/api/dist ./apps/api/dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/apps/api/node_modules ./apps/api/node_modules

WORKDIR /app/apps/api
EXPOSE 3000
CMD ["node", "dist/main.js"]

# Frontend static build (can be served by a CDN or nginx)
FROM nginx:alpine AS frontend
COPY --from=build /app/apps/web/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]