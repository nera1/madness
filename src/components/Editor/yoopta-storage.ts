"use client";

import type { YooptaContentValue } from "@yoopta/editor";
import { buildBlockData } from "@yoopta/editor";
import debounce from "lodash/debounce";

const STORAGE_KEY = "madness-doc";
const ROOT_BLOCK_ID = "root-block"; // ⭐ 루트 블록 고정 ID

// 기본 값 (localStorage에 아무 것도 없을 때)
export const createDefaultYooptaValue = (): YooptaContentValue => {
  return {
    [ROOT_BLOCK_ID]: buildBlockData({ id: ROOT_BLOCK_ID }),
  };
};

// 🔹 불러오기 함수
export const loadYooptaValue = (): YooptaContentValue => {
  if (typeof window === "undefined") {
    // SSR 안전용
    return createDefaultYooptaValue();
  }

  return createDefaultYooptaValue();

  // 나중에 localStorage 다시 켤거면 이 아래 주석 복구
  //
  // const saved = window.localStorage.getItem(STORAGE_KEY);
  // if (!saved) return createDefaultYooptaValue();
  //
  // try {
  //   const parsed = JSON.parse(saved);
  //   return parsed as YooptaContentValue;
  // } catch (e) {
  //   console.error("Failed to parse saved yoopta value", e);
  //   return createDefaultYooptaValue();
  // }
};

// 🔹 바로 저장하는 함수
export const saveYooptaValue = (val: YooptaContentValue) => {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(val));
  } catch (e) {
    console.error("Failed to save yoopta value", e);
  }
};

// 🔹 디바운스 버전 저장 함수 (800ms)
export const saveYooptaValueDebounced = debounce((val: YooptaContentValue) => {
  saveYooptaValue(val);
}, 800);
