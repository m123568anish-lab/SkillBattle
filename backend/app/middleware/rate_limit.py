import time

from collections import defaultdict

REQUESTS = defaultdict(list)

LIMIT = 100

WINDOW = 60


def check_limit(api_key: str):

    now = time.time()

    REQUESTS[api_key] = [

        t

        for t in REQUESTS[api_key]

        if now - t < WINDOW

    ]

    if len(REQUESTS[api_key]) >= LIMIT:

        return False

    REQUESTS[api_key].append(now)

    return True