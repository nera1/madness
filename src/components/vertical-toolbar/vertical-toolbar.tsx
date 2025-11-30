"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Keyboard, Moon, Sun, Save } from "lucide-react";
import { useTheme } from "next-themes";

const tools = [
  { icon: Save, label: "save" },
  { icon: Keyboard, label: "shortcuts" },
];

const VerticalToolbar = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = resolvedTheme === "dark";

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <TooltipProvider>
      <div
        className="
          fixed inset-y-0 right-0 z-50
          group
        "
      >
        <div
          className="
            relative flex h-full items-center
          "
        >
          <div
            className="
              absolute inset-y-0 right-0
              w-10
            "
          />

          <aside
            role="toolbar"
            aria-label="tools"
            className="
              mr-4
              flex flex-col items-center gap-2
              rounded-sm border bg-background/80 p-2
              shadow-lg backdrop-blur

              translate-x-full opacity-0
              group-hover:translate-x-0 group-hover:opacity-100

              transition-all duration-300 ease-in-out
            "
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="
                    h-9 w-9
                    rounded-lg
                    text-muted-foreground
                    hover:text-foreground
                    hover:bg-accent
                  "
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

            {tools.map((tool) => (
              <Tooltip key={tool.label}>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="
                      h-9 w-9
                      rounded-lg
                      text-muted-foreground
                      hover:text-foreground
                      hover:bg-accent
                    "
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
