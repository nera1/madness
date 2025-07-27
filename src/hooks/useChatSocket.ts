import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, StompSubscription, IMessage } from "@stomp/stompjs";
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

const subscribeTopic = (publicId: string) => `/sub/chat.${publicId}`;
const publishTopic = (publicId: string) => `/pub/chat.send.${publicId}`;
const subscribeRandomId = () => {
  let rand = sessionStorage.getItem("subscriptionRandomId");
  if (!rand) {
    rand = Math.random().toString(36).slice(2, 8);
    sessionStorage.setItem("subscriptionRandomId", rand);
  }
  return rand;
};

export function useChatSocket(publicId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<StompSubscription[]>([]);
  const pendingRef = useRef<ChatMessage | null>(null);
  const prevRef = useRef<string>("");
  const subscriptionRandomId = useRef<string>(subscribeRandomId());

  const reconnect = async () => {
    const cli = clientRef.current;
    if (!cli) return;
    await refresh();
    await cli.deactivate();
    cli.activate();
  };

  const setupClient = async () => {
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
        new SockJS(WS_URL, {
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

    client.onStompError = async (frame) => {
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
  };

  useEffect(() => {
    if (!publicId) return;
    setupClient();

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        reconnect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("focus", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("focus", handleVisibilityChange);
      sessionStorage.clear();
      disconnect();
    };
  }, [publicId]);

  const sendMessage = async (content: string, type = "CHAT") => {
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
  };

  const disconnect = () => {
    subsRef.current.forEach((s) => s.unsubscribe());
    return clientRef.current?.deactivate() ?? Promise.resolve();
  };

  return { messages, connected, sendMessage, disconnect };
}
