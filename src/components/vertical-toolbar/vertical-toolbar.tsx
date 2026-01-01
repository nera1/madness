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

type Props = {
  fullscreenTargetRef: React.RefObject<HTMLElement | null>;
};

const VerticalToolbar = ({ fullscreenTargetRef }: Props) => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  // fullscreen 상태 동기화 (ESC로 빠져나오는 경우 포함)
  React.useEffect(() => {
    if (!mounted) return;

    const onChange = () => {
      const el = fullscreenTargetRef.current;
      const fsEl =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        null;

      setIsFullscreen(!!el && fsEl === el);
    };

    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange as any);

    onChange();
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange as any);
    };
  }, [mounted, fullscreenTargetRef]);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  const enterFullscreen = async () => {
    const el = fullscreenTargetRef.current;
    if (!el) return;

    try {
      if (el.requestFullscreen) await el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen)
        (el as any).webkitRequestFullscreen();
    } catch {
      // 권한/환경에 따라 실패할 수 있음 (사용자 제스처 없을 때 등)
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.exitFullscreen) await document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen)
        (document as any).webkitExitFullscreen();
    } catch {}
  };

  const toggleFullscreen = () => {
    if (isFullscreen) exitFullscreen();
    else enterFullscreen();
  };

  return (
    <TooltipProvider>
      <div className="fixed inset-y-0 right-0 z-50 group">
        <div className="relative flex h-full items-center">
          <div className="absolute inset-y-0 right-0 w-10" />

          <aside
            role="toolbar"
            aria-label="tools"
            className="
              mr-4 flex flex-col items-center gap-2 rounded-sm border bg-background/80 p-2
              shadow-lg backdrop-blur
              translate-x-full opacity-0
              group-hover:translate-x-0 group-hover:opacity-100
              transition-all duration-300 ease-in-out
            "
          >
            {/* Theme */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  {isDark ? (
                    <Sun className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Moon className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="sr-only">테마 토글</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
                {isDark ? "to light" : "to dark"}
              </TooltipContent>
            </Tooltip>

            {/* Fullscreen */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  {isFullscreen ? (
                    <Minimize2 className="h-4 w-4" aria-hidden="true" />
                  ) : (
                    <Maximize2 className="h-4 w-4" aria-hidden="true" />
                  )}
                  <span className="sr-only">전체화면 토글</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="left">
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
                    className="h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent"
                  >
                    <tool.icon className="h-4 w-4" aria-hidden="true" />
                    <span className="sr-only">{tool.label}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="left">{tool.label}</TooltipContent>
              </Tooltip>
            ))}
          </aside>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default VerticalToolbar;
