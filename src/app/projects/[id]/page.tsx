"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Editor, { type EditorSaveData } from "@/components/Editor";
import VerticalToolbar from "@/components/vertical-toolbar/vertical-toolbar";
import { AuthModal } from "@/components/auth/auth-modal";
import { authFetch } from "@/lib/auth-fetch";
import type { YooptaContentValue } from "@yoopta/editor";

// ── 백엔드 응답 타입 ──

type SlideItem = {
  id: number;
  sortOrder: number;
  headline: { text: string; level: string };
  body: YooptaContentValue;
};

type ProjectDetail = {
  id: number;
  title: string;
  slides: SlideItem[];
  createdAt: string;
  updatedAt: string;
};

// ──────────────────────────────────────────────────────────────────────────────
// ProjectPage
// ──────────────────────────────────────────────────────────────────────────────

export default function ProjectPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const mainRef = useRef<HTMLElement | null>(null);

  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Editor에서 노출하는 save 트리거
  const editorSaveRef = useRef<(() => void) | null>(null);

  const slideId = searchParams.get("slide");

  // ── 프로젝트 데이터 fetch ──
  useEffect(() => {
    if (!params.id) return;

    let cancelled = false;

    async function fetchProject() {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`/api/projects/${params.id}`);
        if (!res.ok) throw new Error("프로젝트를 불러올 수 없습니다");
        const json = await res.json();
        if (cancelled) return;

        const data = json.data as ProjectDetail;
        setProject(data);

        // slideId가 없으면 첫 번째 슬라이드로 redirect
        if (!cancelled && data.slides.length > 0) {
          const currentSlideParam = new URLSearchParams(window.location.search).get("slide");
          if (!currentSlideParam) {
            router.replace(`/projects/${params.id}?slide=${data.slides[0].id}`);
          }
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "알 수 없는 오류");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProject();
    return () => { cancelled = true; };
  }, [params.id, router]);

  // ── 현재 선택된 슬라이드 ──
  const currentSlide = project?.slides.find(
    (s) => String(s.id) === slideId,
  ) ?? project?.slides[0] ?? null;

  // ── 저장 핸들러 (Editor의 onSave 콜백) ──
  const handleSave = useCallback(
    async (data: EditorSaveData) => {
      if (!currentSlide || saving) return;

      setSaving(true);
      try {
        const res = await authFetch(`/api/slides/${currentSlide.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            headline: data.headline,
            body: data.body,
          }),
        });
        if (!res.ok) throw new Error("저장에 실패했습니다");
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장 실패");
      } finally {
        setSaving(false);
      }
    },
    [currentSlide, saving],
  );

  // ── VerticalToolbar용 save 트리거 (인자 없이 호출) ──
  const handleToolbarSave = useCallback(() => {
    editorSaveRef.current?.();
  }, []);

  // ── 로딩 / 에러 ──
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <p className="text-sm text-muted-foreground">불러오는 중…</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black">
        <p className="text-sm text-destructive">{error ?? "프로젝트를 찾을 수 없습니다"}</p>
      </div>
    );
  }

  return (
    <AuthModal>
      <AuthModal.Trigger className="fixed top-4 right-4 z-[55]" />
      <AuthModal.Content />

      <main
        ref={mainRef}
        className="flex min-h-screen w-full items-start sm:items-center justify-center pt-16 pb-28 px-4 sm:pt-24 sm:pb-32 sm:px-8 md:px-12 bg-white dark:bg-black"
      >
        <VerticalToolbar fullscreenTargetRef={mainRef} onSave={handleToolbarSave} />

        {currentSlide ? (
          <Editor
            key={currentSlide.id}
            initialHeadline={currentSlide.headline}
            initialBody={currentSlide.body}
            onSave={handleSave}
            saveRef={editorSaveRef}
          />
        ) : (
          <p className="text-sm text-muted-foreground">슬라이드가 없습니다</p>
        )}
      </main>
    </AuthModal>
  );
}
