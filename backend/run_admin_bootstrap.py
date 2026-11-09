#!/usr/bin/env python
"""Explicitly provision or reconcile the configured platform administrator."""

from __future__ import annotations

import asyncio

from app.core.admin_bootstrap import ensure_platform_admin
from app.database.session import engine


async def main() -> int:
    try:
        await ensure_platform_admin()
        return 0
    finally:
        await engine.dispose()


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
