"use client";

import React, { useEffect, useMemo, useState } from "react";

import YooptaEditor, {
  createYooptaEditor,
  type YooptaContentValue,
  type Tools,
  type YooptaPlugin,
  SlateElement,
} from "@yoopta/editor";

// Plugins
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
import Callout from "@yoopta/callout";
import Video from "@yoopta/video";
import Lists from "@yoopta/lists";
import Headings from "@yoopta/headings";

// Marks (Bold, Italic, ...)
import {
  Bold,
  Italic,
  CodeMark,
  Underline,
  Strike,
  Highlight,
} from "@yoopta/marks";

// Tools (Toolbar, Slash(Action) Menu, Link Tool)
import LinkTool, { DefaultLinkToolRender } from "@yoopta/link-tool";
import ActionMenu, { DefaultActionMenuRender } from "@yoopta/action-menu-list";
import Toolbar, { DefaultToolbarRender } from "@yoopta/toolbar";
import {
  loadYooptaValue,
  saveYooptaValueDebounced,
  createDefaultYooptaValue,
} from "./yoopta-storage";

const { HeadingOne, HeadingTwo, HeadingThree } = Headings;
const { BulletedList, NumberedList, TodoList } = Lists;

// yoopta-storage.ts에서 쓴 것과 같은 root id를 사용
const ROOT_BLOCK_ID = "root-block";

const PLUGINS = [
  Paragraph.extend({
    options: { HTMLAttributes: { spellCheck: false } },
    events: {
      onDestroy: () => {
        console.log("Hello");
        return;
      },
    },
  }),
  HeadingOne.extend({ options: { HTMLAttributes: { spellCheck: false } } }),
  HeadingTwo.extend({ options: { HTMLAttributes: { spellCheck: false } } }),
  HeadingThree.extend({ options: { HTMLAttributes: { spellCheck: false } } }),
  BulletedList.extend({ options: { HTMLAttributes: { spellCheck: false } } }),
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
  File,
  Callout,
];

const MARKS = [Bold, Italic, CodeMark, Underline, Strike, Highlight];

const TOOLS: Partial<Tools> = {
  Toolbar: {
    tool: Toolbar,
    render: DefaultToolbarRender,
  },
  ActionMenu: {
    tool: ActionMenu,
    render: DefaultActionMenuRender,
  },
  LinkTool: {
    tool: LinkTool,
    render: DefaultLinkToolRender,
  },
};

// 🔹 빈 객체인지 판별
const isEmptyObject = (obj: YooptaContentValue | null | undefined): boolean => {
  return !obj || Object.keys(obj).length === 0;
};

// 🔹 특정 block의 텍스트가 전부 비어있는지 검사
const isBlockTextEmpty = (block: any): boolean => {
  if (!block || !Array.isArray(block.value)) return true;

  for (const node of block.value) {
    if (!Array.isArray(node.children)) continue;

    for (const child of node.children) {
      const text = (child.text ?? "").trim();
      if (text.length > 0) {
        return false;
      }
    }
  }

  return true;
};

// 🔹 "루트 블럭 하나 + 루트 블럭 텍스트 전부 비어 있음" 판별 (placeholder 용)
const isOnlyEmptyRootBlock = (value: YooptaContentValue): boolean => {
  if (isEmptyObject(value)) return false;

  const ids = Object.keys(value);
  if (ids.length !== 1 || ids[0] !== ROOT_BLOCK_ID) return false;

  const rootBlock = (value as any)[ROOT_BLOCK_ID];

  return isBlockTextEmpty(rootBlock);
};

// 🔹 항상 ROOT_BLOCK_ID를 가진 블럭이 존재하도록 보정
const ensureRootBlock = (value: YooptaContentValue): YooptaContentValue => {
  // 완전 빈 경우
  if (isEmptyObject(value)) {
    return createDefaultYooptaValue();
  }

  const cloned: any = { ...value };

  if (!cloned[ROOT_BLOCK_ID]) {
    // 루트 블럭이 삭제되었거나 없는 경우 다시 만듦
    cloned[ROOT_BLOCK_ID] = createDefaultYooptaValue()[ROOT_BLOCK_ID];
  }

  return cloned as YooptaContentValue;
};

export default function YooptaEditorClient() {
  const editor = useMemo(() => createYooptaEditor(), []);

  // 🔹 초기 로드 시, 빈 객체면 createDefaultYooptaValue()로 기본 블럭 하나 생성
  const [value, setValue] = useState<YooptaContentValue>(() => {
    const initial = loadYooptaValue();
    const withRoot = ensureRootBlock(
      isEmptyObject(initial) ? createDefaultYooptaValue() : initial
    );
    return withRoot;
  });

  // 🔹 placeholder: 루트 블럭 하나 + 완전 빈 텍스트일 때만 문구 노출
  const placeholder = useMemo(() => {
    return isOnlyEmptyRootBlock(value) ? "여기에 내용을 입력해 주세요..." : "";
  }, [value]);

  const handleChange = (next: YooptaContentValue) => {
    // 1. Yoopta가 완전 빈 객체를 내보내는 경우
    if (isEmptyObject(next)) {
      const def = createDefaultYooptaValue();
      setValue(def);
      // saveYooptaValueDebounced(def);
      return;
    }

    // 2. 항상 ROOT_BLOCK_ID를 가진 블럭이 존재하도록 보정
    const normalized = ensureRootBlock(next);

    setValue(normalized);
    // saveYooptaValueDebounced(normalized);
  };

  return (
    <div className="flex w-full justify-center px-5 py-6">
      <YooptaEditor
        editor={editor}
        plugins={
          PLUGINS as unknown as YooptaPlugin<Record<string, SlateElement>>[]
        }
        onChange={handleChange}
        marks={MARKS}
        tools={TOOLS}
        value={value}
        autoFocus
        placeholder={placeholder}
        className="yoopta-editor prose dark:prose-invert max-w-none"
        style={{ width: "640px" }}
      />
    </div>
  );
}
