#!/usr/bin/env sh
set -e

# API startup is migration-free. Run schema changes only through an explicitly
# authorized migration operation.
exec "$@"
