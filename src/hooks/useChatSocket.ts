import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { throttle } from "lodash";
import { Client, StompSubscription, IMessage, IFrame } from "@stomp/stompjs";
import { refresh } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.madn.es";
const WS_URL = `${API_BASE.replace(/\/$/, "")}/ws/chat`;
const MAX_WINDOW = 30;

export interface ChatMessage {
  type: string;
  sender?: string;
  content: string;
  channelId: string;
}

const isBrowser = () =>
  typeof window !== "undefined" && typeof localStorage !== "undefined";

const subscribeTopic = (publicId: string) => `/sub/chat.${publicId}`;
const publishTopic = (publicId: string) => `/pub/chat.send.${publicId}`;
const subscriptionRandomIdKey = (publicId: string) =>
  `subscriptionRandomId-${publicId}`;
const messagesKey = (publicId: string) => `messages-${publicId}`;

export function useChatSocket(publicId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<StompSubscription[]>([]);
  const pendingRef = useRef<ChatMessage | null>(null);
  const prevRef = useRef<string>("");
  const subscriptionRandomId = useRef<string>("");

  useEffect(() => {
    if (!publicId || !isBrowser()) return;

    try {
      const raw = localStorage.getItem(messagesKey(publicId));
      if (raw) setMessages(JSON.parse(raw) as ChatMessage[]);
    } catch {}

    try {
      const key = subscriptionRandomIdKey(publicId);
      let rid = localStorage.getItem(key);
      if (!rid) {
        rid = Math.random().toString(36).slice(2, 8);
        localStorage.setItem(key, rid);
      }
      subscriptionRandomId.current = rid!;
    } catch {
      subscriptionRandomId.current = Math.random().toString(36).slice(2, 8);
    }
  }, [publicId]);

  const reconnect = useCallback(async () => {
    const cli = clientRef.current;
    if (!cli) return;
    await refresh();
    await cli.deactivate();
    cli.activate();
  }, []);

  const throttledReconnect = useMemo(
    () => throttle(() => reconnect(), 5000, { leading: true, trailing: false }),
    [reconnect]
  );

  const setupClient = useCallback(async () => {
    if (!isBrowser() || !publicId) return;

    subsRef.current.forEach((s) => s.unsubscribe());
    subsRef.current = [];
    if (clientRef.current) {
      await clientRef.current.deactivate();
    }

    try {
      await refresh();
    } catch (e) {
      console.error("refresh failed", e);
    }

    const client = new Client({
      webSocketFactory: () =>
        new SockJS(WS_URL, undefined, {
          transports: ["websocket"],
        }),
      reconnectDelay: 0,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (m) => console.debug("[STOMP]", m),
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
        { id: `sub-${publicId}:${subscriptionRandomId.current}` }
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

    client.onStompError = async (frame: IFrame) => {
      if (frame.headers["message"] === "401") {
        pendingRef.current = {
          type: "CHAT",
          sender: "",
          content: prevRef.current,
          channelId: publicId,
        };
        try {
          await refresh();
        } catch {}
        client.deactivate();
        client.activate();
      }
    };

    client.onWebSocketClose = () => setConnected(false);
    client.onWebSocketError = () => setConnected(false);

    client.activate();
    clientRef.current = client;
  }, [publicId]);

  useEffect(() => {
    if (!publicId) return;
    setupClient();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        throttledReconnect();
      }
    };

    if (isBrowser()) {
      document.addEventListener("visibilitychange", handleVisibilityChange);
      window.addEventListener("focus", handleVisibilityChange);
    }

    return () => {
      if (isBrowser()) {
        document.removeEventListener(
          "visibilitychange",
          handleVisibilityChange
        );
        window.removeEventListener("focus", handleVisibilityChange);
        try {
          localStorage.removeItem(subscriptionRandomIdKey(publicId));
          localStorage.removeItem(messagesKey(publicId));
        } catch {}
      }
      subsRef.current.forEach((s) => s.unsubscribe());
      clientRef.current?.deactivate();
    };
  }, [publicId, setupClient, throttledReconnect]);

  useEffect(() => {
    if (!publicId || !isBrowser()) return;
    try {
      localStorage.setItem(messagesKey(publicId), JSON.stringify(messages));
    } catch (e) {
      console.error("채팅 기록 저장 실패:", e);
    }
  }, [messages, publicId]);

  const sendMessage = useCallback(
    async (content: string, type = "CHAT") => {
      const payload: ChatMessage = {
        type,
        sender: "",
        content,
        channelId: publicId,
      };
      prevRef.current = content;

      const cli = clientRef.current;
      if (cli?.connected) {
        try {
          cli.publish({
            destination: publishTopic(publicId),
            body: JSON.stringify(payload),
          });
        } catch (err) {
          console.error(err);
          await reconnect();
        }
      } else {
        pendingRef.current = payload;
        reconnect();
      }
    },
    [publicId, reconnect]
  );

  const disconnect = useCallback(() => {
    subsRef.current.forEach((s) => s.unsubscribe());
    return clientRef.current?.deactivate() ?? Promise.resolve();
  }, []);

  return { messages, connected, sendMessage, disconnect };
}
