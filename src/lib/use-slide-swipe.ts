"use client";

import { useRef, useCallback, type RefCallback, type MutableRefObject } from "react";
import { useSwipeable, type SwipeableHandlers } from "react-swipeable";

type UseSlideSwipeOptions = {
  onSwipeLeft: () => void; // 다음 슬라이드
  onSwipeRight: () => void; // 이전 슬라이드
  canSwipeLeft: boolean;
  canSwipeRight: boolean;
  enabled: boolean; // false → 스와이프 비활성 (예: 그리기 모드)
};

type UseSlideSwipeReturn = {
  /** <main> 요소에 연결할 핸들러 */
  handlers: SwipeableHandlers;
  /** 애니메이션 대상 요소에 연결할 ref */
  contentRef: RefCallback<HTMLElement>;
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

const EXIT_MS = 180;
const SNAP_BACK_MS = 250;
const MAX_DRAG = 180;
const AXIS_LOCK_THRESHOLD = 8; // 축 결정까지 필요한 최소 이동 px

export function useSlideSwipe({
  onSwipeLeft,
  onSwipeRight,
  canSwipeLeft,
  canSwipeRight,
  enabled,
}: UseSlideSwipeOptions): UseSlideSwipeReturn {
  const ignoringRef = useRef(false);
  const contentElRef = useRef<HTMLElement | null>(null);
  // 축 고정: null = 미결정, "h" = 수평 확정, "v" = 수직 → 무시
  const axisRef = useRef<"h" | "v" | null>(null);
  const exitingRef = useRef(false);

  /** DOM 직접 조작 — React 리렌더 없이 60fps */
  const setTransform = (x: number, transition: string, opacity = 1) => {
    const el = contentElRef.current;
    if (!el) return;
    el.style.transform = x === 0 ? "" : `translateX(${x}px)`;
    el.style.transition = transition;
    el.style.opacity = opacity === 1 ? "" : String(opacity);
  };

  const reset = () => {
    setTransform(0, "", 1);
    const el = contentElRef.current;
    if (el) el.style.willChange = "";
  };

  const handlers = useSwipeable({
    onSwipeStart: (eventData) => {
      ignoringRef.current = !enabled || shouldIgnoreSwipe(eventData.event);
      axisRef.current = null; // 축 미결정 상태로 초기화
      if (!ignoringRef.current) {
        const el = contentElRef.current;
        if (el) el.style.willChange = "transform, opacity";
      }
    },
    onSwiping: (eventData) => {
      if (ignoringRef.current || exitingRef.current) return;

      const { deltaX, deltaY } = eventData;

      // 축 아직 미결정 → 결정
      if (axisRef.current === null) {
        const ax = Math.abs(deltaX);
        const ay = Math.abs(deltaY);
        if (ax < AXIS_LOCK_THRESHOLD && ay < AXIS_LOCK_THRESHOLD) return; // 아직 이동 부족
        axisRef.current = ax >= ay ? "h" : "v";
      }

      // 수직 스와이프 → 무시 (일반 스크롤)
      if (axisRef.current === "v") return;

      const canMove = deltaX < 0 ? canSwipeLeft : canSwipeRight;
      const x = canMove
        ? applyResistance(deltaX, MAX_DRAG)
        : applyResistance(deltaX, 25);

      setTransform(x, "none");
    },
    onSwipedLeft: () => {
      if (ignoringRef.current || axisRef.current !== "h" || !canSwipeLeft) {
        setTransform(0, `transform ${SNAP_BACK_MS}ms cubic-bezier(.25,.46,.45,.94)`);
        return;
      }
      exitingRef.current = true;
      setTransform(
        -window.innerWidth,
        `transform ${EXIT_MS}ms ease-in, opacity ${EXIT_MS}ms ease-in`,
        0,
      );
      setTimeout(() => {
        reset();
        exitingRef.current = false;
        onSwipeLeft();
      }, EXIT_MS);
    },
    onSwipedRight: () => {
      if (ignoringRef.current || axisRef.current !== "h" || !canSwipeRight) {
        setTransform(0, `transform ${SNAP_BACK_MS}ms cubic-bezier(.25,.46,.45,.94)`);
        return;
      }
      exitingRef.current = true;
      setTransform(
        window.innerWidth,
        `transform ${EXIT_MS}ms ease-in, opacity ${EXIT_MS}ms ease-in`,
        0,
      );
      setTimeout(() => {
        reset();
        exitingRef.current = false;
        onSwipeRight();
      }, EXIT_MS);
    },
    onSwiped: () => {
      ignoringRef.current = false;
      if (!exitingRef.current) {
        // 임계값 미달 → 원래 위치로 스냅백
        setTransform(0, `transform ${SNAP_BACK_MS}ms cubic-bezier(.25,.46,.45,.94)`);
      }
    },
    delta: 10,
    preventScrollOnSwipe: false,
    trackTouch: true,
    trackMouse: false,
    swipeDuration: 500,
  });

  const contentRef: RefCallback<HTMLElement> = useCallback(
    (node: HTMLElement | null) => {
      contentElRef.current = node;
    },
    [],
  );

  return { handlers, contentRef };
}

/**
 * react-swipeable의 ref와 기존 ref를 머지하는 헬퍼.
 */
export function useMergedSwipeRef(
  existingRef: MutableRefObject<HTMLElement | null>,
  swipeRef: SwipeableHandlers["ref"],
): RefCallback<HTMLElement> {
  return useCallback(
    (node: HTMLElement | null) => {
      existingRef.current = node;
      if (typeof swipeRef === "function") swipeRef(node);
    },
    [existingRef, swipeRef],
  );
}
