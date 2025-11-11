"use client";

import React, { useMemo, useState } from "react";

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

const PLUGINS = [
  Paragraph.extend({ options: { HTMLAttributes: { spellCheck: false } } }),
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

export default function YooptaEditorClient() {
  const headlineEditor = useMemo(() => createYooptaEditor(), []);
  const editor = useMemo(() => createYooptaEditor(), []);

  const [headlineValue, setHeadLineValue] = useState<YooptaContentValue>(() => {
    const initial = loadYooptaValue();
    return initial ?? {};
  });
  const [value, setValue] = useState<YooptaContentValue>(() => {
    const initial = loadYooptaValue();
    return initial ?? {};
  });

  return (
    <div className="relative flex w-full justify-center flex-col px-5 py-6">
      <YooptaEditor
        editor={headlineEditor}
        plugins={
          PLUGINS as unknown as YooptaPlugin<Record<string, SlateElement>>[]
        }
        marks={MARKS}
        tools={TOOLS}
        value={headlineValue}
        placeholder="Head"
        onChange={(nextValue) => {
          setHeadLineValue(nextValue);
        }}
        autoFocus
        className="yoopta-editor-headline border !pb-0"
        style={{ width: "640px" }}
      />
      <YooptaEditor
        editor={editor}
        plugins={
          PLUGINS as unknown as YooptaPlugin<Record<string, SlateElement>>[]
        }
        marks={MARKS}
        tools={TOOLS}
        value={value}
        placeholder="Bottom"
        onChange={(nextValue) => {
          setValue(nextValue);
        }}
        autoFocus
        className="yoopta-editor border"
        style={{ width: "640px" }}
      />
    </div>
  );
}
