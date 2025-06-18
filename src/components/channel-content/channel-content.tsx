"use client";

import { FunctionComponent, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import ChannelHeader from "@/components/channel-header/channel-header";
import { Button } from "../ui/button";

import MadIcon from "../logo/MadIcon";
import { Sticker } from "lucide-react";

import styles from "@/styles/channel-content.module.scss";

const ChannelContent: FunctionComponent = () => {
  const searchParams = useSearchParams();

  useEffect(() => {
    console.log("c:", searchParams.get("c"));
  }, [searchParams]);

  return (
    <>
      <ChannelHeader />
      <main className={`${styles["channel-content"]} flex justify-center`}>
        <div className={styles["container"]}>
          <div className={styles["content"]}>
            <div className={`${styles["chat-menu"]}`}></div>
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
