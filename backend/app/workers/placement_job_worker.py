from __future__ import annotations

import asyncio
import logging
import os
import signal
import socket

from app.database.session import AsyncSessionLocal
from app.modules.placement.job_service import placement_job_service

logger = logging.getLogger(__name__)

WORKER_NAME = os.getenv(
    "PLACEMENT_WORKER_NAME",
    f"placement-job-worker-{socket.gethostname()}",
)

async def run_once() -> bool:
    async with AsyncSessionLocal() as session:
        try:
            job = await placement_job_service.claim_next_job(session, WORKER_NAME)
        except Exception:
            await session.rollback()
            logger.exception("Could not claim a placement job; worker will retry after polling delay.")
            return False
        if job is None:
            return False
        try:
            await placement_job_service.process_job(session, job)
            logger.info("Processed placement job %s (%s)", job.id, job.job_type)
        except Exception as exc:  # pragma: no cover - exercised in tests
            try:
                await placement_job_service.mark_failure(session, job, exc)
            except Exception:
                await session.rollback()
                logger.exception("Could not record failure for placement job %s.", job.id)
            logger.error("Placement job %s failed: %s", job.id, str(exc)[:500])
        return True


async def main() -> None:
    poll_seconds = max(0.25, float(os.getenv("PLACEMENT_JOB_POLL_SECONDS", "5")))
    batch_size = max(1, int(os.getenv("PLACEMENT_JOB_BATCH_SIZE", "10")))
    shutdown = asyncio.Event()
    loop = asyncio.get_running_loop()
    for signum in (signal.SIGINT, signal.SIGTERM):
        try:
            loop.add_signal_handler(signum, shutdown.set)
        except (NotImplementedError, RuntimeError, ValueError):
            signal.signal(signum, lambda *_: loop.call_soon_threadsafe(shutdown.set))

    logger.info(
        "Placement worker started (name=%s, poll_seconds=%s, batch_size=%s)",
        WORKER_NAME,
        poll_seconds,
        batch_size,
    )
    try:
        while not shutdown.is_set():
            for _ in range(batch_size):
                if shutdown.is_set():
                    break
                if not await run_once():
                    break
            try:
                await asyncio.wait_for(shutdown.wait(), timeout=poll_seconds)
            except asyncio.TimeoutError:
                pass
    finally:
        logger.info("Placement worker stopped gracefully.")


if __name__ == "__main__":
    asyncio.run(main())
