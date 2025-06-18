"use client";

import { FunctionComponent, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import ChannelHeader from "@/components/channel-header/channel-header";
import styles from "@/styles/channel-content.module.scss";
import { Input } from "../ui/input";

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
          <div className={styles["content"]}></div>
          <div className={`${styles["input-area"]} flex items-center`}>
            <Input
              type="text"
              className="focus-visible:ring-0 border-0 rounded-sm rounded-md"
            />
          </div>
        </div>
      </main>
    </>
  );
};

export default ChannelContent;
