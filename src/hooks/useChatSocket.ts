import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, StompSubscription, IMessage } from "@stomp/stompjs";
import { refresh } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.madn.es";
const WS_URL = `${API_BASE.replace(/\/$/, "")}/ws/chat`;

export interface ChatMessage {
  type: string;
  sender?: string;
  content: string;
  channelId: string;
}

const MAX_WINDOW = 30;
const subscribeTopic = (publicId: string) => `/sub/chat.${publicId}`;
const publishTopic = (publicId: string) => `/pub/chat.send.${publicId}`;

export function useChatSocket(publicId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);

  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<StompSubscription[]>([]);
  const pendingRef = useRef<ChatMessage | null>(null);
  const prevRef = useRef<string>("");

  // 1) 초기 or 재연결 시 STOMP 클라이언트 생성
  useEffect(() => {
    if (!publicId) return;

    let isMounted = true;

    const setupClient = async () => {
      // 1-1) 기존 연결 정리
      subsRef.current.forEach((s) => s.unsubscribe());
      subsRef.current = [];
      if (clientRef.current) {
        await clientRef.current.deactivate();
      }

      // 1-2) 쿠키 기반 인증 갱신
      try {
        await refresh();
      } catch (err) {
        console.error("refresh failed", err);
      }

      // 1-3) 새로운 STOMP Client 생성
      const client = new Client({
        webSocketFactory: () =>
          new SockJS(WS_URL, undefined, { transports: ["websocket"] }),
        reconnectDelay: 5000, // 5초마다 자동 재연결
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        debug: (msg) => console.debug("[STOMP]", msg),
      });

      // 2) 연결 성공 시: 기존 구독 해제 → 새 구독 → pending 전송
      client.onConnect = () => {
        if (!isMounted) return;
        setConnected(true);

        // (중복 방지) 이전 구독 해제
        subsRef.current.forEach((s) => s.unsubscribe());
        subsRef.current = [];

        // 새로운 구독
        const subId = `sub-${publicId}-${Math.random()
          .toString(36)
          .slice(2, 8)}`;
        const sub = client.subscribe(
          subscribeTopic(publicId),
          (msg: IMessage) => {
            const body = JSON.parse(msg.body) as ChatMessage;
            setMessages((prev) => {
              const next = [...prev, body];
              return next.length > MAX_WINDOW ? next.slice(-MAX_WINDOW) : next;
            });
          },
          { id: subId }
        );
        subsRef.current.push(sub);

        // 밀려 있던 메시지 전송
        if (pendingRef.current) {
          client.publish({
            destination: publishTopic(publicId),
            body: JSON.stringify(pendingRef.current),
          });
          pendingRef.current = null;
        }
      };

      // 3) STOMP 에러 처리 (401 토큰 만료)
      client.onStompError = async (frame) => {
        console.error("STOMP Error ▶", frame.headers["message"], frame.body);
        if (frame.headers["message"] === "401") {
          // 토큰 리프레시 후 재연결
          try {
            await refresh();
          } catch {}
          client.deactivate();
          client.activate();
        }
      };

      // 4) WebSocket 레벨 Close/Error 시 상태만 업데이트
      client.onWebSocketClose = () => {
        console.warn("WebSocket closed");
        setConnected(false);
      };
      client.onWebSocketError = () => {
        console.error("WebSocket error");
        setConnected(false);
      };

      // 5) activate & ref 저장
      client.activate();
      clientRef.current = client;
    };

    setupClient();

    // 6) 백그라운드→포그라운드 복귀 시 재연결 시도
    const tryReconnect = () => {
      const cli = clientRef.current;
      if (cli && !cli.connected) {
        console.debug("Reconnecting WebSocket…");
        cli.activate();
      }
    };
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        tryReconnect();
      }
    });
    window.addEventListener("focus", tryReconnect);

    return () => {
      isMounted = false;
      document.removeEventListener("visibilitychange", tryReconnect);
      window.removeEventListener("focus", tryReconnect);
      subsRef.current.forEach((s) => s.unsubscribe());
      clientRef.current?.deactivate();
      setConnected(false);
    };
  }, [publicId]);

  // 7) 메시지 전송
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
      // 연결 안 된 경우 메시지 저장 후 reconnect
      pendingRef.current = payload;
      clientRef.current?.activate();
    }
  };

  // 8) 명시적 연결 해제
  const disconnect = () => {
    subsRef.current.forEach((s) => s.unsubscribe());
    return clientRef.current?.deactivate() ?? Promise.resolve();
  };

  return { messages, connected, sendMessage, disconnect };
}
