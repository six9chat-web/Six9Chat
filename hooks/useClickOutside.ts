import { useEffect, RefObject } from "react";

/**
 * Custom hook to detect clicks outside of a specified element.
 * 
 * @param ref - Ref object pointing to the target HTML element
 * @param handler - Callback function invoked when a click occurs outside
 * @param enabled - Whether the outside click listener is active
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null>,
  handler: (event: MouseEvent | TouchEvent) => void,
  enabled: boolean = true
) {
  useEffect(() => {
    if (!enabled) return;

    function listener(event: MouseEvent | TouchEvent) {
      const el = ref.current;
      // Do nothing if target is inside the ref element
      if (!el || el.contains(event.target as Node)) {
        return;
      }
      handler(event);
    }

    // Use mousedown and touchstart with bubble phase
    document.addEventListener("mousedown", listener);
    document.addEventListener("touchstart", listener);

    return () => {
      document.removeEventListener("mousedown", listener);
      document.removeEventListener("touchstart", listener);
    };
  }, [ref, handler, enabled]);
}
