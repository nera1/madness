"use client";

import { useSearchParams } from "next/navigation";
import { FunctionComponent, useEffect } from "react";

import styles from "@/styles/channel-header.module.scss";

const ChannelHeader: FunctionComponent = () => {
  const searchParams = useSearchParams();
  useEffect(() => {
    const value = searchParams.get("c");
    console.log(value);
  }, []);
  return (
    <header
      className={`${styles["channel-header"]} box-border flex justify-center`}
    >
      <div className={`${styles["container"]} h-full flex`}>
        <div className={`${styles["left"]} grow`}></div>
        <div className={`${styles["right"]} grow`}></div>
      </div>
    </header>
  );
};

export default ChannelHeader;
