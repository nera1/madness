"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FocusScope } from "@radix-ui/react-focus-scope";
import { Layers, Plus, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMounted } from "@/lib/use-is-mounted";
import { authFetch } from "@/lib/auth-fetch";
import { useRouter } from "next/navigation";

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type ProjectItem = {
  id: string;
  title: string;
  slideCount: number;
  createdAt: string;
  updatedAt: string;
};

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// ProjectModal
// ──────────────────────────────────────────────────────────────────────────────

export function ProjectModal({ open, onClose }: ProjectModalProps) {
  const mounted = useIsMounted();
  const router = useRouter();

  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 새 프로젝트 생성 관련
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const newTitleRef = useRef<HTMLInputElement>(null);

  // 삭제 확인 중인 프로젝트 ID
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── 프로젝트 목록 조회 ──
  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/projects");
      if (!res.ok) {
        throw new Error("프로젝트 목록을 불러올 수 없습니다");
      }
      const json = await res.json();
      setProjects(json.data ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "알 수 없는 오류");
    } finally {
      setLoading(false);
    }
  }, []);

  // 모달 열릴 때 목록 조회
  useEffect(() => {
    if (open) {
      fetchProjects();
      setCreating(false);
      setNewTitle("");
      setDeletingId(null);
    }
  }, [open, fetchProjects]);

  // Escape 키
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  // 모달 오픈 시 body 스크롤 잠금
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  // ── 새 프로젝트 만들기 ──
  const handleCreate = useCallback(async () => {
    const title = newTitle.trim();
    if (!title) return;

    try {
      const res = await authFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("프로젝트 생성에 실패했습니다");

      const json = await res.json();
      const created: ProjectItem = json.data;
      setProjects((prev) => [created, ...prev]);
      setCreating(false);
      setNewTitle("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "프로젝트 생성 실패");
    }
  }, [newTitle]);

  // ── 프로젝트 삭제 ──
  const handleDelete = useCallback(async (id: string) => {
    try {
      const res = await authFetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("프로젝트 삭제에 실패했습니다");

      setDeletingId(null);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "프로젝트 삭제 실패");
    }
  }, []);

  // ── 프로젝트 클릭 → 이동 ──
  const handleNavigate = useCallback(
    (id: string) => {
      onClose();
      router.push(`/projects/${id}`);
    },
    [onClose, router],
  );

  // 새 프로젝트 입력 모드 진입 시 포커스
  useEffect(() => {
    if (creating) newTitleRef.current?.focus();
  }, [creating]);

  if (!mounted || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm auth-overlay-in"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* 다이얼로그 */}
      <FocusScope loop trapped>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="project-dialog-title"
          className="relative bg-background border rounded-2xl shadow-2xl px-6 py-5 sm:px-8 sm:py-6 flex flex-col gap-4 auth-modal-in w-[min(480px,calc(100vw-2rem))] max-h-[min(600px,calc(100vh-4rem))]"
        >
          {/* 닫기 버튼 */}
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* 제목 */}
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <h2
              id="project-dialog-title"
              className="text-lg font-semibold leading-none"
            >
              내 프로젝트
            </h2>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p className="text-sm text-destructive text-center">{error}</p>
          )}

          {/* 프로젝트 목록 (스크롤) */}
          <div className="flex-1 overflow-y-auto -mx-2 px-2 min-h-0">
            {loading && (
              <p className="text-sm text-muted-foreground text-center py-8">
                불러오는 중…
              </p>
            )}

            {!loading && projects.length === 0 && (
              <div className="text-center py-8">
                <Layers className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">
                  프로젝트가 없습니다
                </p>
                <p className="text-[12px] text-muted-foreground/60 mt-1">
                  새 프로젝트를 만들어보세요
                </p>
              </div>
            )}

            {!loading && projects.length > 0 && (
              <ul className="space-y-1.5">
                {projects.map((project) => (
                  <li key={project.id}>
                    {/* 삭제 확인 상태 */}
                    {deletingId === project.id ? (
                      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5">
                        <p className="flex-1 text-[13px] text-destructive">
                          삭제하시겠습니까?
                        </p>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="h-7 px-2 text-[12px]"
                          onClick={() => handleDelete(project.id)}
                        >
                          삭제
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[12px]"
                          onClick={() => setDeletingId(null)}
                        >
                          취소
                        </Button>
                      </div>
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleNavigate(project.id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            handleNavigate(project.id);
                          }
                        }}
                        className="w-full text-left flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-accent transition-colors group cursor-pointer"
                      >
                        {/* 프로젝트 정보 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium truncate">
                            {project.title || "제목 없음"}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            슬라이드 {project.slideCount}개
                          </p>
                        </div>

                        {/* 삭제 버튼 (hover 시 표시) */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeletingId(project.id);
                          }}
                          aria-label={`${project.title} 삭제`}
                          className="p-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 하단: 새 프로젝트 만들기 */}
          <div className="border-t pt-3">
            {creating ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCreate();
                }}
                className="flex items-center gap-2"
              >
                <Input
                  ref={newTitleRef}
                  type="text"
                  placeholder="프로젝트 제목"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="sm"
                  disabled={!newTitle.trim()}
                  className="h-9 px-3"
                >
                  만들기
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3"
                  onClick={() => {
                    setCreating(false);
                    setNewTitle("");
                  }}
                >
                  취소
                </Button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-[13px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Plus className="h-4 w-4" />
                새 프로젝트 만들기
              </button>
            )}
          </div>
        </div>
      </FocusScope>
    </div>,
    document.body,
  );
}
