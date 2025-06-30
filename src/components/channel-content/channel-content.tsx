"use client";

import { FunctionComponent, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { motion } from "framer-motion";

import ChannelHeader from "@/components/channel-header/channel-header";
import { Button } from "../ui/button";

import Spinner from "../ui/spinner";

import MadIcon from "../logo/MadIcon";
import { Sticker } from "lucide-react";

import { checkChannelJoin, refresh } from "@/lib/api";

import styles from "@/styles/channel-content.module.scss";

const ChannelContent: FunctionComponent = () => {
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isJoined, setIsJoined] = useState<boolean | null>(null);

  useEffect(() => {
    const publicId = searchParams.get("c");
    if (!publicId) {
      setIsLoading(false);
      setIsJoined(false);
      return;
    }

    const verifyJoin = async () => {
      setIsLoading(true);
      try {
        // 1차 시도
        await checkChannelJoin(publicId);
        setIsJoined(true);
      } catch (firstErr) {
        try {
          // 실패 시 토큰 리프레시
          await refresh();
          // 2차 시도
          await checkChannelJoin(publicId);
          setIsJoined(true);
        } catch (secondErr) {
          setIsJoined(false);
        }
      } finally {
        setIsLoading(false);
      }
    };

    verifyJoin();
  }, [searchParams]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size={48} />
      </div>
    );
  }

  if (isJoined === false) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <p className="text-lg text-red-500 mb-4">
          채널에 참가할 권한이 없습니다.
        </p>
        <Button onClick={() => window.location.replace("/")}>
          메인으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <>
      <ChannelHeader setMenuOpen={setMenuOpen} />
      <main
        className={`${styles["channel-content"]} flex justify-center`}
        onClick={() => {
          setMenuOpen(false);
        }}
      >
        <div className={styles["container"]}>
          <div className={styles["content"]}>
            <motion.div
              initial={{ clipPath: "inset(0 0 0 100%)" }}
              animate={{
                clipPath: menuOpen ? "inset(0 0 0 0)" : "inset(0 0 0 100%)",
              }}
              transition={{ duration: 0.2 }}
              className={`${styles["chat-menu"]}`}
            ></motion.div>
            <ul
              className={`${styles["chat-list"]} m-0 px-2 py-2 w-full h-full`}
            ></ul>
          </div>
          <div className={`${styles["input-area"]} flex items-center gap-x-2`}>
            <div>
              <Button
                size="icon"
                className={`${styles["sticker-btn"]} hover:bg-neutral-800 size-9 cursor-pointer rounded-full [&_svg]:!h-5 [&_svg]:!w-5`}
              >
                <Sticker />
              </Button>
            </div>
            <textarea
              id="chat-input"
              cols={0}
              className="w-full px-3 pt-1 pb-2 h-9 box-border rounded-md resize-none"
            />
            <div>
              <Button
                size="icon"
                className={`${styles["submit-btn"]} size-9 [&_svg]:!h-6 [&_svg]:!w-6 cursor-pointer`}
              >
                <MadIcon fillColor="#000" bgColor="transparent" />
              </Button>
            </div>
          </div>
        </div>
      </main>
    </>
  );
};

export default ChannelContent;
