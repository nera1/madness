"use client";

import React from "react";
import Editor from "@/components/Editor";
import VerticalToolbar from "@/components/vertical-toolbar/vertical-toolbar";

export default function Home() {
  const mainRef = React.useRef<HTMLElement | null>(null);

  return (
    <div className="flex min-h-screen items-center justify-center font-sans dark:bg-black">
      <main
        ref={mainRef}
        className="flex min-h-screen w-full items-center justify-center pt-24 pb-32 px-12 bg-white dark:bg-black"
      >
        <VerticalToolbar fullscreenTargetRef={mainRef} />
        <Editor />
      </main>
    </div>
  );
}
