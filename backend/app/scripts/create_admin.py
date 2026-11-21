"""Create one local/staging Qubira platform administrator.

Run from ``backend`` with ``python -m app.scripts.create_admin``.
The generated password is printed only for a newly created account.
"""

from __future__ import annotations

import argparse
import asyncio
import os
import secrets
import sys


def _parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--email", default=os.getenv("PLATFORM_ADMIN_EMAIL", "admin@qubira.local"))
    parser.add_argument("--username", default=os.getenv("PLATFORM_ADMIN_USERNAME", "admin"))
    parser.add_argument("--password", help="Explicit password; otherwise a secure temporary password is generated")
    return parser


async def _run(args: argparse.Namespace) -> int:
    environment = (os.getenv("ENVIRONMENT") or "development").strip().casefold()
    if environment in {"production", "prod"}:
        raise RuntimeError("Admin bootstrap is disabled in production.")
    if environment not in {"development", "dev", "staging", "stage", "test", "testing"}:
        raise RuntimeError("Admin bootstrap requires a development, staging, or test environment.")

    from app.core.admin_bootstrap import create_platform_admin
    from app.database.init_db import ensure_database_compatibility

    # The local DB may predate the current User model. This is the existing
    # non-destructive development compatibility path; it is never run in prod.
    ensure_database_compatibility()
    password = args.password or secrets.token_urlsafe(24)
    user, created = await create_platform_admin(
        email=args.email,
        username=args.username,
        password=password,
    )
    print("QUBIRA ADMIN TEST ACCOUNT")
    print(f"Login ID: {user.email}")
    if created:
        print(f"Temporary Password: {password}")
    else:
        print("Temporary Password: [not displayed; account already existed]")
    print(f"Environment: {(os.getenv('ENVIRONMENT') or 'development').strip().lower()}")
    print("Status: created" if created else "Status: existing platform-admin account reused")
    return 0


def main() -> int:
    try:
        return asyncio.run(_run(_parser().parse_args()))
    except Exception as exc:
        print(f"Admin bootstrap failed: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
