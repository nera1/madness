"use client";

import {
  Dispatch,
  FunctionComponent,
  MouseEventHandler,
  SetStateAction,
  useState,
  useRef,
  useEffect,
  RefObject,
} from "react";

import { useRouter } from "next/navigation";

import { Button } from "../ui/button";

import Spinner from "../ui/spinner";

import { ChevronLeft, Menu } from "lucide-react";

import styles from "@/styles/channel-header.module.scss";

interface ChannelHeaderProps {
  name?: string;
  creator?: string;
  setMenuOpen: Dispatch<SetStateAction<boolean>>;
  toggleButtonRef: RefObject<HTMLButtonElement | null>;
}

const ChannelHeader: FunctionComponent<ChannelHeaderProps> = ({
  setMenuOpen,
  name,
  toggleButtonRef,
}) => {
  const router = useRouter();
  const [isTitleHovered, setIsTitleHovered] = useState<boolean>(false);

  const titleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        titleRef.current &&
        !titleRef.current.contains(event.target as Node)
      ) {
        setIsTitleHovered(false);
      }
    };

    if (isTitleHovered) {
      document.addEventListener("click", handleClickOutside);
    }

    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [isTitleHovered]);

  const toggleChatMenu: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.stopPropagation();
    setMenuOpen((prev) => !prev);
  };

  const goBack: MouseEventHandler<HTMLButtonElement> = () => {
    router.push("/channel/search");
  };

  const onClickTitle: MouseEventHandler<HTMLSpanElement> = () => {
    setIsTitleHovered((prev) => !prev);
  };

  return (
    <header
      className={`${styles["channel-header"]} box-border flex justify-center`}
    >
      <div
        className={`${styles["container"]} h-full flex items-center justify-between`}
      >
        <div className={styles.left}>
          <Button
            className="hover:bg-transparent cursor-pointer"
            size={"icon"}
            variant={"ghost"}
            onClick={goBack}
          >
            <ChevronLeft color="white" />
          </Button>
        </div>

        <div
          className={`${styles.center} flex flex-1 min-w-0 grow justify-center`}
        >
          <div
            ref={titleRef}
            className={`${styles["name"]} flex-1 text-lg font-semibold flex items-center min-w-0 relative text-center`}
          >
            {name ? (
              <>
                <span
                  className="block w-full overflow-hidden whitespace-nowrap text-ellipsis cursor-pointer"
                  onClick={onClickTitle}
                >
                  {name}
                </span>
                {isTitleHovered && (
                  <span
                    className={`${styles["entire-title"]} text-sm rounded-sm absolute left-0 top-[36px] z-99999 bg-neutral-900 whitespace-pre-wrap py-2 px-3`}
                  >
                    {name}
                  </span>
                )}
              </>
            ) : (
              <span className="w-full flex justify-center">
                <Spinner size={18} />
              </span>
            )}
          </div>
        </div>

        <div className={`${styles["right"]} flex justify-end`}>
          <Button
            className="hover:bg-neutral-800 cursor-pointer"
            size={"icon"}
            variant={"ghost"}
            ref={toggleButtonRef}
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
