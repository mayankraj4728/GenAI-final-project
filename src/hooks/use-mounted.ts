import { useSyncExternalStore } from "react";

const emptySubscribe = () => () => {};

/**
 * True only after hydration on the client; false during SSR.
 * Uses useSyncExternalStore so it never calls setState in an effect.
 */
export function useMounted() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true, // client snapshot
    () => false // server snapshot
  );
}
