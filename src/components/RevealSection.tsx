"use client";

import React, { useEffect, useRef, useState } from "react";

/**
 * Hook for scroll-triggered reveal animations.
 */
export function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsRevealed(true);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: "0px 0px -40px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isRevealed };
}

/**
 * Hook for header scroll detection.
 */
export function useScrolled(threshold = 40) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > threshold);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  return scrolled;
}

/**
 * Reusable RevealSection component for scroll-driven animations.
 */
export function RevealSection({
  children,
  className = "reveal",
  style,
  as: Tag = "div",
  threshold = 0.12,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  as?: React.ElementType;
  threshold?: number;
  delay?: number;
}) {
  const { ref, isRevealed } = useScrollReveal(threshold);

  return (
    <Tag
      ref={ref}
      className={`${className} ${isRevealed ? "revealed" : ""}`}
      style={{ ...style, transitionDelay: delay ? `${delay}s` : undefined }}
    >
      {children}
    </Tag>
  );
}

export default RevealSection;
