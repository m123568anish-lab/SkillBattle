#!/usr/bin/env sh
set -e

# API startup is migration-free. This legacy backend copy has no coordinated
# migration runner and must not invoke Alembic directly.
exec "$@"
