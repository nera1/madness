"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Keyboard, Moon, Sun, Save, Maximize2, Minimize2 } from "lucide-react";
import { useTheme } from "next-themes";

const tools = [
  { icon: Save, label: "save" },
  { icon: Keyboard, label: "shortcuts" },
];

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

const VerticalToolbar = ({ fullscreenTargetRef }: Props) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  React.useEffect(() => {
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

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const enterFullscreen = async () => {
    const el = fullscreenTargetRef.current as WebkitFullscreenElement | null;
    if (!el) return;

    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
    } catch {}
  };

  const exitFullscreen = async () => {
    const doc = document as WebkitFullscreenDocument;

    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if (doc.webkitExitFullscreen) await doc.webkitExitFullscreen();
    } catch {}
  };

  const toggleFullscreen = () => {
    if (isFullscreen) void exitFullscreen();
    else void enterFullscreen();
  };

  const btnClass =
    "h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent";

  const renderButtons = (side: "left" | "top") => (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className={btnClass}
          >
            {isDark ? (
              <Sun className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="sr-only">테마 토글</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>
          {isDark ? "to light" : "to dark"}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className={btnClass}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
            )}
            <span className="sr-only">전체화면 토글</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>
          {isFullscreen ? "exit fullscreen" : "fullscreen"}
        </TooltipContent>
      </Tooltip>

      {tools.map((tool) => (
        <Tooltip key={tool.label}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={btnClass}
            >
              <tool.icon className="h-4 w-4" aria-hidden="true" />
              <span className="sr-only">{tool.label}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side={side}>{tool.label}</TooltipContent>
        </Tooltip>
      ))}
    </>
  );

  return (
    <TooltipProvider>
      <div className="hidden sm:block fixed inset-y-0 right-0 z-50 group">
        <div className="relative flex h-full items-center">
          <div className="absolute inset-y-0 right-0 w-10" />

          <aside
            role="toolbar"
            aria-label="tools"
            className="
              mr-4 flex flex-col items-center gap-2 rounded-xl border bg-background/80 p-2
              shadow-lg backdrop-blur
              translate-x-full opacity-0
              group-hover:translate-x-0 group-hover:opacity-100
              transition-all duration-300 ease-in-out
            "
          >
            {renderButtons("left")}
          </aside>
        </div>
      </div>

      <div className="sm:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <aside
          role="toolbar"
          aria-label="tools"
          className="flex flex-row items-center gap-1 rounded-xl border bg-background/80 px-2 py-1.5 shadow-lg backdrop-blur"
        >
          {renderButtons("top")}
        </aside>
      </div>
    </TooltipProvider>
  );
};

export default VerticalToolbar;
