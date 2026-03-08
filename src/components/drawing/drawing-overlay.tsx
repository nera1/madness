"use client";

import React, { useCallback, useRef, useState } from "react";
import { getStroke } from "perfect-freehand";

// ──── Types ──────────────────────────────────────────────────────────────────

export type Stroke = {
  path: string;
  color: string;
  size: number;
};

type DrawingOverlayProps = {
  strokes: Stroke[];
  onStrokesChange: (strokes: Stroke[]) => void;
  color: string;
  size: number;
};

// ──── getStroke → SVG path 변환 ──────────────────────────────────────────────

function getSvgPathFromStroke(points: number[][]): string {
  if (points.length === 0) return "";

  const max = points.length - 1;
  return points
    .reduce(
      (acc, point, i, arr) => {
        if (i === max) return acc;
        const xc = (point[0] + arr[i + 1][0]) / 2;
        const yc = (point[1] + arr[i + 1][1]) / 2;
        return `${acc} Q ${point[0]},${point[1]} ${xc},${yc}`;
      },
      `M ${points[0][0]},${points[0][1]}`,
    )
    .concat(` Z`);
}

// ──── 고정 옵션 ──────────────────────────────────────────────────────────────

const BASE_OPTIONS = {
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
  simulatePressure: true,
};

// ──── DrawingOverlay ─────────────────────────────────────────────────────────

export default function DrawingOverlay({
  strokes,
  onStrokesChange,
  color,
  size,
}: DrawingOverlayProps) {
  const [currentPoints, setCurrentPoints] = useState<number[][]>([]);
  const isDrawingRef = useRef(false);

  // ── 포인터 이벤트 ──

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      isDrawingRef.current = true;
      setCurrentPoints([[e.clientX, e.clientY, e.pressure]]);
    },
    [],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      if (!isDrawingRef.current) return;
      e.preventDefault();
      setCurrentPoints((prev) => [...prev, [e.clientX, e.clientY, e.pressure]]);
    },
    [],
  );

  const handlePointerUp = useCallback(() => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;

    if (currentPoints.length < 2) {
      setCurrentPoints([]);
      return;
    }

    const outlinePoints = getStroke(currentPoints, { ...BASE_OPTIONS, size });
    const path = getSvgPathFromStroke(outlinePoints);

    onStrokesChange([...strokes, { path, color, size }]);
    setCurrentPoints([]);
  }, [currentPoints, strokes, onStrokesChange, color, size]);

  // ── 현재 그리는 중인 스트로크 미리보기 ──

  const currentPath =
    currentPoints.length > 1
      ? getSvgPathFromStroke(getStroke(currentPoints, { ...BASE_OPTIONS, size }))
      : "";

  return (
    <svg
      className="fixed inset-0 z-40"
      style={{
        width: "100vw",
        height: "100vh",
        touchAction: "none",
        userSelect: "none",
        WebkitUserSelect: "none",
        cursor: "crosshair",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* 완료된 스트로크 */}
      {strokes.map((stroke, i) => (
        <path
          key={i}
          d={stroke.path}
          fill={stroke.color}
          stroke="none"
          style={{ pointerEvents: "none" }}
        />
      ))}

      {/* 그리는 중인 스트로크 */}
      {currentPath && (
        <path d={currentPath} fill={color} stroke="none" style={{ pointerEvents: "none" }} />
      )}
    </svg>
  );
}
