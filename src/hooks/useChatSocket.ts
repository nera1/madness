import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import {
  Client,
  StompSubscription,
  IMessage,
  IFrame,
  IStompSocket,
} from "@stomp/stompjs";
import { refresh } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.madn.es";
const WS_URL = `${API_BASE.replace(/\/$/, "")}/ws/chat`;
const MAX_WINDOW = 30;
const SLEEP_THRESHOLD_MS = 60_000;

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
  const subscriptionRandomId = useRef<string>("");
  const hiddenAtRef = useRef<number | null>(null);

  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activatingRef = useRef(false);
  const backoffStepRef = useRef(0);

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

  const resetBackoff = () => (backoffStepRef.current = 0);
  const nextBackoff = () => {
    const step = backoffStepRef.current++;
    const base = Math.min(30_000, Math.max(1_000, 2 ** step * 1000));
    const jitter = base * (0.7 + Math.random() * 0.6);
    return Math.min(30_000, Math.max(750, jitter));
  };

  const scheduleReconnect = useCallback(() => {
    if (reconnectTimerRef.current) return;
    const delay = nextBackoff();
    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      if (clientRef.current && !clientRef.current.active) {
        void activateClient();
      }
    }, delay);
  }, []);

  const teardownClient = useCallback(async () => {
    subsRef.current.forEach((s) => s.unsubscribe());
    subsRef.current = [];
    if (clientRef.current) {
      try {
        await clientRef.current.deactivate();
      } catch {}
    }
  }, []);

  const activateClient = useCallback(async () => {
    if (!isBrowser() || !publicId) return;
    if (activatingRef.current) return;
    activatingRef.current = true;
    try {
      await teardownClient();
      try {
        await refresh();
      } catch {}
      const client = new Client({
        webSocketFactory: () =>
          new SockJS(WS_URL, undefined, {
            transports: ["websocket"],
          }) as unknown as IStompSocket,
        reconnectDelay: 0,
        heartbeatIncoming: 25_000,
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
      client.onWebSocketClose = () => {
        setConnected(false);
        scheduleReconnect();
      };
      client.onWebSocketError = () => {
        setConnected(false);
        scheduleReconnect();
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
      client.activate();
      clientRef.current = client;
    } finally {
      activatingRef.current = false;
    }
  }, [publicId, scheduleReconnect, teardownClient]);

  useEffect(() => {
    if (!publicId) return;
    void activateClient();

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }
      const hiddenFor = hiddenAtRef.current
        ? Date.now() - hiddenAtRef.current
        : 0;
      hiddenAtRef.current = null;
      const cli = clientRef.current;
      const looksDead = !cli?.connected || hiddenFor > SLEEP_THRESHOLD_MS;
      if (looksDead) {
        void (async () => {
          try {
            await cli?.deactivate();
          } catch {}
          scheduleReconnect();
        })();
      }
    };

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        const cli = clientRef.current;
        void (async () => {
          try {
            await cli?.deactivate();
          } catch {}
          scheduleReconnect();
        })();
      }
    };

    const onOnline = () => {
      const cli = clientRef.current;
      if (!cli?.connected) scheduleReconnect();
    };
    const onOffline = () => {
      void clientRef.current?.deactivate();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      subsRef.current.forEach((s) => s.unsubscribe());
      void clientRef.current?.deactivate();
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
    } catch {}
  }, [messages, publicId]);

  const sendMessage = useCallback(
    async (content: string, type = "CHAT") => {
      const payload: ChatMessage = {
        type,
        sender: "",
        content,
        channelId: publicId,
      };
      const cli = clientRef.current;
      if (cli?.connected) {
        try {
          cli.publish({
            destination: publishTopic(publicId),
            body: JSON.stringify(payload),
          });
        } catch {
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
