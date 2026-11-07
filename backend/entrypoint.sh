#!/usr/bin/env sh
set -e

# Run the validated migration runner before starting the application.
# Migration failure must prevent startup with an incompatible schema.
echo "Running database migrations..."
python -u run_migrations.py

# Execute the given command
exec "$@"
