"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  YooptaPlugin,
  useBlockData,
  useYooptaEditor,
  useYooptaReadOnly,
  Blocks,
  type SlateElement,
  type PluginCustomEditorRenderProps,
} from "@yoopta/editor";
import mermaid from "mermaid";

import styles from "./mermaid-diagram.module.scss";

// ──── Types ────────────────────────────────────────────────────────────

type MermaidElementProps = { code?: string };
type MermaidElement = SlateElement<"mermaid", MermaidElementProps>;
type MermaidElementMap = { mermaid: MermaidElement };

const DEFAULT_CODE = `sequenceDiagram
    Alice->>Bob: Hello Bob
    Bob-->>Alice: Hi Alice`;

// ──── Icon (ActionMenu 용) ─────────────────────────────────────────────

function MermaidIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={24}
      height={24}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 3v12" />
      <path d="M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M15 6a9 9 0 0 0-9 9" />
      <path d="M18 15v6" />
      <path d="M21 18h-6" />
    </svg>
  );
}

// ──── 툴바 아이콘 ──────────────────────────────────────────────────────

/** 코드 보기 (</> 아이콘) */
function CodeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

/** 프리뷰만 (눈 아이콘) */
function EyeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

// ──── Mermaid 초기화 ───────────────────────────────────────────────────

let mermaidInited = false;

function initMermaid() {
  if (mermaidInited) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "default",
    securityLevel: "loose",
    fontFamily: "inherit",
  });
  mermaidInited = true;
}

// ──── MermaidEditor ────────────────────────────────────────────────────

function MermaidEditor({ blockId }: PluginCustomEditorRenderProps) {
  const yooEditor = useYooptaEditor();
  const blockData = useBlockData(blockId);
  const readOnly = useYooptaReadOnly();

  const element = blockData.value[0] as unknown as MermaidElement | undefined;
  const savedCode = element?.props?.code ?? DEFAULT_CODE;

  const [code, setCode] = useState(savedCode);
  const [svgHtml, setSvgHtml] = useState("");
  const [error, setError] = useState("");
  const [showCode, setShowCode] = useState(!readOnly);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const renderIdRef = useRef(0);
  const isSyncingRef = useRef(false);

  // Mermaid 렌더링
  const renderDiagram = useCallback(async (src: string) => {
    initMermaid();
    const renderId = ++renderIdRef.current;
    const id = `mermaid-${blockId}-${renderId}`;

    try {
      const { svg } = await mermaid.render(id, src);
      if (renderId !== renderIdRef.current) return; // 이전 요청 무시
      setSvgHtml(svg);
      setError("");
    } catch (err) {
      if (renderId !== renderIdRef.current) return;
      setSvgHtml("");
      setError(err instanceof Error ? err.message : "렌더링 실패");
      // mermaid가 렌더링 실패 시 DOM에 남기는 요소 정리
      document.getElementById(id)?.remove();
    }
  }, [blockId]);

  // 초기 렌더링
  useEffect(() => {
    void renderDiagram(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Yoopta 외부 변경(undo 등) → 동기화
  useEffect(() => {
    const yooptaCode = element?.props?.code ?? DEFAULT_CODE;
    if (isSyncingRef.current) return;
    if (yooptaCode !== code) {
      setCode(yooptaCode);
      void renderDiagram(yooptaCode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [element?.props?.code]);

  // 코드 변경 → 디바운스 렌더링 + Yoopta 저장
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCodeChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newCode = e.target.value;
      setCode(newCode);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        void renderDiagram(newCode);
      }, 400);

      // Yoopta에 저장
      isSyncingRef.current = true;
      const currentEl = yooEditor.children[blockId]?.value?.[0];
      Blocks.updateBlock(yooEditor, blockId, {
        value: [
          {
            ...(currentEl ?? { id: blockId + "-mermaid", type: "mermaid" }),
            props: { code: newCode },
            children: [{ text: "" }],
          },
        ],
      });
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 0);
    },
    [yooEditor, blockId, renderDiagram],
  );

  // 키보드 핸들링
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = ta.value;
        ta.value = val.substring(0, start) + "    " + val.substring(end);
        ta.selectionStart = ta.selectionEnd = start + 4;
        ta.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }
      if (e.key === "Backspace" && code === "") {
        e.preventDefault();
        Blocks.deleteBlock(yooEditor, { blockId });
      }
    },
    [yooEditor, blockId, code],
  );

  // 읽기 전용 → 프리뷰만
  if (readOnly) {
    return (
      <div className={styles.previewOnly} data-yoopta-block-id={blockId}>
        {svgHtml ? (
          <div
            className={styles.preview}
            dangerouslySetInnerHTML={{ __html: svgHtml }}
          />
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={styles.wrapper} data-yoopta-block-id={blockId}>
      {/* 툴바 */}
      <div className={styles.toolbar} contentEditable={false}>
        <span className={styles.toolbarLabel}>mermaid</span>
        <button
          type="button"
          className={`${styles.iconBtn} ${showCode ? styles.iconBtnActive : ""}`}
          onClick={() => setShowCode((v) => !v)}
          aria-label={showCode ? "프리뷰만 보기" : "코드 보기"}
        >
          {showCode ? <EyeIcon /> : <CodeIcon />}
          <span className={styles.tooltip}>
            {showCode ? "프리뷰만" : "코드 보기"}
          </span>
        </button>
      </div>

      {/* 코드 편집 */}
      {showCode && (
        <textarea
          ref={textareaRef}
          className={styles.codeArea}
          value={code}
          onChange={handleCodeChange}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          placeholder="sequenceDiagram..."
        />
      )}

      {/* 프리뷰 */}
      {svgHtml ? (
        <div
          className={styles.preview}
          contentEditable={false}
          dangerouslySetInnerHTML={{ __html: svgHtml }}
        />
      ) : error ? (
        <div className={styles.error} contentEditable={false}>
          {error}
        </div>
      ) : null}
    </div>
  );
}

// ──── Plugin ───────────────────────────────────────────────────────────

const MermaidDiagram = new YooptaPlugin<MermaidElementMap>({
  type: "Mermaid",
  customEditor: MermaidEditor,
  elements: {
    mermaid: {
      render: () => <></>,
      props: {
        code: DEFAULT_CODE,
      },
    },
  },
  options: {
    display: {
      title: "Mermaid",
      description: "다이어그램",
      icon: <MermaidIcon />,
    },
    shortcuts: ["mermaid"],
  },
  parsers: {
    html: {
      deserialize: {
        nodeNames: ["DIV"],
        parse: (el: HTMLElement) => {
          if (!el.classList.contains("mermaid")) return undefined as never;
          return {
            id: "",
            type: "mermaid",
            children: [{ text: "" }],
            props: { code: el.textContent || DEFAULT_CODE },
          } as unknown as SlateElement;
        },
      },
      serialize: (element: SlateElement) => {
        const code =
          (element.props as MermaidElementProps)?.code || DEFAULT_CODE;
        const escaped = code
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return `<div class="mermaid">${escaped}</div>`;
      },
    },
    markdown: {
      serialize: (element: SlateElement) => {
        const code =
          (element.props as MermaidElementProps)?.code || DEFAULT_CODE;
        return `\`\`\`mermaid\n${code}\n\`\`\``;
      },
    },
  },
});

export default MermaidDiagram;
