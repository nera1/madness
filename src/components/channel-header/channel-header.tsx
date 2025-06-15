"use client";

import { FunctionComponent } from "react";

import styles from "@/styles/channel-header.module.scss";

const ChannelHeader: FunctionComponent = () => {
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
