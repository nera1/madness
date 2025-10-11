"use client";

import {
  FunctionComponent,
  MouseEventHandler,
  useEffect,
  useRef,
  useState,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";

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
  leaveChannel,
} from "@/lib/api";

import ChannelForbidden from "../channel-forbidden/channel-forbidden";
import { useChatSocket } from "@/hooks/useChatSocket";
import { useClientSeed } from "@/hooks/useClientSeed";

import ChatMenu from "../chat-menu/chat-menu";
import MessageListItem from "../message-list-item/message-list-item";

import { generateHexColor } from "@/util";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import styles from "@/styles/channel-content.module.scss";

export type JoinError = 401 | 403 | 409 | null;
export type Alert = {
  open: boolean;
  title: string;
  description: string;
  submitBtnLabel: string;
  onSubmit: MouseEventHandler<HTMLButtonElement>;
};

const isBlank = (s: string) => !/\S/.test(s);

const ChannelContent: FunctionComponent = () => {
  const searchParams = useSearchParams();
  const publicId = searchParams.get("c") ?? "";
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const [alertState, setAlertState] = useState<Alert>({
    open: false,
    title: "",
    description: "",
    submitBtnLabel: "",
    onSubmit: () => {},
  });
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
  const menuRef = useRef<HTMLDivElement>(null);
  const toggleBtnRef = useRef<HTMLButtonElement>(null);
  const alertRef = useRef<HTMLDivElement>(null);
  const clientSeed = useClientSeed();
  const router = useRouter();

  const RESET_HEIGHT = "2.25rem";

  const clearAlert = () => {
    setAlertState(() => ({
      open: false,
      title: "",
      description: "",
      submitBtnLabel: "",
      onSubmit: () => {},
    }));
  };

  const onClickLeaveChannel = () => {
    setAlertState((prev) => ({
      ...prev,
      title: "채널 나가기",
      description: "채널을 나가시겠습니까?",
      submitBtnLabel: "나가기",
      onSubmit: () => {
        leaveChannel(publicId).then(() => {
          clearAlert();
          disconnect();
          setTimeout(() => {
            router.push("/channel/search");
          }, 10);
        });
      },
    }));
    setTimeout(() => {
      setAlertState((prev) => ({
        ...prev,
        open: true,
      }));
    }, 10);
  };

  const resetTextareaHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = RESET_HEIGHT;
    setIsExpandedInputArea(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const domEvt = e.nativeEvent as KeyboardEvent;

    // Shift+Enter => 줄바꿈 (기본동작 유지)
    if (e.key === "Enter" && e.shiftKey) return;

    // 조합 입력 중이면 전송 막기
    if (domEvt.isComposing) return;

    if (e.key === "Enter") {
      e.preventDefault(); // 기본 개행 막기 (보낼 동작 전용)
      const raw = textareaRef.current?.value ?? "";
      const msg = raw.trim();
      if (isBlank(msg)) return; // 빈 문자열/공백/개행 뿐이면 전송하지 않음

      sendMessage(msg, "CHAT");
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
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const menuEl = menuRef.current;
      const toggleEl = toggleBtnRef.current;
      const alertEl = alertRef.current;

      if (
        (menuEl && menuEl.contains(target)) ||
        (toggleEl && toggleEl.contains(target)) ||
        (alertEl && alertEl.contains(target))
      ) {
        return;
      }

      setAlertState((prev) => ({ ...prev, open: false }));

      setMenuOpen(false);
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("mousedown", handleClickOutside);
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
      <ChannelHeader
        toggleButtonRef={toggleBtnRef}
        setMenuOpen={setMenuOpen}
        name={channelInfo.name}
      />
      <main
        className={`${styles["channel-content"]} flex justify-center`}
        onClick={() => {}}
      >
        <div className={styles["container"]}>
          <div
            className={`${styles["content"]} ${
              isExpandedInputArea ? styles["shrink"] : ""
            }`}
          >
            <motion.div
              ref={menuRef}
              initial={{ clipPath: "inset(0 0 0 100%)" }}
              animate={{
                clipPath: menuOpen ? "inset(0 0 0 0)" : "inset(0 0 0 100%)",
              }}
              transition={{ duration: 0.2 }}
              className={`${styles["chat-menu"]}`}
            >
              <ChatMenu onClickLeaveChannel={onClickLeaveChannel} />
            </motion.div>
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
                const msg = inputValue.trim();
                if (isBlank(msg)) {
                  return;
                }
                sendMessage(msg, "CHAT");
                setInputValue("");
                resetTextareaHeight();
              }}
              disabled={isBlank(inputValue)}
            >
              <MadIcon fillColor="#000" bgColor="transparent" />
            </Button>
          </div>
          <AlertDialog open={alertState.open}>
            <AlertDialogContent
              ref={alertRef}
              className={`${styles["alert"]} dark`}
              onClick={(event) => {
                event.preventDefault();
              }}
            >
              <AlertDialogHeader>
                <AlertDialogTitle className="text-neutral-50">
                  {alertState.title}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {alertState.description}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel
                  className="text-neutral-50 cursor-pointer"
                  onClick={() =>
                    setAlertState((prev) => ({ ...prev, open: false }))
                  }
                >
                  취소
                </AlertDialogCancel>
                <AlertDialogAction
                  className="cursor-pointer"
                  onClick={alertState.onSubmit}
                >
                  {alertState.submitBtnLabel}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </main>
    </>
  );
};

export default ChannelContent;
