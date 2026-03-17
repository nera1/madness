"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

import YooptaEditor, {
  createYooptaEditor,
  type YooptaContentValue,
  type Tools,
  buildBlockData,
} from "@yoopta/editor";

import Paragraph from "@yoopta/paragraph";
import Blockquote from "@yoopta/blockquote";
import Accordion from "@yoopta/accordion";
import Divider from "@yoopta/divider";
import Table from "@yoopta/table";
import CustomCode from "./plugins/custom-code";
import MermaidDiagram from "./plugins/mermaid-diagram";
import Embed from "@yoopta/embed";
import Image from "@yoopta/image";
import Link from "@yoopta/link";
import Video from "@yoopta/video";
import Lists from "@yoopta/lists";
import Headings from "@yoopta/headings";

import {
  Bold,
  Italic,
  CodeMark,
  Underline,
  Strike,
  Highlight,
} from "@yoopta/marks";

import LinkTool, { DefaultLinkToolRender } from "@yoopta/link-tool";
import ActionMenu, { DefaultActionMenuRender } from "@yoopta/action-menu-list";
import Toolbar, { DefaultToolbarRender } from "@yoopta/toolbar";

import { Node, Transforms, Editor as SlateEditor } from "slate";
import styles from "@/styles/editor.module.scss";
import { authFetch } from "@/lib/auth-fetch";

const { HeadingOne, HeadingTwo, HeadingThree } = Headings;
const { BulletedList, NumberedList, TodoList } = Lists;

const PLUGINS = [
  // Paragraph: ``` 입력 시 즉시 코드 블록으로 전환 (스페이스 불필요)
  Paragraph.extend({
    events: {
      onKeyDown: (editor, slate) => (e) => {
        if (e.key !== "`") return;
        try {
          const text = Node.string(slate);
          if (text === "``") {
            e.preventDefault();
            // Clear the `` text before toggling
            Transforms.select(slate, SlateEditor.range(slate, []));
            Transforms.delete(slate);
            editor.toggleBlock("Code");
          }
        } catch { /* noop */ }
      },
    },
  }),
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  BulletedList,
  NumberedList,
  TodoList,
  Blockquote,
  CustomCode,
  MermaidDiagram,
  Divider,
  Accordion,
  Table,
  Image.extend({
    options: {
      onUpload: async (file: File) => {
        const form = new FormData();
        form.append("file", file);
        const res = await authFetch("/api/images", { method: "POST", body: form });
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error?.message ?? "Upload failed");
        return { src: json.data.url, alt: json.data.fileName };
      },
    },
  }),
  Video,
  Embed,
  Link,
].map((item) =>
  item.extend({ options: { HTMLAttributes: { spellCheck: false } } })
);

/** YooptaContentValue에서 모든 이미지 src URL을 추출 */
function extractImageSrcs(content: YooptaContentValue): Set<string> {
  const srcs = new Set<string>();
  for (const block of Object.values(content)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const b = block as any;
    if (b?.type !== "Image") continue;
    const src = b?.value?.[0]?.props?.src;
    if (typeof src === "string") srcs.add(src);
  }
  return srcs;
}

/** 이미지 URL에서 R2 object key 추출 (예: "images/uuid.webp") */
function objectKeyFromSrc(src: string): string | null {
  try {
    const path = new URL(src).pathname;
    return path.startsWith("/") ? path.slice(1) : path;
  } catch {
    return null;
  }
}

/** 삭제된 이미지를 R2에서 정리 (fire-and-forget) */
function cleanupRemovedImages(oldSrcs: Set<string>, newSrcs: Set<string>) {
  for (const src of oldSrcs) {
    if (newSrcs.has(src)) continue;
    const key = objectKeyFromSrc(src);
    if (!key) continue;
    authFetch(`/api/images/by-key?objectKey=${encodeURIComponent(key)}`, { method: "DELETE" }).catch(() => {});
  }
}

const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight];

const BASE_TOOLS: Partial<Tools> = {
  Toolbar: { tool: Toolbar, render: DefaultToolbarRender },
  LinkTool: { tool: LinkTool, render: DefaultLinkToolRender },
};

const BODY_BLOCK_ID = "body-root";

export const createBodyValue = (): YooptaContentValue => ({
  [BODY_BLOCK_ID]: buildBlockData({
    id: BODY_BLOCK_ID,
    value: [
      {
        id: `${BODY_BLOCK_ID}-paragraph`,
        type: "Paragraph",
        children: [{ text: "" }],
      },
    ],
  }),
});

// ──────────────────────────────────────────────────────────────────────────────
// HeadlineInput
// "# " / "## " / "### " 입력 시 실제 h1/h2/h3 시맨틱 태그로 전환하는
// contentEditable 제목 입력 컴포넌트 (Yoopta 바디 에디터와 동일한 동작)
// ──────────────────────────────────────────────────────────────────────────────

type HeadingLevel = "h1" | "h2" | "h3" | "p";

// editor.module.scss 헤딩 폰트 크기 (--yoopta-font-scale: 1.125 적용값)
const HEADING_CLASS: Record<HeadingLevel, string> = {
  h1: "text-[2.7rem] font-bold leading-[1.2]",
  h2: "text-[2.25rem] font-bold leading-[1.25]",
  h3: "text-[1.8rem] font-semibold leading-[1.3]",
  p: "text-[1.125rem] leading-[1.6]",
};

const PLACEHOLDER_TEXT: Record<HeadingLevel, string> = {
  h1: "제목 1",
  h2: "제목 2",
  h3: "제목 3",
  p: "제목을 입력하세요",
};

function detectPrefix(text: string): { level: HeadingLevel; prefix: string } {
  if (text.startsWith("### ")) return { level: "h3", prefix: "### " };
  if (text.startsWith("## ")) return { level: "h2", prefix: "## " };
  if (text.startsWith("# ")) return { level: "h1", prefix: "# " };
  return { level: "p", prefix: "" };
}

function moveCursorToEnd(el: HTMLElement) {
  const range = document.createRange();
  const sel = window.getSelection();
  range.selectNodeContents(el);
  range.collapse(false);
  sel?.removeAllRanges();
  sel?.addRange(range);
}

/** 외부에서 headline 현재 상태를 읽기 위한 ref 타입 */
export type HeadlineHandle = {
  getText: () => string;
  getLevel: () => HeadingLevel;
};

type HeadlineInputProps = {
  onTab: () => void;
  autoFocus?: boolean;
  initialText?: string;
  initialLevel?: HeadingLevel;
  headlineRef?: React.RefObject<HeadlineHandle | null>;
  /** 제목 내용이 변경될 때 호출 (자동 저장 타이머 리셋용) */
  onChange?: () => void;
};

// react-best-practices: memo로 부모 리렌더 시 불필요한 재실행 방지
const HeadlineInput = React.memo(function HeadlineInput({
  onTab,
  autoFocus,
  initialText,
  initialLevel,
  headlineRef,
  onChange,
}: HeadlineInputProps) {
  const elRef = useRef<HTMLElement | null>(null);
  const isComposingRef = useRef(false);
  const levelRef = useRef<HeadingLevel>(initialLevel ?? "p");
  const pendingRef = useRef<{ content: string } | null>(null);

  const [level, setLevel] = useState<HeadingLevel>(initialLevel ?? "p");
  const [isEmpty, setIsEmpty] = useState(!(initialText && initialText.length > 0));

  // 콜백 ref — 태그 전환 시에도 안전하게 DOM 노드 참조 유지
  const setElRef = useCallback((node: HTMLElement | null) => {
    elRef.current = node;
  }, []);

  // 외부에서 현재 headline 상태를 읽을 수 있도록 ref 노출
  useEffect(() => {
    if (!headlineRef) return;
    (headlineRef as React.MutableRefObject<HeadlineHandle | null>).current = {
      getText: () => (elRef.current?.textContent ?? "").replace(/\u00A0/g, " ").replace(/\n$/, ""),
      getLevel: () => levelRef.current,
    };
  }, [headlineRef]);

  // 태그 전환 후 (level 변경) 콘텐츠 복원 및 포커스 이동
  useEffect(() => {
    const el = elRef.current;
    if (!el || pendingRef.current === null) return;

    const { content } = pendingRef.current;
    el.textContent = content;
    el.focus();
    if (content.length > 0) moveCursorToEnd(el);
    pendingRef.current = null;
  }, [level]);

  // 초기값 세팅
  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    if (initialText) {
      el.textContent = initialText;
      setIsEmpty(false);
    }
    if (autoFocus) el.focus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // react-best-practices: ref 기반 비교로 의존성 배열 비움 → 안정적 참조
  const applyDetection = useCallback(() => {
    // IME 조합 중에는 실행하지 않음 (한국어/일본어 등 입력 버그 방지)
    if (isComposingRef.current) return;

    const el = elRef.current;
    if (!el) return;

    // contentEditable은 후행 공백을 &nbsp;(\u00A0)로 삽입하므로
    // 일반 공백으로 정규화해야 "# " 접두사를 즉시 감지할 수 있음
    const raw = (el.textContent ?? "").replace(/\u00A0/g, " ");
    const text = raw.endsWith("\n") ? raw.slice(0, -1) : raw;

    setIsEmpty(text.length === 0);

    const { level: newLevel, prefix } = detectPrefix(text);
    if (prefix) {
      const clean = text.slice(prefix.length);
      setIsEmpty(clean.length === 0);

      if (newLevel !== levelRef.current) {
        // 태그가 바뀌므로 콘텐츠를 ref에 저장 → useEffect에서 복원
        pendingRef.current = { content: clean };
        levelRef.current = newLevel;
        setLevel(newLevel);
      } else {
        // 같은 레벨 → DOM에서 직접 접두사 제거
        el.textContent = clean;
        moveCursorToEnd(el);
      }
    }
  }, []);

  const handleInput = useCallback(() => {
    if (!isComposingRef.current) applyDetection();
    onChange?.();
  }, [applyDetection, onChange]);

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    applyDetection();
  }, [applyDetection]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLElement>) => {
      // 줄바꿈 금지
      if (e.key === "Enter") {
        e.preventDefault();
        return;
      }

      // Tab → 본문 에디터로 포커스 이동
      if (e.key === "Tab" && !e.shiftKey) {
        e.preventDefault();
        onTab();
        return;
      }

      // 내용이 비어 있을 때 Backspace → 헤딩 레벨 초기화
      if (e.key === "Backspace" && levelRef.current !== "p") {
        const text = (elRef.current?.textContent ?? "").replace(/\n/g, "");
        if (text.length === 0) {
          pendingRef.current = { content: "" };
          levelRef.current = "p";
          setLevel("p");
        }
      }
    },
    [onTab],
  );

  // 붙여넣기 시 줄바꿈 제거 후 plain text로만 삽입
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLElement>) => {
      e.preventDefault();
      const plain = e.clipboardData
        .getData("text/plain")
        .replace(/[\n\r]+/g, " ");
      const sel = window.getSelection();
      if (!sel?.rangeCount) return;
      const range = sel.getRangeAt(0);
      range.deleteContents();
      range.insertNode(document.createTextNode(plain));
      range.collapse(false);
      setTimeout(applyDetection, 0);
    },
    [applyDetection],
  );

  // Yoopta 바디와 동일하게 실제 시맨틱 태그 사용 (h1/h2/h3/div)
  const Tag = level === "p" ? "div" : level;

  return (
    <div className="relative w-full">
      {isEmpty && (
        <div
          aria-hidden="true"
          className={`absolute inset-0 pl-[2px] pointer-events-none select-none text-muted-foreground ${HEADING_CLASS[level]}`}
        >
          {PLACEHOLDER_TEXT[level]}
        </div>
      )}
      <Tag
        ref={setElRef}
        role="textbox"
        aria-label="제목"
        aria-multiline="false"
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onCompositionStart={handleCompositionStart}
        onCompositionEnd={handleCompositionEnd}
        className={`outline-none w-full break-words pl-[2px] m-0 ${HEADING_CLASS[level]}`}
      />
    </div>
  );
});

// ──────────────────────────────────────────────────────────────────────────────
// Editor
// ──────────────────────────────────────────────────────────────────────────────

type FocusableEditor = {
  focus: (options?: { at?: "start" | "end" }) => void;
};

export type EditorSaveData = {
  headline: { text: string; level: string };
  body: YooptaContentValue;
};

type EditorProps = {
  initialHeadline?: { text: string; level: string };
  initialBody?: YooptaContentValue;
  onSave?: (data: EditorSaveData) => void | Promise<void>;
  /** 부모에서 save를 트리거할 수 있는 ref (VerticalToolbar 연동용) */
  saveRef?: React.RefObject<(() => Promise<void>) | null>;
  /** 마운트 시 제목에 자동 포커스 (기본: true) */
  autoFocus?: boolean;
  /** 자동 저장 딜레이 (ms). 미설정 시 자동 저장 비활성 */
  autoSaveMs?: number;
};

export default function Editor({ initialHeadline, initialBody, onSave, saveRef, autoFocus = true, autoSaveMs }: EditorProps = {}) {
  const bodyEditor = useMemo(() => createYooptaEditor(), []);
  const [value, setValue] = useState<YooptaContentValue>(initialBody ?? createBodyValue());
  const headlineRef = useRef<HeadlineHandle | null>(null);
  const valueRef = useRef(value);
  useEffect(() => { valueRef.current = value; }, [value]);

  // ── 자동 저장: 변경 감지 카운터 ──
  const [changeCount, setChangeCount] = useState(0);

  const handleBodyChange = useCallback((next: YooptaContentValue) => {
    const oldSrcs = extractImageSrcs(valueRef.current);
    const newSrcs = extractImageSrcs(next);
    if (oldSrcs.size > 0) cleanupRemovedImages(oldSrcs, newSrcs);
    setValue(next);
    if (autoSaveMs) setChangeCount((c) => c + 1);
  }, [autoSaveMs]);

  const handleHeadlineChange = useCallback(() => {
    if (autoSaveMs) setChangeCount((c) => c + 1);
  }, [autoSaveMs]);

  const tools = useMemo<Partial<Tools>>(
    () => ({
      ...BASE_TOOLS,
      ActionMenu: {
        tool: ActionMenu,
        render: DefaultActionMenuRender,
      },
    }),
    []
  );

  const focusBodyEditor = useCallback(() => {
    const editor = bodyEditor as unknown as FocusableEditor;
    try {
      editor.focus({ at: "end" });
    } catch {
      editor.focus();
    }
  }, [bodyEditor]);

  // Ctrl+S / Cmd+S → onSave 호출
  const onSaveRef = useRef(onSave);
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        const saveFn = onSaveRef.current;
        if (!saveFn) return;
        const h = headlineRef.current;
        saveFn({
          headline: {
            text: h?.getText() ?? "",
            level: h?.getLevel() ?? "p",
          },
          body: valueRef.current,
        });
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // VerticalToolbar의 onSave 호출 시 사용할 핸들러를 노출
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    const h = headlineRef.current;
    await onSave({
      headline: {
        text: h?.getText() ?? "",
        level: h?.getLevel() ?? "p",
      },
      body: valueRef.current,
    });
  }, [onSave]);

  // 부모에서 save를 트리거할 수 있도록 ref에 노출
  useEffect(() => {
    if (saveRef) {
      (saveRef as React.MutableRefObject<(() => Promise<void>) | null>).current = handleSave;
    }
  }, [saveRef, handleSave]);

  // ── 자동 저장: changeCount가 변경되면 debounce 후 저장 ──
  useEffect(() => {
    if (!autoSaveMs || changeCount === 0) return;

    const timer = setTimeout(() => {
      const saveFn = onSaveRef.current;
      if (!saveFn) return;
      const h = headlineRef.current;
      saveFn({
        headline: { text: h?.getText() ?? "", level: h?.getLevel() ?? "p" },
        body: valueRef.current,
      });
    }, autoSaveMs);

    return () => clearTimeout(timer);
  }, [changeCount, autoSaveMs]);

  return (
    <main className="w-full max-w-[840px] flex flex-col gap-y-1 mx-auto">
      <div className={`${styles["headline-block"]} p-2 rounded-sm`}>
        <HeadlineInput
          onTab={focusBodyEditor}
          autoFocus={autoFocus}
          initialText={initialHeadline?.text}
          initialLevel={initialHeadline?.level as HeadingLevel | undefined}
          headlineRef={headlineRef}
          onChange={handleHeadlineChange}
        />
      </div>
      <div className={`${styles["content-block"]} p-2 rounded-sm`}>
        <YooptaEditor
          editor={bodyEditor}
          plugins={PLUGINS as never}
          marks={MARKS as never}
          tools={tools}
          value={value}
          autoFocus={false}
          onChange={handleBodyChange}
          className={`${styles["editor"]} ${styles["content"]} !w-full !pb-6`}
          placeholder="'/' 를 눌러 블록을 추가할 수 있습니다."
        />
      </div>
    </main>
  );
}

// handleSave를 외부에서 호출할 수 있도록 export
export { type HeadingLevel };
