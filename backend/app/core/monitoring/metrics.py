"""
=========================================================

Prometheus Metrics

=========================================================
"""

from __future__ import annotations

from prometheus_client import Counter
from prometheus_client import Histogram
from prometheus_client import Gauge


class Metrics:

    def __init__(self):

        self.http_requests = Counter(

            "skillbattle_http_requests_total",

            "Total HTTP Requests",

        )

        self.http_latency = Histogram(

            "skillbattle_http_latency_seconds",

            "HTTP Request Duration",

        )

        self.active_battles = Gauge(

            "skillbattle_active_battles",

            "Running Battles",

        )

        self.active_tournaments = Gauge(

            "skillbattle_active_tournaments",

            "Running Tournaments",

        )

        self.ai_requests = Counter(

            "skillbattle_ai_requests_total",

            "Total AI Requests",

        )

        self.compiler_requests = Counter(

            "skillbattle_compiler_requests_total",

            "Compiler Requests",

        )


metrics = Metrics()