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
import { Keyboard, Moon, Sun, Save, Maximize2, Minimize2 } from "lucide-react";
import { useTheme } from "next-themes";

// ---- webkit 타입 확장 (any 사용 X)
type WebkitFullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type WebkitFullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type Props = {
  fullscreenTargetRef: React.RefObject<HTMLElement | null>;
};

const tools = [
  { icon: Save, label: "저장" },
  { icon: Keyboard, label: "단축키" },
];

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
};

function ToolbarButtons({
  side,
  isDark,
  isFullscreen,
  onToggleTheme,
  onToggleFullscreen,
}: ToolbarButtonsProps) {
  return (
    <>
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

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "전체화면 종료" : "전체화면"}
            className={btnClass}
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

      {tools.map((tool) => (
        <Tooltip key={tool.label}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={tool.label}
              className={btnClass}
            >
              <tool.icon className="h-3.5 w-3.5" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side}>{tool.label}</TooltipContent>
        </Tooltip>
      ))}
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// VerticalToolbar
// ──────────────────────────────────────────────────────────────────────────────

const VerticalToolbar = ({ fullscreenTargetRef }: Props) => {
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
              translate-x-full opacity-0
              group-hover:translate-x-0 group-hover:opacity-100
              transition-[translate,opacity] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
              will-change-[translate,opacity]
            "
          >
            <ToolbarButtons
              side="left"
              isDark={isDark}
              isFullscreen={isFullscreen}
              onToggleTheme={toggleTheme}
              onToggleFullscreen={toggleFullscreen}
            />
          </aside>
        </div>
      </div>

      <div className="sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <aside
          role="toolbar"
          aria-label="도구"
          className="flex flex-row items-center gap-1 rounded-lg border bg-background/80 px-1.5 py-1 shadow-lg backdrop-blur"
        >
          <ToolbarButtons
            side="top"
            isDark={isDark}
            isFullscreen={isFullscreen}
            onToggleTheme={toggleTheme}
            onToggleFullscreen={toggleFullscreen}
          />
        </aside>
      </div>
    </TooltipProvider>
  );
};

export default VerticalToolbar;
