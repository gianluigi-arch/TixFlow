#!/bin/sh
set -e

echo "Running Prisma database migrations..."
prisma migrate deploy

echo "Running idempotent database seed..."
node dist/seed.js

echo "Starting TixFlow backend server..."
exec node dist/server.js
