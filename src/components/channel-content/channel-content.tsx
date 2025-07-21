"use client";

import { FunctionComponent, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { motion } from "framer-motion";

import ChannelHeader from "@/components/channel-header/channel-header";
import { Button } from "../ui/button";
import Spinner from "../ui/spinner";

import MadIcon from "../logo/MadIcon";
import { Sticker } from "lucide-react";

import {
  ChannelInfo,
  checkChannelJoin,
  getChannelInfo,
  refresh,
} from "@/lib/api";

import ChannelForbidden from "../channel-forbidden/channel-forbidden";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useClientSeed } from "@/hooks/useClientSeed";

import MessageListItem from "../message-list-item/message-list-item";
import { generateHexColor } from "@/util";

import styles from "@/styles/channel-content.module.scss";

export type JoinError = 401 | 403 | 409 | null;

const ChannelContent: FunctionComponent = () => {
  const searchParams = useSearchParams();
  const publicId = searchParams.get("c") ?? "";
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [channelInfo, setChannelInfo] = useState<ChannelInfo>({
    name: "",
    createdAt: "",
    creatorNickname: "",
    publicId: "",
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [joinError, setJoinError] = useState<JoinError>(null);
  const [inputValue, setInputValue] = useState("");
  const [isExpandedInputArea, setIsExpandedInputArea] =
    useState<boolean>(false);

  const { messages, sendMessage, disconnect } = useChatSocket(publicId);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const chatListRef = useRef<HTMLUListElement>(null);
  const clientSeed = useClientSeed();

  const RESET_HEIGHT = "2.25rem";

  const resetTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = RESET_HEIGHT;
    setIsExpandedInputArea(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const domEvt = e.nativeEvent as KeyboardEvent;

    if (e.key === "Enter" && !e.shiftKey && !domEvt.isComposing) {
      e.preventDefault();
      sendMessage(inputValue.trim(), "CHAT");
      setInputValue("");
      resetTextareaHeight();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = textareaRef.current!;
    const val = e.target.value;
    setInputValue(val);

    const lines = val.split("\n").length;

    if (lines > 1) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
      setIsExpandedInputArea(true);
    } else {
      el.style.height = "2.25rem";
      setIsExpandedInputArea(false);
    }
  };

  useEffect(() => {
    const el = chatListRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (!publicId) {
      setJoinError(403);
      setIsLoading(false);
      return;
    }

    const verifyJoin = async () => {
      try {
        await checkChannelJoin(publicId);
        setJoinError(null);
      } catch (err) {
        if (err instanceof Response) {
          if (err.status === 401) {
            try {
              await refresh();
              setJoinError(null);
            } catch (secondErr) {
              console.error(secondErr);
              setJoinError(401);
            } finally {
              return;
            }
          }
          if (err.status === 403) {
            setJoinError(403);
            return;
          }
        }
        setJoinError(403);
      } finally {
        setIsLoading(false);
      }
    };

    verifyJoin();

    return () => {
      disconnect();
    };
  }, [publicId]);

  useEffect(() => {
    if (!isLoading && joinError === null) {
      getChannelInfo(publicId).then(({ data }) => {
        setChannelInfo(data);
      });
    }
  }, [isLoading, joinError, publicId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      disconnect();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner size={48} />
      </div>
    );
  }

  if (joinError === 401 || joinError === 403) {
    return (
      <ChannelForbidden
        status={joinError}
        publicChannelId={publicId}
        setJoinError={setJoinError}
      />
    );
  }

  return (
    <>
      <ChannelHeader setMenuOpen={setMenuOpen} name={channelInfo.name} />
      <main
        className={`${styles["channel-content"]} flex justify-center`}
        onClick={() => setMenuOpen(false)}
      >
        <div className={styles["container"]}>
          <div
            className={`${styles["content"]} ${
              isExpandedInputArea ? styles["shrink"] : ""
            }`}
          >
            <motion.div
              initial={{ clipPath: "inset(0 0 0 100%)" }}
              animate={{
                clipPath: menuOpen ? "inset(0 0 0 0)" : "inset(0 0 0 100%)",
              }}
              transition={{ duration: 0.2 }}
              className={`${styles["chat-menu"]}`}
            />
            <ul
              className={`${styles["chat-list"]} m-0 py-2 w-full h-full`}
              ref={chatListRef}
            >
              {messages.map((msg, idx) => (
                <MessageListItem
                  {...msg}
                  color={generateHexColor(msg.sender || "", clientSeed)}
                  key={idx}
                />
              ))}
            </ul>
          </div>
          <div
            className={`${styles["input-area"]} ${
              isExpandedInputArea ? styles["expanded"] : ""
            } flex items-end gap-x-2`}
          >
            <Button
              size="icon"
              className={`${styles["sticker-btn"]} hover:bg-neutral-800 size-9 cursor-pointer rounded-full [&_svg]:!h-5 [&_svg]:!w-5`}
            >
              <Sticker />
            </Button>
            <textarea
              ref={textareaRef}
              id="chat-input"
              cols={0}
              className="w-full px-3 box-border rounded-md resize-none leading-9 h-9 max-h-[4.5rem] overflow-y-auto"
              onChange={handleChange}
              value={inputValue}
              onKeyDown={handleKeyDown}
            />
            <Button
              size="icon"
              className={`${styles["submit-btn"]} size-9 [&_svg]:!h-6 [&_svg]:!w-6 cursor-pointer`}
              onClick={() => {
                sendMessage(inputValue, "CHAT");
                setInputValue("");
                resetTextareaHeight();
              }}
            >
              <MadIcon fillColor="#000" bgColor="transparent" />
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

export default ChannelContent;
