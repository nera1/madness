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

export function useChatSocket(publicId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<StompSubscription[]>([]);
  const pendingRef = useRef<ChatMessage | null>(null);
  const prevRef = useRef<string>("");

  // STOMP 클라이언트 초기화
  const setupClient = async () => {
    // 기존 연결/구독 정리
    subsRef.current.forEach((s) => s.unsubscribe());
    subsRef.current = [];
    if (clientRef.current) {
      await clientRef.current.deactivate();
    }

    // 토큰(쿠키) 갱신
    try {
      await refresh();
    } catch (e) {
      console.error("refresh failed", e);
    }

    // 새 클라이언트 생성
    const client = new Client({
      webSocketFactory: () => new SockJS(WS_URL, { transports: ["websocket"] }),
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (m) => console.debug("[STOMP]", m),
    });

    client.onConnect = () => {
      setConnected(true);

      // 중복 방지: 이전 구독 모두 해제
      subsRef.current.forEach((s) => s.unsubscribe());
      subsRef.current = [];

      // 새 구독
      const sub = client.subscribe(
        subscribeTopic(publicId),
        (msg: IMessage) => {
          const body = JSON.parse(msg.body) as ChatMessage;
          setMessages((prev) => {
            const next = [...prev, body];
            return next.length > MAX_WINDOW ? next.slice(-MAX_WINDOW) : next;
          });
        },
        { id: `sub-${publicId}-${Math.random().toString(36).slice(2, 8)}` }
      );
      subsRef.current.push(sub);

      // pending 전송
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
        // 토큰 만료 → refresh → 재연결
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

    // “포그라운드 복귀” 시 강제 재연결 핸들러
    const reconnect = async () => {
      const cli = clientRef.current;
      if (!cli) return;
      // deactivate → activate 로 강제 리셋
      await refresh();
      await cli.deactivate();
      cli.activate();
    };

    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") reconnect();
    });
    window.addEventListener("focus", reconnect);

    return () => {
      document.removeEventListener("visibilitychange", reconnect);
      window.removeEventListener("focus", reconnect);
      subsRef.current.forEach((s) => s.unsubscribe());
      clientRef.current?.deactivate();
      setConnected(false);
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
      cli.publish({
        destination: publishTopic(publicId),
        body: JSON.stringify(payload),
      });
    } else {
      pendingRef.current = payload;
      await refresh();
      cli?.activate();
    }
  };

  const disconnect = () => {
    subsRef.current.forEach((s) => s.unsubscribe());
    return clientRef.current?.deactivate() ?? Promise.resolve();
  };

  return { messages, connected, sendMessage, disconnect };
}
