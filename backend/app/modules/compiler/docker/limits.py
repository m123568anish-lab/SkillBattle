"""
=========================================================

Execution Limits

=========================================================
"""

from dataclasses import dataclass


@dataclass(slots=True)
class ExecutionLimits:

    cpu_seconds: int = 2

    memory_mb: int = 256

    process_limit: int = 64

    timeout_seconds: int = 3

    network_disabled: bool = True

    read_only_rootfs: bool = True

    output_limit_kb: int = 1024