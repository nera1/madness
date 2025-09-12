import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
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
  const sendQueueRef = useRef<ChatMessage[]>([]);
  const prevRef = useRef<string>("");

  const reconnectingRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const nextBackoff = useRef(0);
  const backoffDelay = () => {
    const base = Math.min(30000, 2 ** nextBackoff.current++ * 1000);
    const jitter = base * (0.7 + Math.random() * 0.6);
    return Math.min(30000, Math.max(750, jitter));
  };
  const resetBackoff = () => (nextBackoff.current = 0);

  const scheduleReconnect = useCallback(() => {
    if (reconnectingRef.current) return;
    if (reconnectTimerRef.current) return;

    const delay = backoffDelay();
    reconnectTimerRef.current = setTimeout(async () => {
      reconnectTimerRef.current = null;
      if (clientRef.current && !clientRef.current.active) {
        await activateClient();
      }
    }, delay);
  }, []);

  const activateClient = useCallback(async () => {
    if (!isBrowser() || !publicId) return;
    if (reconnectingRef.current) return;
    reconnectingRef.current = true;

    try {
      subsRef.current.forEach((s) => s.unsubscribe());
      subsRef.current = [];

      if (clientRef.current) {
        try {
          await clientRef.current.deactivate();
        } catch {}
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
        heartbeatIncoming: 25000,
        heartbeatOutgoing: 0,
        debug: () => {},
      });

      client.onConnect = () => {
        setConnected(true);
        resetBackoff();

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

        while (sendQueueRef.current.length) {
          const m = sendQueueRef.current.shift()!;
          client.publish({
            destination: publishTopic(publicId),
            body: JSON.stringify(m),
          });
        }
      };

      client.onStompError = async (frame: IFrame) => {
        if (frame.headers["message"] === "401") {
          try {
            await refresh();
          } catch {}
          try {
            await client.deactivate();
          } catch {}
          scheduleReconnect();
        } else {
          scheduleReconnect();
        }
      };

      client.onWebSocketClose = () => {
        setConnected(false);
        scheduleReconnect();
      };
      client.onWebSocketError = () => {
        setConnected(false);
        scheduleReconnect();
      };

      client.activate();
      clientRef.current = client;
    } finally {
      reconnectingRef.current = false;
    }
  }, [publicId, scheduleReconnect]);

  useEffect(() => {
    if (!publicId) return;
    activateClient();

    const onVisibilityOrFocus = () => {
      if (
        document.visibilityState === "visible" &&
        clientRef.current &&
        !clientRef.current.connected
      ) {
        scheduleReconnect();
      }
    };

    const onOnline = () => {
      if (clientRef.current && !clientRef.current.connected) {
        scheduleReconnect();
      }
    };
    const onOffline = () => {
      try {
        clientRef.current?.deactivate();
      } catch {}
    };

    if (isBrowser()) {
      document.addEventListener("visibilitychange", onVisibilityOrFocus);
      window.addEventListener("focus", onVisibilityOrFocus);
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
    }

    return () => {
      if (isBrowser()) {
        document.removeEventListener("visibilitychange", onVisibilityOrFocus);
        window.removeEventListener("focus", onVisibilityOrFocus);
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      }
      subsRef.current.forEach((s) => s.unsubscribe());
      clientRef.current?.deactivate();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [publicId, activateClient, scheduleReconnect]);

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
          sendQueueRef.current.push(payload);
          scheduleReconnect();
        }
      } else {
        sendQueueRef.current.push(payload);
        scheduleReconnect();
      }
    },
    [publicId, scheduleReconnect]
  );

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    subsRef.current.forEach((s) => s.unsubscribe());
    return clientRef.current?.deactivate() ?? Promise.resolve();
  }, []);

  return { messages, connected, sendMessage, disconnect };
}
