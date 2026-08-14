"use client";

import { useEffect, RefObject } from "react";

export function useAutoScroll(
    ref: RefObject<HTMLDivElement | null>,
    dependency: unknown
) {
    useEffect(() => {
        ref.current?.scrollTo({
            top: ref.current.scrollHeight,
            behavior: "smooth",
        });
    }, [dependency]);
}