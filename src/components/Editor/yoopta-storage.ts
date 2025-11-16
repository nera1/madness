"use client";

import type { YooptaContentValue } from "@yoopta/editor";
import { buildBlockData } from "@yoopta/editor";
import debounce from "lodash/debounce";

const HEADLIE_BLOCK_ID = "headline";

export const createHeadLineBlock = (): YooptaContentValue => {
  return {
    [HEADLIE_BLOCK_ID]: buildBlockData({
      id: HEADLIE_BLOCK_ID,
      value: [
        {
          id: "headline",
          type: "paragraph",
          children: [{ text: "where am I?" }],
        },
      ],
    }),
  };
};
