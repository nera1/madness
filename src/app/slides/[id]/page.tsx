"use client";

import React from "react";
import { useParams } from "next/navigation";
import Editor from "@/components/Editor";
import VerticalToolbar from "@/components/vertical-toolbar/vertical-toolbar";
import { AuthModal } from "@/components/auth/auth-modal";

export default function SlidePage() {
  const params = useParams<{ id: string }>();
  const mainRef = React.useRef<HTMLElement | null>(null);

  return (
    <AuthModal>
      <AuthModal.Trigger className="fixed top-4 right-4 z-[55]" />
      <AuthModal.Content />

      <main
        ref={mainRef}
        className="flex min-h-screen w-full items-start sm:items-center justify-center pt-16 pb-28 px-4 sm:pt-24 sm:pb-32 sm:px-8 md:px-12 bg-white dark:bg-black"
      >
        <VerticalToolbar fullscreenTargetRef={mainRef} />

        <p className="text-muted-foreground text-sm">
          슬라이드 {params.id} (Editor 연동 준비 중)
        </p>
      </main>
    </AuthModal>
  );
}
