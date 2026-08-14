#!/usr/bin/env bash
set -euo pipefail

# Simple deploy script: build image, start infra and run Alembic migrations
# Usage: IMAGE_NAME=wifi-measures:latest DATABASE_URL=... ./deploy.sh

IMAGE_NAME=${IMAGE_NAME:-wifi-measures:latest}
COMPOSE_FILE=${COMPOSE_FILE:-docker-compose.prod.yml}
PROJECT_NAME=$(basename "$(pwd)")
NETWORK_NAME="${PROJECT_NAME}_app-network"

echo "Building backend image ${IMAGE_NAME} using Dockerfile..."
docker build -t "${IMAGE_NAME}" -f Dockerfile .

FRONTEND_IMAGE=${FRONTEND_IMAGE:-${IMAGE_NAME}-web}
if [ -f Dockerfile.frontend ]; then
  echo "Building frontend image ${FRONTEND_IMAGE} using Dockerfile.frontend..."
  docker build -t "${FRONTEND_IMAGE}" -f Dockerfile.frontend .
fi

if [ -f "${COMPOSE_FILE}" ]; then
  echo "Starting postgres and redis via ${COMPOSE_FILE}..."
  docker compose -f "${COMPOSE_FILE}" up -d template-postgres template-redis || true

  echo "Waiting for postgres to become ready..."
  for i in {1..60}; do
    if docker exec template-postgres pg_isready -U "${DB_USERNAME:-postgres}" -d "${DB_NAME:-postgres}" >/dev/null 2>&1; then
      echo "Postgres is ready."
      break
    fi
    echo -n '.'; sleep 1
  done
  echo
else
  echo "No ${COMPOSE_FILE} found — continuing and expecting DATABASE_URL to be set." 
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL not set. The migrations will fail unless DATABASE_URL is provided in the environment." >&2
fi

echo "Building temporary migration image..."
cat > Dockerfile.migrate <<'EOF'
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt
COPY . /app
ENTRYPOINT ["/bin/sh", "-c"]
EOF

MIGRATE_IMAGE=${MIGRATE_IMAGE:-wifi-measures-migrate:latest}
docker build -f Dockerfile.migrate -t "${MIGRATE_IMAGE}" .

echo "Running Alembic migrations inside ephemeral container (image: ${MIGRATE_IMAGE})"
docker run --rm --network "${NETWORK_NAME}" -e DATABASE_URL="${DATABASE_URL:-}" "${MIGRATE_IMAGE}" "alembic upgrade head"

echo "Cleaning up temporary files..."
rm -f Dockerfile.migrate

echo "Migrations completed."

echo "You can now start the application container:"
echo "  docker compose -f ${COMPOSE_FILE} up -d template-app"

exit 0
