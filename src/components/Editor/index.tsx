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
import Code from "@yoopta/code";
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

import styles from "@/styles/editor.module.scss";

const { HeadingOne, HeadingTwo, HeadingThree } = Headings;
const { BulletedList, NumberedList, TodoList } = Lists;

const PLUGINS = [
  Paragraph,
  HeadingOne,
  HeadingTwo,
  HeadingThree,
  BulletedList,
  NumberedList,
  TodoList,
  Blockquote,
  Code,
  Divider,
  Accordion,
  Table,
  Image,
  Video,
  Embed,
  Link,
].map((item) =>
  item.extend({ options: { HTMLAttributes: { spellCheck: false } } })
);

const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight];

const BASE_TOOLS: Partial<Tools> = {
  Toolbar: { tool: Toolbar, render: DefaultToolbarRender },
  LinkTool: { tool: LinkTool, render: DefaultLinkToolRender },
};

const BODY_BLOCK_ID = "body-root";

const createBodyValue = (): YooptaContentValue => ({
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

type HeadlineInputProps = {
  onTab: () => void;
  autoFocus?: boolean;
};

// react-best-practices: memo로 부모 리렌더 시 불필요한 재실행 방지
const HeadlineInput = React.memo(function HeadlineInput({ onTab, autoFocus }: HeadlineInputProps) {
  const elRef = useRef<HTMLElement | null>(null);
  const isComposingRef = useRef(false);
  const levelRef = useRef<HeadingLevel>("p");
  const pendingRef = useRef<{ content: string } | null>(null);

  const [level, setLevel] = useState<HeadingLevel>("p");
  const [isEmpty, setIsEmpty] = useState(true);

  // 콜백 ref — 태그 전환 시에도 안전하게 DOM 노드 참조 유지
  const setElRef = useCallback((node: HTMLElement | null) => {
    elRef.current = node;
  }, []);

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

  useEffect(() => {
    if (autoFocus) elRef.current?.focus();
  }, [autoFocus]);

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
  }, [applyDetection]);

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

export default function NotionLikePage() {
  const bodyEditor = useMemo(() => createYooptaEditor(), []);
  const [value, setValue] = useState<YooptaContentValue>(createBodyValue());

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

  return (
    <main className="w-full max-w-[840px] flex flex-col gap-y-1 mx-auto">
      <div className={`${styles["headline-block"]} p-2 rounded-sm`}>
        <HeadlineInput onTab={focusBodyEditor} autoFocus />
      </div>
      <div className={`${styles["content-block"]} p-2 rounded-sm`}>
        <YooptaEditor
          editor={bodyEditor}
          plugins={PLUGINS as never}
          marks={MARKS as never}
          tools={tools}
          value={value}
          autoFocus={false}
          onChange={(next) => setValue(next)}
          className={`${styles["editor"]} ${styles["content"]} !w-full !pb-6`}
          placeholder="'/' 를 눌러 블록을 추가할 수 있습니다."
        />
      </div>
    </main>
  );
}
