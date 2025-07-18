import { useRef } from "react";

export function useClientSeed(): string {
  const seedRef = useRef<string | null>(null);

  if (seedRef.current === null) {
    seedRef.current = crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  return seedRef.current!;
}
