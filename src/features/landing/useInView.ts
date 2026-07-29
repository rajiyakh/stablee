import { useEffect, useRef, useState } from "react";

/**
 * Scroll-reveal trigger: returns a ref to attach and whether the element has
 * entered the viewport (once — never reverts, so content doesn't flicker in
 * and out on scroll direction changes). Backed by IntersectionObserver, no
 * scroll listeners. Reduced-motion users still get this (it just toggles a
 * class), and the fade-up-in animation itself is neutralized by the
 * existing global prefers-reduced-motion rule in styles.css.
 */
export function useInView<T extends HTMLElement>(threshold = 0.15) {
  const ref = useRef<T | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || isInView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [isInView, threshold]);

  return { ref, isInView };
}
