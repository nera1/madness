"use client";

import { FunctionComponent, useEffect } from "react";
import { useSearchParams } from "next/navigation";

import ChannelHeader from "@/components/channel-header/channel-header";
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
          <div className={styles["content"]}></div>
          <div className={`${styles["input-area"]}`}></div>
        </div>
      </main>
    </>
  );
};

export default ChannelContent;
