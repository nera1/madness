"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Editor, { type EditorSaveData, createBodyValue } from "@/components/Editor";
import VerticalToolbar from "@/components/vertical-toolbar/vertical-toolbar";
import DrawingOverlay, { type Stroke } from "@/components/drawing/drawing-overlay";
import { AuthModal } from "@/components/auth/auth-modal";
import { authFetch } from "@/lib/auth-fetch";
import { useSlideSwipe, useMergedSwipeRef } from "@/lib/use-slide-swipe";
import { Skeleton } from "@/components/ui/skeleton";
import type { YooptaContentValue } from "@yoopta/editor";

// ── 백엔드 응답 타입 ──

type SlideItem = {
  id: string;
  sortOrder: number;
  headline: { text: string; level: string };
  body: YooptaContentValue;
};

type ProjectDetail = {
  id: string;
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // ── 그리기 상태 ──
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState("#ef4444");
  const [drawSize, setDrawSize] = useState(8);
  const [strokes, setStrokes] = useState<Stroke[]>([]);

  // Editor에서 노출하는 save 트리거
  const editorSaveRef = useRef<(() => Promise<void>) | null>(null);

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

        // slideId가 없으면 첫 번째 슬라이드로 redirect (sortOrder 기준)
        if (!cancelled && data.slides.length > 0) {
          const currentSlideParam = new URLSearchParams(window.location.search).get("slide");
          if (!currentSlideParam) {
            const sorted = [...data.slides].sort((a, b) => a.sortOrder - b.sortOrder);
            router.replace(`/projects/${params.id}?slide=${sorted[0].id}`);
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

  // ── sortOrder 기준 정렬된 슬라이드 ──
  const sortedSlides = useMemo(
    () => (project ? [...project.slides].sort((a, b) => a.sortOrder - b.sortOrder) : []),
    [project],
  );

  const currentIndex = sortedSlides.findIndex((s) => s.id === slideId);
  const currentSlide = sortedSlides[currentIndex] ?? sortedSlides[0] ?? null;

  // ── 슬라이드 이동 ──
  const navigateToSlide = useCallback(
    (targetSlideId: string) => {
      setStrokes([]);
      setIsDrawing(false);
      router.replace(`/projects/${params.id}?slide=${targetSlideId}`);
    },
    [router, params.id],
  );

  const handlePrevSlide = useCallback(async () => {
    if (currentIndex <= 0) return;
    await editorSaveRef.current?.();
    navigateToSlide(sortedSlides[currentIndex - 1].id);
  }, [currentIndex, sortedSlides, navigateToSlide]);

  const handleNextSlide = useCallback(async () => {
    if (currentIndex >= sortedSlides.length - 1) return;
    await editorSaveRef.current?.();
    navigateToSlide(sortedSlides[currentIndex + 1].id);
  }, [currentIndex, sortedSlides, navigateToSlide]);

  // ── 모바일 스와이프 슬라이드 전환 ──
  const { handlers: swipeHandlers, contentRef: swipeContentRef } = useSlideSwipe({
    onSwipeLeft: handleNextSlide,
    onSwipeRight: handlePrevSlide,
    canSwipeLeft: currentIndex < sortedSlides.length - 1,
    canSwipeRight: currentIndex > 0,
    enabled: !isDrawing,
  });
  const mergedMainRef = useMergedSwipeRef(mainRef, swipeHandlers.ref);

  // ── 저장 핸들러 (Editor의 onSave 콜백) ──
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSave = useCallback(
    async (data: EditorSaveData) => {
      if (!currentSlide || saveStatus === "saving") return;

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("saving");
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

        // 로컬 상태에 저장된 데이터 반영
        setProject((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            slides: prev.slides.map((s) =>
              s.id === currentSlide.id
                ? { ...s, headline: data.headline, body: data.body }
                : s,
            ),
          };
        });

        setSaveStatus("saved");
        saveTimerRef.current = setTimeout(() => setSaveStatus("idle"), 1500);
      } catch (e) {
        setError(e instanceof Error ? e.message : "저장 실패");
        setSaveStatus("idle");
      }
    },
    [currentSlide, saveStatus],
  );

  // ── VerticalToolbar용 save 트리거 (인자 없이 호출) ──
  const handleToolbarSave = useCallback(() => {
    editorSaveRef.current?.();
  }, []);

  // ── 슬라이드 추가 ──
  const handleAddSlide = useCallback(async () => {
    if (!project) return;

    // 현재 슬라이드 자동 저장
    await editorSaveRef.current?.();

    const maxSortOrder = sortedSlides.length > 0
      ? Math.max(...sortedSlides.map((s) => s.sortOrder))
      : -1;
    const newSortOrder = maxSortOrder + 1;
    const defaultBody = createBodyValue();

    try {
      // TSID 정밀도 유지: projectId를 raw number로 JSON에 직접 삽입
      const bodyPayload = `{"projectId":${project.id},"headline":{"text":"","level":"p"},"body":${JSON.stringify(defaultBody)}}`;

      const res = await authFetch("/api/slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: bodyPayload,
      });
      if (!res.ok) throw new Error("슬라이드 생성에 실패했습니다");

      const json = await res.json();
      const created = json.data;

      const newSlide: SlideItem = {
        id: created.id,
        sortOrder: newSortOrder,
        headline: created.headline,
        body: defaultBody,
      };

      setProject((prev) => {
        if (!prev) return prev;
        return { ...prev, slides: [...prev.slides, newSlide] };
      });

      navigateToSlide(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "슬라이드 생성 실패");
    }
  }, [project, sortedSlides, navigateToSlide]);

  // ── 슬라이드 삭제 ──
  const handleDeleteSlide = useCallback(async () => {
    if (!currentSlide || !project || sortedSlides.length <= 1) return;

    try {
      const res = await authFetch(`/api/slides/${currentSlide.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("슬라이드 삭제에 실패했습니다");

      const deletedIndex = currentIndex;
      const remaining = sortedSlides.filter((s) => s.id !== currentSlide.id);
      const nextSlide = remaining[Math.min(deletedIndex, remaining.length - 1)];

      setProject((prev) => {
        if (!prev) return prev;
        return { ...prev, slides: prev.slides.filter((s) => s.id !== currentSlide.id) };
      });

      navigateToSlide(nextSlide.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "슬라이드 삭제 실패");
    }
  }, [currentSlide, project, sortedSlides, currentIndex, navigateToSlide]);

  // ── 키보드 단축키: ←/→ 슬라이드 이동 (에디터 밖에서만) ──
  useEffect(() => {
    const isEditing = () => {
      const el = document.activeElement;
      if (!el) return false;
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return true;
      if ((el as HTMLElement).isContentEditable) return true;
      // Yoopta 에디터 내부 요소
      if (el.closest("[data-yoopta-editor]")) return true;
      return false;
    };

    const handler = (e: KeyboardEvent) => {
      if (isEditing()) return;

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrevSlide();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleNextSlide();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handlePrevSlide, handleNextSlide]);

  // ── 로딩 / 에러 ──
  if (loading) {
    return (
      <main className="flex min-h-screen w-full items-start sm:items-center justify-center pt-16 pb-28 px-4 sm:pt-24 sm:pb-32 sm:px-8 md:px-12 bg-white dark:bg-black">
        <div className="w-full max-w-[840px] flex flex-col gap-y-4 mx-auto">
          {/* 제목 skeleton */}
          <div className="p-2">
            <Skeleton className="h-11 w-3/5" />
          </div>
          {/* 본문 skeleton */}
          <div className="p-2 flex flex-col gap-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </main>
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
        ref={mergedMainRef}
        className="flex min-h-screen w-full items-start sm:items-center justify-center pt-16 pb-28 px-4 sm:pt-24 sm:pb-32 sm:px-8 md:px-12 bg-white dark:bg-black"
      >
        <VerticalToolbar
          fullscreenTargetRef={mainRef}
          onSave={handleToolbarSave}
          saveStatus={saveStatus}
          onAddSlide={handleAddSlide}
          onDeleteSlide={handleDeleteSlide}
          onPrevSlide={handlePrevSlide}
          onNextSlide={handleNextSlide}
          canPrev={currentIndex > 0}
          canNext={currentIndex < sortedSlides.length - 1}
          canDelete={sortedSlides.length > 1}
          slidePosition={sortedSlides.length > 0 ? `${currentIndex + 1} / ${sortedSlides.length}` : undefined}
          onToggleDrawing={() => setIsDrawing((d) => !d)}
          isDrawing={isDrawing}
          drawColor={drawColor}
          onDrawColorChange={setDrawColor}
          drawSize={drawSize}
          onDrawSizeChange={setDrawSize}
          onUndoStroke={() => setStrokes((prev) => prev.slice(0, -1))}
          onClearDrawing={() => setStrokes([])}
        />

        <div ref={swipeContentRef} className="w-full flex justify-center">
          {currentSlide ? (
            <Editor
              key={currentSlide.id}
              initialHeadline={currentSlide.headline}
              initialBody={currentSlide.body}
              onSave={handleSave}
              saveRef={editorSaveRef}
              autoFocus={false}
              autoSaveMs={1000}
            />
          ) : (
            <p className="text-sm text-muted-foreground">슬라이드가 없습니다</p>
          )}
        </div>

        {isDrawing && (
          <DrawingOverlay
            strokes={strokes}
            onStrokesChange={setStrokes}
            color={drawColor}
            size={drawSize}
          />
        )}
      </main>
    </AuthModal>
  );
}
