"use client";

import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

import { FunctionComponent, useEffect, useRef, useState } from "react";
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
} from "@/lib/api";

import ChannelForbidden from "../channel-forbidden/channel-forbidden";

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

  const [messages, setMessages] = useState<any[]>([]);

  const stompClient = useRef<Client | null>(null);

  const [inputValue, setInputValue] = useState("");

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
  }, [publicId]);

  useEffect(() => {
    if (!isLoading && joinError === null) {
      getChannelInfo(publicId).then(({ data }) => {
        setChannelInfo(data);
      });
      const socket = new SockJS("http://localhost:8080/ws/chat");
      const client = new Client({
        webSocketFactory: () => socket,
        reconnectDelay: 5000,
        debug: (msg) => console.log(msg),
      });

      client.onConnect = () => {
        console.log("STOMP 연결 성공");
        stompClient.current = client;

        client.subscribe(`/sub/chat.${publicId}`, (msg) => {
          const body = JSON.parse(msg.body);
          console.log(body);
          setMessages((prev) => [...prev, body]);
        });
      };

      client.activate();

      return () => {
        client.deactivate();
        stompClient.current = null;
      };
    }
  }, [isLoading, joinError, publicId]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      stompClient.current?.deactivate();
      stompClient.current = null;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      stompClient.current?.deactivate();
      stompClient.current = null;
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

  const sendChat = () => {
    console.log(">>> SEND", `/pub/chat.send.${publicId}`, inputValue);
    if (!inputValue.trim() || !stompClient.current) return;
    stompClient.current.publish({
      destination: `/pub/chat.send.${publicId}`,
      body: JSON.stringify({
        type: "CHAT",
        sender: "tester",
        content: inputValue,
        channelId: publicId,
      }),
    });
    setInputValue("");
  };

  return (
    <>
      <ChannelHeader setMenuOpen={setMenuOpen} name={channelInfo.name} />
      <main
        className={`${styles["channel-content"]} flex justify-center`}
        onClick={() => setMenuOpen(false)}
      >
        <div className={styles["container"]}>
          <div className={styles["content"]}>
            <motion.div
              initial={{ clipPath: "inset(0 0 0 100%)" }}
              animate={{
                clipPath: menuOpen ? "inset(0 0 0 0)" : "inset(0 0 0 100%)",
              }}
              transition={{ duration: 0.2 }}
              className={`${styles["chat-menu"]}`}
            />
            <ul
              className={`${styles["chat-list"]} m-0 px-2 py-2 w-full h-full`}
            >
              {messages.map((msg, idx) => (
                <li key={idx} className="py-1 text-white">
                  <strong>{msg.sender}:</strong> {msg.content}
                </li>
              ))}
            </ul>
          </div>
          <div className={`${styles["input-area"]} flex items-center gap-x-2`}>
            <Button
              size="icon"
              className={`${styles["sticker-btn"]} hover:bg-neutral-800 size-9 cursor-pointer rounded-full [&_svg]:!h-5 [&_svg]:!w-5`}
            >
              <Sticker />
            </Button>
            <textarea
              id="chat-input"
              cols={0}
              className="w-full px-3 pt-1 pb-2 h-9 box-border rounded-md resize-none"
              onChange={(e) => setInputValue(e.target.value)}
              value={inputValue}
            />
            <Button
              size="icon"
              className={`${styles["submit-btn"]} size-9 [&_svg]:!h-6 [&_svg]:!w-6 cursor-pointer`}
              onClick={sendChat}
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
