"use client";

import type { YooptaContentValue } from "@yoopta/editor";
import { buildBlockData } from "@yoopta/editor";
import debounce from "lodash/debounce";

const STORAGE_KEY = "madness-doc";
const ROOT_BLOCK_ID = "root-block";

export const createDefaultYooptaValue = (): YooptaContentValue => {
  return {
    [ROOT_BLOCK_ID]: buildBlockData({
      id: ROOT_BLOCK_ID,
      value: [
        {
          id: "first",
          type: "heading-one",
          children: [{ text: "" }],
        },
      ],
    }),
  };
};

export const loadYooptaValue = (): YooptaContentValue => {
  if (typeof window === "undefined") {
    return createDefaultYooptaValue();
  }

  return createDefaultYooptaValue();
};

export const saveYooptaValue = (val: YooptaContentValue) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
  } catch (e) {
    console.error("Failed to save yoopta value", e);
  }
};

export const saveYooptaValueDebounced = debounce((val: YooptaContentValue) => {
  saveYooptaValue(val);
}, 800);
