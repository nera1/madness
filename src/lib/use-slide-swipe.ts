"use client";

import { useRef, useCallback } from "react";
import { useSwipeable, type SwipeableHandlers } from "react-swipeable";

type UseSlideSwipeOptions = {
  onSwipeLeft: () => void; // 다음 슬라이드
  onSwipeRight: () => void; // 이전 슬라이드
  canSwipeLeft: boolean;
  canSwipeRight: boolean;
  enabled: boolean; // false → 스와이프 비활성 (예: 그리기 모드)
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

export function useSlideSwipe({
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft,
  canSwipeRight,
  enabled,
}: UseSlideSwipeOptions): SwipeableHandlers {
  const ignoringRef = useRef(false);

  const handlers = useSwipeable({
    onSwipeStart: (eventData) => {
      ignoringRef.current = !enabled || shouldIgnoreSwipe(eventData.event);
    },
    onSwipedLeft: () => {
      if (ignoringRef.current || !canSwipeLeft) return;
      onSwipeLeft();
    },
    onSwipedRight: () => {
      if (ignoringRef.current || !canSwipeRight) return;
      onSwipeRight();
    },
    onSwiped: () => {
      ignoringRef.current = false;
    },
    delta: 50,
    preventScrollOnSwipe: false,
    trackTouch: true,
    trackMouse: false,
    swipeDuration: 500,
  });

  return handlers;
}

/**
 * react-swipeable의 ref와 기존 ref를 머지하는 헬퍼.
 * 사용: <main ref={mergeRefs(existingRef, swipeHandlers.ref)} {...swipeHandlers}>
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
