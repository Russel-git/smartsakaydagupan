import { useEffect, useState } from "react";

export default function useIntersectionObserver(
  targetRef,
  { threshold = 0.3, root = null, rootMargin = "0px", triggerOnce = true } = {},
) {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    const element = targetRef.current;

    if (!element) return;

    if (typeof IntersectionObserver === "undefined") {
      setIsIntersecting(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true);

          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsIntersecting(false);
        }
      },
      { root, rootMargin, threshold },
    );

    observer.observe(element);

    return () => observer.disconnect();
  }, [targetRef, threshold, root, rootMargin, triggerOnce]);

  return isIntersecting;
}
