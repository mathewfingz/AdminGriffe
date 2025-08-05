#!/bin/bash

# AdminGriffe API Startup Script
set -e

echo "🚀 Starting AdminGriffe API..."

# Wait for database to be ready
echo "⏳ Waiting for database connection..."
until pnpm db:ping > /dev/null 2>&1; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "✅ Database is ready!"

# Run database migrations
echo "🔄 Running database migrations..."
pnpm db:migrate

# Generate Prisma client (if not already generated)
echo "🔧 Generating Prisma client..."
pnpm db:generate

# Seed database if needed (only in development)
if [ "$NODE_ENV" = "development" ]; then
  echo "🌱 Seeding database..."
  pnpm db:seed || echo "⚠️  Seeding failed or already completed"
fi

# Setup audit triggers
echo "🔍 Setting up audit triggers..."
pnpm db:setup-audit || echo "⚠️  Audit setup failed or already completed"

# Start the application
echo "🎯 Starting application..."
exec pnpm start