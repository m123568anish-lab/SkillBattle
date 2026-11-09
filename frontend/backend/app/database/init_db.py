def init_db() -> None:
    raise RuntimeError(
        "Model-based database initialization is disabled for this legacy backend "
        "copy; it has no reviewed, coordinated migration path."
    )
