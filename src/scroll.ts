// Small scroll helpers. Scrubbed effects live in CSS (scroll-driven animations); these cover the rest:
// things that fire once the page has scrolled past a point.

const FAR = 1_000_000;

/** The furthest the page can scroll. */
export const maxScroll = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);

/**
 * Calls `fn` when `el`'s top or bottom edge is above a line across the screen (`line` from 0, the top,
 * to 1, the bottom) — including when it is already above it on load, or the page jumps past it.
 * With `once` off, it fires again each time the edge crosses the line going down.
 */
export function whenPast(el: Element, edge: "top" | "bottom", line: number, fn: () => void, once = true) {
  const pct = Math.round(line * 100);
  // Top: watch everything above the line, and fire when the element reaches into it.
  // Bottom: watch everything below the line, and fire when the element has left it.
  const rootMargin = edge === "top" ? `${FAR}px 0px ${pct - 100}% 0px` : `${-pct}% 0px ${FAR}px 0px`;
  let past = false;
  const io = new IntersectionObserver(
    ([entry]) => {
      const now = edge === "top" ? entry.isIntersecting : !entry.isIntersecting;
      if (now && !past) {
        if (once) io.disconnect();
        fn();
      }
      past = now;
    },
    { rootMargin },
  );
  io.observe(el);
}
