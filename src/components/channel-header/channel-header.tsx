"use client";

import {
  Dispatch,
  FunctionComponent,
  MouseEventHandler,
  SetStateAction,
} from "react";

import { useRouter } from "next/navigation";

import { Button } from "../ui/button";

import { ChevronLeft, Menu } from "lucide-react";

import Spinner from "../ui/spinner";

//import { truncateWithEllipsis } from "@/util";

import styles from "@/styles/channel-header.module.scss";

interface ChannelHeaderProps {
  name?: string;
  creator?: string;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
}

const ChannelHeader: FunctionComponent<ChannelHeaderProps> = ({
  setMenuOpen,
  name,
}) => {
  const router = useRouter();

  const toggleChatMenu: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const goBack: MouseEventHandler<HTMLButtonElement> = () => {
    router.push("/channel/search");
  };

  return (
    <header
      className={`${styles["channel-header"]} box-border flex justify-center`}
      onClick={() => {
        setMenuOpen(false);
      }}
    >
      <div
        className={`${styles["container"]} h-full flex items-center justify-between
`}
      >
        <div className={`${styles["left"]}`}>
          <Button
            className={`hover:bg-transparent cursor-pointer`}
            size={"icon"}
            variant={"ghost"}
            onClick={goBack}
          >
            <ChevronLeft color="white" />
          </Button>
        </div>
        <div className={`${styles["center"]} flex justify-center`}>
          <div
            className={`${styles["name"]} text-lg font-semibold flex items-center`}
          >
            {name || <Spinner size={18} />}
          </div>
        </div>
        <div className={`${styles["right"]} flex justify-end`}>
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
