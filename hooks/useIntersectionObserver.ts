// Hook pour détecter quand un élément est visible (Intersection Observer)
import { useEffect, useRef, useState } from "react";

interface UseIntersectionObserverOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = "200px",
    triggerOnce = false,
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const targetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const isVisible = entry.isIntersecting;

        if (isVisible) {
          setIsIntersecting(true);
          if (triggerOnce && !hasTriggered) {
            setHasTriggered(true);
          }
        } else {
          if (!triggerOnce) {
            setIsIntersecting(false);
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    observer.observe(target);

    return () => {
      observer.unobserve(target);
    };
  }, [threshold, rootMargin, triggerOnce, hasTriggered]);

  // Si triggerOnce est activé et qu'on a déjà trigger, on retourne toujours true
  const shouldTrigger = triggerOnce
    ? hasTriggered || isIntersecting
    : isIntersecting;

  return {
    ref: targetRef,
    isIntersecting: shouldTrigger,
  };
}
