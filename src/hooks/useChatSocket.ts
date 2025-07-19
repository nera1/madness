import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, StompSubscription, IMessage } from "@stomp/stompjs";
import { secureRandomString } from "@/util/index";
import { refresh } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.madn.es";
const WS_URL = `${API_BASE.replace(/\/$/, "")}/ws/chat`;

export interface ChatMessage {
  type: string;
  sender?: string;
  content: string;
  channelId: string;
}

const randId = secureRandomString(6);
const MAX_WINDOW = 30;
const subscribeTopic = (publicId: string) => `/sub/chat.${publicId}`;
const subscribeId = (publicId: string) => `sub-${publicId}-${randId}`;
const publishTopic = (publicId: string) => `/pub/chat.send.${publicId}`;

export function useChatSocket(publicId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<StompSubscription[]>([]);
  const pendingRef = useRef<ChatMessage | null>(null);
  const prevRef = useRef<string>("");

  useEffect(() => {
    if (!publicId) return;

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(WS_URL, undefined, { transports: ["websocket"] }),
      reconnectDelay: 5_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      debug: (msg) => console.debug("[STOMP]", msg),
    });

    client.onConnect = () => {
      setConnected(true);

      subsRef.current.forEach((s) => s.unsubscribe());
      subsRef.current = [];

      const sub = client.subscribe(
        subscribeTopic(publicId),
        (msg: IMessage) => {
          const body = JSON.parse(msg.body) as ChatMessage;
          setMessages((prev) => {
            const next = [...prev, body];
            return next.length > MAX_WINDOW ? next.slice(-MAX_WINDOW) : next;
          });
        },
        { id: subscribeId(publicId) }
      );
      subsRef.current.push(sub);

      if (pendingRef.current) {
        client.publish({
          destination: publishTopic(publicId),
          body: JSON.stringify(pendingRef.current),
        });
        pendingRef.current = null;
      }
    };

    client.onStompError = async (frame) => {
      if (frame.headers["message"] === "401") {
        await refresh();
        client.deactivate();
        client.activate();
      }
    };

    client.onWebSocketClose = () => {
      console.warn("WebSocket closed");
      setConnected(false);
    };
    client.onWebSocketError = () => {
      console.error("WebSocket error");
      setConnected(false);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      subsRef.current.forEach((s) => s.unsubscribe());
      client.deactivate();
    };
  }, [publicId]);

  const sendMessage = (content: string, type = "CHAT") => {
    const payload: ChatMessage = {
      type,
      sender: "",
      content,
      channelId: publicId,
    };
    prevRef.current = content;

    if (clientRef.current?.connected) {
      clientRef.current.publish({
        destination: publishTopic(publicId),
        body: JSON.stringify(payload),
      });
    } else {
      pendingRef.current = payload;
      clientRef.current?.activate();
    }
  };

  const disconnect = () => {
    subsRef.current.forEach((s) => s.unsubscribe());
    return clientRef.current?.deactivate() ?? Promise.resolve();
  };

  return { messages, connected, sendMessage, disconnect };
}
