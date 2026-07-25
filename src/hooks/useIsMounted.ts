import { useEffect, useRef } from "react";

/**
 * Returns a function you can check before calling setState in an async
 * callback, so a slow request that resolves after the user has already
 * navigated away doesn't trigger a "set state on unmounted component"
 * warning or, worse, stomp on whatever the next screen is doing.
 */
export function useIsMounted() {
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);
  return () => mountedRef.current;
}
