#!/usr/bin/env sh
set -e

# Run alembic migrations before starting the application
if [ -x "$(command -v alembic)" ]; then
  echo "🔃 Running database migrations..."
  alembic upgrade head || echo "⚠️ Alembic upgrade returned non-zero status"
else
  echo "⚠️ alembic not found in PATH, skipping migrations"
fi

# Execute the given command
exec "$@"
