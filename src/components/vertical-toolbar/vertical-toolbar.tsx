"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useIsMounted } from "@/lib/use-is-mounted";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Moon,
  Sun,
  Save,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  Plus,
  Trash2,
  Loader2,
  Check,
  Pen,
  Undo2,
  RotateCcw,
  EraserIcon,
} from "lucide-react";
import { useTheme } from "next-themes";

// ---- webkit 타입 확장 (any 사용 X)
type WebkitFullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type SaveStatus = "idle" | "saving" | "saved";

// ── 그리기 컨트롤 상수 ──

const DRAW_SIZES = [
  { size: 4, label: "S" },
  { size: 8, label: "M" },
  { size: 16, label: "L" },
];

type Props = {
  fullscreenTargetRef: React.RefObject<HTMLElement | null>;
  onSave?: () => void;
  saveStatus?: SaveStatus;
  onAddSlide?: () => void;
  onDeleteSlide?: () => void;
  onPrevSlide?: () => void;
  onNextSlide?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  canDelete?: boolean;
  slidePosition?: string; // e.g. "2 / 5"
  // ── 그리기 ──
  onToggleDrawing?: () => void;
  isDrawing?: boolean;
  drawColor?: string;
  onDrawColorChange?: (color: string) => void;
  drawSize?: number;
  onDrawSizeChange?: (size: number) => void;
  onUndoStroke?: () => void;
  onClearDrawing?: () => void;
};

const btnClass =
  "h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent";

// ──────────────────────────────────────────────────────────────────────────────
// ToolbarButtons (composition-patterns: renderX prop → 독립 컴포넌트)
// ──────────────────────────────────────────────────────────────────────────────

type ToolbarButtonsProps = {
  side: "left" | "top";
  isDark: boolean;
  isFullscreen: boolean;
  onToggleTheme: () => void;
  onToggleFullscreen: () => void;
  onSave?: () => void;
  saveStatus?: SaveStatus;
  onAddSlide?: () => void;
  onDeleteSlide?: () => void;
  onPrevSlide?: () => void;
  onNextSlide?: () => void;
  canPrev?: boolean;
  canNext?: boolean;
  canDelete?: boolean;
  slidePosition?: string;
  // ── 그리기 ──
  onToggleDrawing?: () => void;
  isDrawing?: boolean;
  drawColor?: string;
  onDrawColorChange?: (color: string) => void;
  drawSize?: number;
  onDrawSizeChange?: (size: number) => void;
  onUndoStroke?: () => void;
  onClearDrawing?: () => void;
};

function ToolbarButtons({
  side,
  isDark,
  isFullscreen,
  onToggleTheme,
  onToggleFullscreen,
  onSave,
  saveStatus = "idle",
  onAddSlide,
  onDeleteSlide,
  onPrevSlide,
  onNextSlide,
  canPrev,
  canNext,
  canDelete,
  slidePosition,
  onToggleDrawing,
  isDrawing,
  drawColor,
  onDrawColorChange,
  drawSize,
  onDrawSizeChange,
  onUndoStroke,
  onClearDrawing,
}: ToolbarButtonsProps) {
  const isVertical = side === "left";
  const separator = isVertical ? (
    <div className="w-full border-t border-border/50 my-0.5" />
  ) : (
    <div className="h-full border-l border-border/50 mx-0.5" />
  );

  return (
    <>
      {/* 테마 전환 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            aria-label={isDark ? "라이트 모드로 전환" : "다크 모드로 전환"}
            className={btnClass}
          >
            {isDark ? (
              <Sun className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Moon className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>
          {isDark ? "라이트 모드" : "다크 모드"}
        </TooltipContent>
      </Tooltip>

      {/* 전체화면 – 작은 화면에서는 숨김 */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "전체화면 종료" : "전체화면"}
            className={`${btnClass} hidden sm:inline-flex`}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>
          {isFullscreen ? "전체화면 종료" : "전체화면"}
        </TooltipContent>
      </Tooltip>

      {/* ── 슬라이드 이동 ── */}
      {onPrevSlide && (
        <>
          {separator}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onPrevSlide}
                disabled={!canPrev}
                aria-label="이전 슬라이드 (Alt+←)"
                className={btnClass}
              >
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>이전 슬라이드</TooltipContent>
          </Tooltip>

          {slidePosition && (
            <span className="text-[10px] text-muted-foreground select-none tabular-nums text-center leading-none py-0.5">
              {slidePosition}
            </span>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onNextSlide}
                disabled={!canNext}
                aria-label="다음 슬라이드 (Alt+→)"
                className={btnClass}
              >
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>다음 슬라이드</TooltipContent>
          </Tooltip>
        </>
      )}

      {/* ── 슬라이드 추가/삭제 ── */}
      {onAddSlide && (
        <>
          {separator}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onAddSlide}
                aria-label="새 슬라이드"
                className={btnClass}
              >
                <Plus className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>새 슬라이드</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDeleteSlide}
                disabled={!canDelete}
                aria-label="슬라이드 삭제"
                className={btnClass}
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>슬라이드 삭제</TooltipContent>
          </Tooltip>
        </>
      )}

      {/* ── 그리기 (데스크톱 전용) ── */}
      {onToggleDrawing && isVertical && (
        <>
          {separator}

          {/* 펜 토글 */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggleDrawing}
                aria-label={isDrawing ? "그리기 종료" : "그리기"}
                className={`${btnClass} ${isDrawing ? "text-blue-500 hover:text-blue-500 bg-accent" : ""}`}
              >
                <Pen className="h-3.5 w-3.5" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>
              {isDrawing ? "그리기 종료" : "그리기"}
            </TooltipContent>
          </Tooltip>

          {/* 그리기 모드 ON일 때만 컨트롤 표시 */}
          {isDrawing && (
            <>
              {separator}

              {/* 색상 선택 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <label
                    className="relative flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent cursor-pointer"
                    aria-label="색상 선택"
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-border"
                      style={{ backgroundColor: drawColor }}
                    />
                    <input
                      type="color"
                      value={drawColor}
                      onChange={(e) => onDrawColorChange?.(e.target.value)}
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                      tabIndex={-1}
                    />
                  </label>
                </TooltipTrigger>
                <TooltipContent side={side}>색상 선택</TooltipContent>
              </Tooltip>

              {separator}

              {/* 굵기 프리셋 */}
              {DRAW_SIZES.map((ds) => (
                <Tooltip key={ds.size}>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => onDrawSizeChange?.(ds.size)}
                      aria-label={`굵기 ${ds.label}`}
                      className={`h-7 w-7 rounded-md text-[10px] font-bold ${
                        drawSize === ds.size
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      }`}
                    >
                      {ds.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side={side}>굵기 {ds.label}</TooltipContent>
                </Tooltip>
              ))}

              {separator}

              {/* 되돌리기 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onUndoStroke}
                    aria-label="되돌리기"
                    className={btnClass}
                  >
                    <Undo2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={side}>되돌리기</TooltipContent>
              </Tooltip>

              {/* 전체 지우기 */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={onClearDrawing}
                    aria-label="전체 지우기"
                    className={btnClass}
                  >
                    <EraserIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side={side}>전체 지우기</TooltipContent>
              </Tooltip>
            </>
          )}
        </>
      )}

      {/* ── 저장 ── */}
      {onSave && (
        <>
          {separator}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onSave}
                disabled={saveStatus === "saving"}
                aria-label="저장"
                className={`${btnClass} ${saveStatus === "saved" ? "text-green-500 hover:text-green-500" : ""}`}
              >
                {saveStatus === "saving" ? (
                  <Loader2
                    className="h-3.5 w-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : saveStatus === "saved" ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>
              {saveStatus === "saving"
                ? "저장 중…"
                : saveStatus === "saved"
                  ? "저장됨"
                  : "저장"}
            </TooltipContent>
          </Tooltip>
        </>
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// VerticalToolbar
// ──────────────────────────────────────────────────────────────────────────────

const VerticalToolbar = ({
  fullscreenTargetRef,
  onSave,
  saveStatus,
  onAddSlide,
  onDeleteSlide,
  onPrevSlide,
  onNextSlide,
  canPrev,
  canNext,
  canDelete,
  slidePosition,
  onToggleDrawing,
  isDrawing,
  drawColor,
  onDrawColorChange,
  drawSize,
  onDrawSizeChange,
  onUndoStroke,
  onClearDrawing,
}: Props) => {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useIsMounted();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!mounted) return;

    const doc = document as WebkitFullscreenDocument;

    const onChange = () => {
      const el = fullscreenTargetRef.current;
      const fsEl =
        document.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
      setIsFullscreen(!!el && fsEl === el);
    };

    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener(
      "webkitfullscreenchange",
      onChange as unknown as EventListener,
    );

    onChange();
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        onChange as unknown as EventListener,
      );
    };
  }, [mounted, fullscreenTargetRef]);

  // react-best-practices: useCallback으로 안정적인 핸들러 참조 유지
  const enterFullscreen = useCallback(async () => {
    const el = fullscreenTargetRef.current as WebkitFullscreenElement | null;
    if (!el) return;
    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {}
  }, [fullscreenTargetRef]);

  const exitFullscreen = useCallback(async () => {
    const doc = document as WebkitFullscreenDocument;
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    } catch {}
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) void exitFullscreen();
    else void enterFullscreen();
  }, [isFullscreen, exitFullscreen, enterFullscreen]);

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  const toolbarButtonProps = {
    isDark,
    isFullscreen,
    onToggleTheme: toggleTheme,
    onToggleFullscreen: toggleFullscreen,
    onSave,
    saveStatus,
    onAddSlide,
    onDeleteSlide,
    onPrevSlide,
    onNextSlide,
    canPrev,
    canNext,
    canDelete,
    slidePosition,
    onToggleDrawing,
    isDrawing,
    drawColor,
    onDrawColorChange,
    drawSize,
    onDrawSizeChange,
    onUndoStroke,
    onClearDrawing,
  };

  return (
    <TooltipProvider>
      <div className="hidden sm:block fixed inset-y-0 right-0 z-50 group">
        <div className="relative flex h-full items-center">
          <div className="absolute inset-y-0 right-0 w-14" />

          <aside
            role="toolbar"
            aria-label="도구"
            className="
              mr-3 flex flex-col items-center gap-1.5 rounded-lg border bg-background/80 p-1.5
              shadow-lg backdrop-blur
              translate-x-full opacity-0 group-hover:translate-x-0 group-hover:opacity-100
              transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
              will-change-[translate,opacity]
            "
          >
            <ToolbarButtons side="left" {...toolbarButtonProps} />
          </aside>
        </div>
      </div>

      <div className="sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <aside
          role="toolbar"
          aria-label="도구"
          className="flex flex-row items-center gap-1 rounded-lg border bg-background/80 px-1.5 py-1 shadow-lg backdrop-blur"
        >
          <ToolbarButtons side="top" {...toolbarButtonProps} />
        </aside>
      </div>
    </TooltipProvider>
  );
};

export default VerticalToolbar;
