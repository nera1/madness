"use client";

import React, { useCallback, useState } from "react";
import Editor from "@/components/Editor";
import VerticalToolbar from "@/components/vertical-toolbar/vertical-toolbar";
import DrawingOverlay, { type Stroke } from "@/components/drawing/drawing-overlay";
import { AuthModal } from "@/components/auth/auth-modal";

export default function Home() {
  const mainRef = React.useRef<HTMLElement | null>(null);

  // ── 그리기 상태 ──
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [drawSize, setDrawSize] = useState(8);
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  const toggleDrawing = useCallback(() => setIsDrawing((v) => !v), []);
  const undoStroke = useCallback(() => setStrokes((s) => s.slice(0, -1)), []);
  const clearDrawing = useCallback(() => {
    setStrokes([]);
    setIsDrawing(false);
  }, []);

  return (
    <AuthModal>
      {/* 우측 상단 단일 계정 버튼 (툴바와 동일한 플로팅 패널 스타일) */}
      <AuthModal.Trigger className="fixed top-4 right-4 z-[55]" />

      {/* 인증 다이얼로그 (Portal → document.body 에 렌더) */}
      <AuthModal.Content />

      {/* 그리기 오버레이 */}
      {isDrawing && (
        <DrawingOverlay
          strokes={strokes}
          onStrokesChange={setStrokes}
          color={drawColor}
          size={drawSize}
        />
      )}

      {/* 메인 에디터 */}
      <main
        ref={mainRef}
        className="flex min-h-screen w-full items-start sm:items-center justify-center pt-16 pb-28 px-4 sm:pt-24 sm:pb-32 sm:px-8 md:px-12 bg-white dark:bg-black"
      >
        <VerticalToolbar
          fullscreenTargetRef={mainRef}
          onToggleDrawing={toggleDrawing}
          isDrawing={isDrawing}
          drawColor={drawColor}
          onDrawColorChange={setDrawColor}
          drawSize={drawSize}
          onDrawSizeChange={setDrawSize}
          onUndoStroke={undoStroke}
          onClearDrawing={clearDrawing}
        />
        <Editor />
      </main>
    </AuthModal>
  );
}
