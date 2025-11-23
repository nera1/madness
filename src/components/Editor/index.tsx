"use client";

import React, { useEffect, useMemo, useState } from "react";

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
import File from "@yoopta/file";
import Callout from "@yoopta/file";
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

const HEADLINE_PLUGINS = [Paragraph, HeadingOne, HeadingTwo, HeadingThree].map(
  (item) => item.extend({ options: { HTMLAttributes: { spellCheck: false } } })
);

const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight];

const BASE_TOOLS: Partial<Tools> = {
  Toolbar: {
    tool: Toolbar,
    render: DefaultToolbarRender,
  },
  LinkTool: {
    tool: LinkTool,
    render: DefaultLinkToolRender,
  },
};

const HEADLINE_BLOCK_ID = "headline";
const BODY_BLOCK_ID = "body-root";

/**
 * 어떤 구조든 간에, 깊게 내려가면서 node.text 들만 전부 이어붙여서 문자열로 만든다.
 */
const collectAllText = (node: unknown): string => {
  if (!node) return "";

  if (Array.isArray(node)) {
    return node.map(collectAllText).join("");
  }

  if (typeof node === "object") {
    let result = "";

    const obj = node as { text?: unknown; [key: string]: unknown };

    if (typeof obj.text === "string") {
      result += obj.text;
    }

    for (const value of Object.values(obj)) {
      result += collectAllText(value);
    }

    return result;
  }

  return "";
};

// YooptaContentValue 전체에서 텍스트만 뽑는 헬퍼 (공백 포함, trim 안 함!)
const getAllText = (value?: YooptaContentValue): string => {
  if (!value) return "";
  const blocks = Object.values(value);
  return collectAllText(blocks);
};

// "리셋 용" - 진짜로 아무 글자도 없을 때만 비었다고 판단 (trim 사용 X)
const isValueReallyEmpty = (value?: YooptaContentValue): boolean => {
  const text = getAllText(value);
  return text.length === 0;
};

/** "초기 상태 Paragraph 블록" - 헤드라인 */
export const createHeadlineValue = (): YooptaContentValue => {
  return {
    [HEADLINE_BLOCK_ID]: buildBlockData({
      id: HEADLINE_BLOCK_ID,
      value: [
        {
          id: `${HEADLINE_BLOCK_ID}-paragraph`,
          type: "Paragraph",
          children: [{ text: "" }],
        },
      ],
    }),
  };
};

/** "초기 상태 Paragraph 블록" - 본문(content) */
export const createBodyValue = (): YooptaContentValue => {
  return {
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
  };
};

const isPristineHeadline = (value?: YooptaContentValue): boolean => {
  if (!value) return false;

  const block = (value as Record<string, unknown>)[HEADLINE_BLOCK_ID] as
    | {
        value?: unknown;
      }
    | undefined;

  if (!block) return false;

  const blockValue = block.value as
    | Array<{
        type?: string;
        children?: Array<{ text?: string }>;
      }>
    | undefined;

  if (!Array.isArray(blockValue) || blockValue.length !== 1) return false;

  const first = blockValue[0];
  if (!first || first.type !== "Paragraph") return false;

  const children = first.children;
  if (!Array.isArray(children) || children.length !== 1) return false;

  const textNode = children[0];
  if (!textNode || typeof textNode.text !== "string") return false;

  // 초기 상태: text === "" 만 허용
  return textNode.text === "";
};

// 🔹 ActionMenu가 열려 있는 동안 open 상태를 알려주는 래퍼 컴포넌트
type ActionMenuWrapperProps = {
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
};

const ActionMenuWrapper: React.FC<ActionMenuWrapperProps> = ({
  onOpenChange,
  children,
}) => {
  useEffect(() => {
    onOpenChange(true); // 마운트 시: 열림
    return () => onOpenChange(false); // 언마운트 시: 닫힘
  }, [onOpenChange]);

  return <>{children}</>;
};

type FocusableEditor = {
  focus: (options?: { at?: "start" | "end" }) => void;
};

export default function NotionLikePage() {
  const headlineEditor = useMemo(() => createYooptaEditor(), []);
  const bodyEditor = useMemo(() => createYooptaEditor(), []);

  const [headlineValue, setHeadlineValue] = useState<YooptaContentValue>(
    createHeadlineValue()
  );
  const [value, setValue] = useState<YooptaContentValue>(createBodyValue());

  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);

  const tools = useMemo<Partial<Tools>>(
    () => ({
      ...BASE_TOOLS,
      ActionMenu: {
        tool: ActionMenu,
        render: (
          props: Parameters<typeof DefaultActionMenuRender>[0]
        ): JSX.Element => (
          <ActionMenuWrapper onOpenChange={setIsActionMenuOpen}>
            <DefaultActionMenuRender {...props} />
          </ActionMenuWrapper>
        ),
      },
    }),
    []
  );

  const handleHeadlineChange = (next: YooptaContentValue) => {
    if (!next || Object.keys(next).length === 0 || isValueReallyEmpty(next)) {
      setHeadlineValue(createHeadlineValue());
      return;
    }

    setHeadlineValue(next);
  };

  const handleBodyChange = (next: YooptaContentValue) => {
    setValue(next);
  };

  return (
    <main className="w-[720px] flex flex-col gap-y-1">
      <div
        className={`${styles["headline-block"]} p-2 rounded-sm`}
        onKeyDownCapture={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            if (isActionMenuOpen) {
              return;
            }

            e.preventDefault();
            e.stopPropagation();
            return;
          }

          if (e.key === "Tab" && !e.shiftKey) {
            e.preventDefault();
            e.stopPropagation();

            const editor = bodyEditor as unknown as FocusableEditor;

            try {
              editor.focus({ at: "end" });
            } catch {
              editor.focus();
            }

            return;
          }

          if (e.key !== "Backspace") return;

          const blocks = Object.values(headlineValue || {});
          if (blocks.length !== 1) return;

          if (isPristineHeadline(headlineValue)) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        <YooptaEditor
          editor={headlineEditor}
          plugins={HEADLINE_PLUGINS as never}
          tools={tools}
          marks={MARKS as never}
          value={headlineValue}
          onChange={handleHeadlineChange}
          placeholder="제목을 입력하세요"
          autoFocus
          className={`${styles["editor"]} ${styles["headline"]} !w-full !pb-0`}
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
          className={`${styles["editor"]} ${styles["content"]} !w-full !pb-8`}
          placeholder="내용을 입력하세요. '/' 를 눌러 블록을 추가할 수 있습니다."
        />
      </div>
    </main>
  );
}
