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
import ChannelForbidden from "../channel-forbidden/channel-forbidden";

const ChannelContent: FunctionComponent = () => {
  const searchParams = useSearchParams();
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isJoined, setIsJoined] = useState<boolean>(false);

  useEffect(() => {
    const publicId = searchParams.get("c");
    if (!publicId) {
      setIsLoading(false);
      setIsJoined(false);
      return;
    }

    const verifyJoin = async () => {
      checkChannelJoin(publicId)
        .then(() => {
          setIsJoined(true);
        })
        .catch((firstErr) => {
          if (firstErr instanceof Response) {
            switch (firstErr.status) {
              case 401:
                return refresh().then(() => checkChannelJoin(publicId));
              case 403:
                setIsJoined(false);
                return Promise.reject("NO_PERMISSION");
            }
          }
          return Promise.reject(firstErr);
        })
        .then(() => {
          setIsJoined(true);
        })
        .catch(() => {})
        .finally(() => {
          setIsLoading(false);
        });
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
    return <ChannelForbidden />;
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
