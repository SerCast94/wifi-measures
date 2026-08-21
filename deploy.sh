#!/usr/bin/env bash
set -euo pipefail

# Simple deploy script: build image and start infra
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

echo "You can now start the application container:"
echo "  docker compose -f ${COMPOSE_FILE} up -d template-app"

exit 0
