import { useEffect, useRef, useState } from 'react';

/**
 * Reveals children when they scroll into view.
 *
 * Uses IntersectionObserver rather than a scroll event listener: the observer is
 * evaluated off the main thread on scroll and fires once, whereas a
 * `window.addEventListener('scroll')` handler runs on every frame and forces a
 * reflow each time.
 *
 * The element unobserves itself as soon as it has been revealed, so there is no
 * ongoing work once the page has been read.
 */
export default function Reveal({
  children,
  as: Tag = 'div',
  variant = 'reveal',
  delay = 0,
  className = '',
  style,
  ...rest
}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  // Merge rather than replace: callers pass their own styles (for example a
  // border colour) and must not lose them when a stagger delay is also set.
  const mergedStyle = delay ? { '--reveal-delay': `${delay}ms`, ...style } : style;

  useEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    // Users who have asked for reduced motion get the end state immediately.
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.unobserve(entry.target);
          }
        }
      },
      // Start the reveal slightly before the element is fully on screen.
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`${variant} ${visible ? 'is-visible' : ''} ${className}`.trim()}
      style={mergedStyle}
      {...rest}
    >
      {children}
    </Tag>
  );
}
