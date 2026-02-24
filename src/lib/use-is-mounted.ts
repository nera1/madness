import { useSyncExternalStore } from "react";

/**
 * react-best-practices: useSyncExternalStore 기반 클라이언트 마운트 확인.
 * useEffect + setState 패턴을 피해 react-hooks/set-state-in-effect 룰을 준수.
 * SSR에서 false, 클라이언트에서 true를 반환.
 */
export function useIsMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},  // subscribe (불변 외부 스토어)
    () => true,      // getSnapshot (클라이언트)
    () => false,     // getServerSnapshot (SSR)
  );
}
