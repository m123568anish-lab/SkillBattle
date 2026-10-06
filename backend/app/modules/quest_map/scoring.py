STAR_THRESHOLDS = ((90, 3), (70, 2), (0, 1))


def stars_for_accuracy(accuracy: float) -> int:
    """Completed battles earn one star; 70% earns two and 90% earns three."""
    for threshold, stars in STAR_THRESHOLDS:
        if accuracy >= threshold:
            return stars
    return 0