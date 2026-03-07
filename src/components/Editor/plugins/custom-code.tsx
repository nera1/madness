"use client";

import React, { useMemo, useCallback, useRef, useState, useEffect } from "react";
import {
  YooptaPlugin,
  useBlockData,
  useYooptaEditor,
  useYooptaReadOnly,
  Blocks,
  type SlateElement,
  type PluginCustomEditorRenderProps,
} from "@yoopta/editor";
import { createEditor, type Text, Node, type BaseRange, type Descendant } from "slate";
import { Slate, Editable, withReact, type RenderLeafProps } from "slate-react";
import hljs from "highlight.js/lib/core";

// 필요한 언어만 등록 (번들 최소화)
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import java from "highlight.js/lib/languages/java";
import kotlin from "highlight.js/lib/languages/kotlin";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import sql from "highlight.js/lib/languages/sql";
import go from "highlight.js/lib/languages/go";
import rust from "highlight.js/lib/languages/rust";
import cpp from "highlight.js/lib/languages/cpp";
import csharp from "highlight.js/lib/languages/csharp";
import php from "highlight.js/lib/languages/php";
import ruby from "highlight.js/lib/languages/ruby";
import yaml from "highlight.js/lib/languages/yaml";
import markdown from "highlight.js/lib/languages/markdown";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("java", java);
hljs.registerLanguage("kotlin", kotlin);
hljs.registerLanguage("css", css);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("go", go);
hljs.registerLanguage("rust", rust);
hljs.registerLanguage("cpp", cpp);
hljs.registerLanguage("csharp", csharp);
hljs.registerLanguage("php", php);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("markdown", markdown);

import styles from "./custom-code.module.scss";

// ──── Types ────────────────────────────────────────────────────────────

type CodeElementProps = { language?: string };
type CodeElement = SlateElement<"code", CodeElementProps>;
type CodeElementMap = { code: CodeElement };

type TokenLeaf = { tokenType?: string };

// ──── hljs scope → GitHub .pl-* 매핑 ──────────────────────────────────

const SCOPE_TO_PL: Record<string, string> = {
  keyword: "pl-k",
  "keyword.operator": "pl-k",
  built_in: "pl-bu",
  type: "pl-smi",
  literal: "pl-c1",
  number: "pl-c1",
  string: "pl-s",
  "string.template": "pl-s",
  subst: "pl-smi",
  regexp: "pl-sr",
  symbol: "pl-c1",
  class: "pl-v",
  function: "pl-en",
  "title.function": "pl-en",
  "title.class": "pl-v",
  "title.class.inherited": "pl-v",
  title: "pl-en",
  params: "pl-smi",
  comment: "pl-c",
  doctag: "pl-c",
  meta: "pl-mh",
  "meta keyword": "pl-mh",
  "meta string": "pl-s",
  section: "pl-en",
  tag: "pl-ent",
  name: "pl-ent",
  attr: "pl-e",
  attribute: "pl-e",
  variable: "pl-v",
  "variable.language": "pl-smw",
  "variable.constant": "pl-c1",
  bullet: "pl-ba",
  code: "pl-c1",
  emphasis: "pl-mi",
  strong: "pl-mb",
  formula: "pl-c1",
  link: "pl-corl",
  quote: "pl-ba",
  addition: "pl-mi1",
  deletion: "pl-md",
  "selector-tag": "pl-ent",
  "selector-id": "pl-e",
  "selector-class": "pl-e",
  "selector-attr": "pl-e",
  "selector-pseudo": "pl-e",
  "template-tag": "pl-k",
  "template-variable": "pl-v",
  property: "pl-smi",
  operator: "pl-k",
  punctuation: "pl-smi",
};

function mapScope(scope: string): string | undefined {
  if (SCOPE_TO_PL[scope]) return SCOPE_TO_PL[scope];
  // "title.function.invoke" → "title.function" → "title"
  const parts = scope.split(".");
  for (let i = parts.length - 1; i > 0; i--) {
    const partial = parts.slice(0, i).join(".");
    if (SCOPE_TO_PL[partial]) return SCOPE_TO_PL[partial];
  }
  if (SCOPE_TO_PL[parts[0]]) return SCOPE_TO_PL[parts[0]];
  return undefined;
}

// ──── hljs 토큰 트리 → flat 토큰 리스트 ──────────────────────────────

type FlatToken = { text: string; className: string | undefined };

interface HljsTreeNode {
  scope?: string;
  children?: (string | HljsTreeNode)[];
}

function flattenTokens(node: HljsTreeNode, parentClass?: string): FlatToken[] {
  const tokens: FlatToken[] = [];
  const cls = node.scope ? mapScope(node.scope) ?? parentClass : parentClass;
  if (!node.children) return tokens;
  for (const child of node.children) {
    if (typeof child === "string") {
      if (child.length > 0) tokens.push({ text: child, className: cls });
    } else {
      tokens.push(...flattenTokens(child, cls));
    }
  }
  return tokens;
}

// ──── decorate 함수 ───────────────────────────────────────────────────
// element 레벨(path.length === 1)에서 호출, 내부 텍스트 노드 기준 range 생성

function getDecorationsForElement(
  elementPath: number[],
  text: string,
  language: string,
): (BaseRange & TokenLeaf)[] {
  const ranges: (BaseRange & TokenLeaf)[] = [];
  if (!text) return ranges;

  let result;
  try {
    result = hljs.highlight(text, { language, ignoreIllegals: true });
  } catch {
    return ranges;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rootNode = (result as any)._emitter?.rootNode as HljsTreeNode | undefined;
  if (!rootNode) return ranges;

  const tokens = flattenTokens(rootNode);
  const textPath = [...elementPath, 0]; // text node는 element의 첫 번째 자식
  const textLength = text.length;

  let offset = 0;
  for (const token of tokens) {
    const start = offset;
    const end = start + token.text.length;
    offset = end;

    if (!token.className) continue;
    // 방어: offset이 텍스트 길이를 초과하면 중단
    if (end > textLength) break;

    ranges.push({
      anchor: { path: textPath, offset: start },
      focus: { path: textPath, offset: end },
      tokenType: token.className,
    });
  }

  return ranges;
}

// ──── renderLeaf ──────────────────────────────────────────────────────

function CodeLeaf({ attributes, children, leaf }: RenderLeafProps & { leaf: TokenLeaf & Text }) {
  if (leaf.tokenType) {
    return <span {...attributes} className={leaf.tokenType}>{children}</span>;
  }
  return <span {...attributes}>{children}</span>;
}

// ──── Icons ────────────────────────────────────────────────────────────

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z" />
      <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
      <path d="M13.78 4.22a.75.75 0 0 1 0 1.06l-7.25 7.25a.75.75 0 0 1-1.06 0L2.22 9.28a.751.751 0 0 1 .018-1.042.751.751 0 0 1 1.042-.018L6 10.94l6.72-6.72a.75.75 0 0 1 1.06 0Z" />
    </svg>
  );
}

// ──── CustomCodeEditor ────────────────────────────────────────────────

function CustomCodeEditor({ blockId }: PluginCustomEditorRenderProps) {
  const yooEditor = useYooptaEditor();
  const blockData = useBlockData(blockId);
  const readOnly = useYooptaReadOnly();
  const [copied, setCopied] = useState(false);
  const [syncKey, setSyncKey] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isSyncingRef = useRef(false);

  const slateEditor = useMemo(() => withReact(createEditor()), []);

  // Yoopta 블록에서 초기값 추출
  const element = blockData.value[0] as unknown as CodeElement | undefined;
  const language = element?.props?.language || "javascript";

  // 초기 텍스트 추출 + Slate children 세팅
  const initialText = useMemo(() => {
    const children = element?.children as unknown as { text?: string }[] | undefined;
    const text = children?.map((c) => c.text ?? "").join("") ?? "";
    slateEditor.children = [{ type: "paragraph", children: [{ text }] }] as unknown as Descendant[];
    return text;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const prevTextRef = useRef<string>(initialText);

  // Yoopta 외부 변경(undo 등) → Slate 동기화
  // onChange() 대신 key 변경으로 Slate을 클린 리마운트 (DOM point 불일치 방지)
  useEffect(() => {
    const children = element?.children as unknown as { text?: string }[] | undefined;
    const yooptaText = children?.map((c) => c.text ?? "").join("") ?? "";
    if (isSyncingRef.current) return;
    if (yooptaText !== prevTextRef.current) {
      prevTextRef.current = yooptaText;
      slateEditor.selection = null;
      slateEditor.children = [{ type: "paragraph", children: [{ text: yooptaText }] }] as unknown as Descendant[];
      setSyncKey((k) => k + 1);
    }
  }, [element?.children, slateEditor]);

  // Slate onChange → Yoopta 동기화 (Blocks.updateBlock 사용)
  const handleChange = useCallback(() => {
    // 여러 paragraph 노드가 있을 경우 \n 으로 결합
    const text = slateEditor.children.map((n) => Node.string(n)).join("\n");
    if (text === prevTextRef.current) return;
    prevTextRef.current = text;
    isSyncingRef.current = true;

    const currentEl = yooEditor.children[blockId]?.value?.[0];
    Blocks.updateBlock(yooEditor, blockId, {
      value: [{
        ...(currentEl ?? { id: blockId + "-code", type: "code", props: { language: "javascript" } }),
        children: [{ text }],
      }],
    });

    // 다음 틱에 sync 플래그 해제
    setTimeout(() => { isSyncingRef.current = false; }, 0);
  }, [yooEditor, blockId, slateEditor]);

  // decorate — element 레벨(path.length === 1)에서만 decoration 생성
  const decorate = useCallback(
    ([node, path]: [Node, number[]]) => {
      if (path.length === 1) {
        try {
          return getDecorationsForElement(path, Node.string(node), language);
        } catch {
          return [];
        }
      }
      return [];
    },
    [language],
  );

  // 키보드 핸들링
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Enter → 새 paragraph 대신 \n 삽입 (soft break)
      if (e.key === "Enter") {
        e.preventDefault();
        slateEditor.insertText("\n");
        return;
      }
      if (e.key === "Tab") {
        e.preventDefault();
        slateEditor.insertText("  ");
        return;
      }
      if (e.key === "Backspace") {
        const text = slateEditor.children.map((n) => Node.string(n)).join("\n");
        if (text === "") {
          e.preventDefault();
          Blocks.deleteBlock(yooEditor, { blockId });
          return;
        }
      }
    },
    [slateEditor, yooEditor, blockId],
  );

  // 복사
  const handleCopy = useCallback(() => {
    const text = Node.string(slateEditor);
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [slateEditor]);

  return (
    <div ref={wrapperRef} className={styles.codeWrapper} data-yoopta-block-id={blockId}>
      <div className={styles.codeBlock}>
        <Slate key={syncKey} editor={slateEditor} initialValue={slateEditor.children} onChange={handleChange}>
          <Editable
            className={styles.editable}
            decorate={decorate}
            renderLeaf={CodeLeaf as unknown as (props: RenderLeafProps) => React.JSX.Element}
            onKeyDown={handleKeyDown}
            readOnly={readOnly}
            spellCheck={false}
            autoCorrect="off"
            autoCapitalize="off"
          />
        </Slate>
      </div>
      <button
        type="button"
        contentEditable={false}
        className={styles.copyBtn}
        onClick={handleCopy}
        title="복사"
      >
        {copied ? <CheckIcon /> : <CopyIcon />}
      </button>
    </div>
  );
}

// ──── Plugin ───────────────────────────────────────────────────────────

const CustomCode = new YooptaPlugin<CodeElementMap>({
  type: "Code",
  customEditor: CustomCodeEditor,
  elements: {
    code: {
      render: () => <></>,
      props: {
        language: "javascript",
      },
    },
  },
  options: {
    display: {
      title: "Code",
      description: "코드 블록",
    },
    shortcuts: ["```"],
  },
  parsers: {
    html: {
      deserialize: {
        nodeNames: ["PRE"],
        parse: (el: HTMLElement) => {
          const code = el.querySelector("code");
          const text = code?.textContent || el.textContent || "";
          const langClass = code?.className?.match(/language-(\w+)/)?.[1];
          return {
            id: "",
            type: "code",
            children: [{ text }],
            props: {
              language: langClass || "javascript",
            },
          } as unknown as SlateElement;
        },
      },
      serialize: (element: SlateElement, content: string) => {
        const lang =
          (element.props as CodeElementProps)?.language || "javascript";
        const escaped = content
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return `<pre><code class="language-${lang}">${escaped}</code></pre>`;
      },
    },
    markdown: {
      serialize: (element: SlateElement, content: string) => {
        const lang =
          (element.props as CodeElementProps)?.language || "javascript";
        return `\`\`\`${lang}\n${content}\n\`\`\``;
      },
    },
  },
});

export default CustomCode;
