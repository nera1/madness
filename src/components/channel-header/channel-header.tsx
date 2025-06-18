"use client";

import { FunctionComponent, MouseEventHandler } from "react";

import { Button } from "../ui/button";

import { ChevronLeft, Menu } from "lucide-react";

import styles from "@/styles/channel-header.module.scss";

interface ChannelHeaderProps {
  name?: string;
  creator?: string;
  toggleChatMenu: MouseEventHandler<HTMLButtonElement>;
}

const ChannelHeader: FunctionComponent<ChannelHeaderProps> = ({
  toggleChatMenu,
}) => {
  return (
    <header
      className={`${styles["channel-header"]} box-border flex justify-center`}
    >
      <div className={`${styles["container"]} h-full flex items-center`}>
        <div className={`${styles["left"]} grow`}>
          <Button
            className={`hover:bg-transparent cursor-pointer`}
            size={"icon"}
            variant={"ghost"}
          >
            <ChevronLeft color="white" />
          </Button>
        </div>
        <div className={`${styles["center"]} grow flex justify-center`}>
          <div className={`${styles["name"]} text-lg font-semibold`}>
            Channel name
          </div>
        </div>
        <div className={`${styles["right"]} grow flex justify-end bg-red`}>
          <Button
            className={`hover:bg-neutral-800 cursor-pointer`}
            size={"icon"}
            variant={"ghost"}
            onClick={toggleChatMenu}
          >
            <Menu color="white" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default ChannelHeader;
