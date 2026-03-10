"use client";

import { useRef, useState, useCallback } from "react";
import { useSwipeable, type SwipeableHandlers } from "react-swipeable";

type UseSlideSwipeOptions = {
  onSwipeLeft: () => void; // 다음 슬라이드
  onSwipeRight: () => void; // 이전 슬라이드
  canSwipeLeft: boolean;
  canSwipeRight: boolean;
  enabled: boolean; // false → 스와이프 비활성 (예: 그리기 모드)
};

export type SlideSwipeState = {
  /** 스와이프 중 수평 이동량 (px). 왼쪽 = 음수, 오른쪽 = 양수 */
  deltaX: number;
  /** "idle" | "swiping" | "exiting" (exit 애니메이션 진행 중) */
  phase: "idle" | "swiping" | "exiting";
};

type UseSlideSwipeReturn = {
  handlers: SwipeableHandlers;
  swipeState: SlideSwipeState;
};

/** 터치 시작점이 편집 영역 내부인지 확인 */
function shouldIgnoreSwipe(event: { target: EventTarget | null }): boolean {
  const target = event.target as HTMLElement | null;
  if (!target) return true;

  if (target.isContentEditable) return true;
  if (target.closest("[contenteditable]")) return true;
  if (target.closest("[data-yoopta-editor]")) return true;
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLTextAreaElement
  )
    return true;

  return false;
}

/** 저항감 적용 — 끝에 갈수록 느려지는 느낌 */
function applyResistance(delta: number, max: number): number {
  const sign = delta < 0 ? -1 : 1;
  const abs = Math.abs(delta);
  return sign * max * (1 - Math.exp(-abs / max));
}

const EXIT_DURATION = 200; // ms
const MAX_DRAG = 200; // 최대 드래그 거리 (px)

export function useSlideSwipe({
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft,
  canSwipeRight,
  enabled,
}: UseSlideSwipeOptions): UseSlideSwipeReturn {
  const ignoringRef = useRef(false);
  const [swipeState, setSwipeState] = useState<SlideSwipeState>({
    deltaX: 0,
    phase: "idle",
  });

  const handlers = useSwipeable({
    onSwipeStart: (eventData) => {
      ignoringRef.current = !enabled || shouldIgnoreSwipe(eventData.event);
    },
    onSwiping: (eventData) => {
      if (ignoringRef.current) return;

      const dx = eventData.deltaX;
      // 해당 방향으로 이동 불가하면 저항을 극도로 높임
      const canMove = dx < 0 ? canSwipeLeft : canSwipeRight;
      const clamped = canMove
        ? applyResistance(dx, MAX_DRAG)
        : applyResistance(dx, 30); // 불가 방향은 살짝만

      setSwipeState({ deltaX: clamped, phase: "swiping" });
    },
    onSwipedLeft: () => {
      if (ignoringRef.current || !canSwipeLeft) {
        setSwipeState({ deltaX: 0, phase: "idle" });
        return;
      }
      // exit 애니메이션: 왼쪽으로 날아감
      setSwipeState({ deltaX: -window.innerWidth, phase: "exiting" });
      setTimeout(() => {
        onSwipeLeft();
        setSwipeState({ deltaX: 0, phase: "idle" });
      }, EXIT_DURATION);
    },
    onSwipedRight: () => {
      if (ignoringRef.current || !canSwipeRight) {
        setSwipeState({ deltaX: 0, phase: "idle" });
        return;
      }
      // exit 애니메이션: 오른쪽으로 날아감
      setSwipeState({ deltaX: window.innerWidth, phase: "exiting" });
      setTimeout(() => {
        onSwipeRight();
        setSwipeState({ deltaX: 0, phase: "idle" });
      }, EXIT_DURATION);
    },
    onSwiped: () => {
      ignoringRef.current = false;
      // 임계값 미달 → 원래 위치로 복귀 (exiting이 아닌 경우만)
      setSwipeState((prev) =>
        prev.phase === "exiting" ? prev : { deltaX: 0, phase: "idle" },
      );
    },
    delta: 20,
    preventScrollOnSwipe: false,
    trackTouch: true,
    trackMouse: false,
    swipeDuration: 500,
  });

  return { handlers, swipeState };
}

/**
 * react-swipeable의 ref와 기존 ref를 머지하는 헬퍼.
 */
export function useMergedSwipeRef(
  existingRef: React.MutableRefObject<HTMLElement | null>,
  swipeRef: SwipeableHandlers["ref"],
): React.RefCallback<HTMLElement> {
  return useCallback(
    (node: HTMLElement | null) => {
      existingRef.current = node;
      if (typeof swipeRef === "function") swipeRef(node);
    },
    [existingRef, swipeRef],
  );
}
