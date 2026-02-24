"use client";

import React from "react";
import Editor from "@/components/Editor";
import VerticalToolbar from "@/components/vertical-toolbar/vertical-toolbar";
import { AuthModal } from "@/components/auth/auth-modal";

export default function Home() {
  const mainRef = React.useRef<HTMLElement | null>(null);

  return (
    <AuthModal>
      {/* 우측 상단 단일 계정 버튼 (툴바와 동일한 플로팅 패널 스타일) */}
      <AuthModal.Trigger className="fixed top-4 right-4 z-[55]" />

      {/* 인증 다이얼로그 (Portal → document.body 에 렌더) */}
      <AuthModal.Content />

      {/* 메인 에디터 */}
      <main
        ref={mainRef}
        className="flex min-h-screen w-full items-start sm:items-center justify-center pt-16 pb-28 px-4 sm:pt-24 sm:pb-32 sm:px-8 md:px-12 bg-white dark:bg-black"
      >
        <VerticalToolbar fullscreenTargetRef={mainRef} />
        <Editor />
      </main>
    </AuthModal>
  );
}
