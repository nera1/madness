import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const sendQueueRef = useRef<ChatMessage[]>([]); // ✅ 다건 큐
  const prevRef = useRef<string>("");

  // 재연결 제어
  const reconnectingRef = useRef(false);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 탭/채널 식별자 (목표에 맞게 localStorage 또는 sessionStorage 선택)
  const subscriptionRandomId = useRef<string>("");

  // === 초기 로드 ===
  useEffect(() => {
    if (!publicId || !isBrowser()) return;

    try {
      const raw = localStorage.getItem(messagesKey(publicId));
      if (raw) setMessages(JSON.parse(raw) as ChatMessage[]);
    } catch {}

    try {
      // 한 사람이 여러 탭이어도 1명으로 집계하고 싶으면 localStorage 유지
      // 탭마다 구분하고 싶으면 sessionStorage로 바꾸세요.
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

  // === 백오프 + 지터 ===
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
        await activateClient(); // 아래 정의
      }
    }, delay);
  }, []);

  // === 클라이언트 생성 & 활성화 (single-flight) ===
  const activateClient = useCallback(async () => {
    if (!isBrowser() || !publicId) return;
    if (reconnectingRef.current) return;
    reconnectingRef.current = true;

    try {
      // 중복 구독 제거
      subsRef.current.forEach((s) => s.unsubscribe());
      subsRef.current = [];

      // 기존 클라 정리
      if (clientRef.current) {
        try {
          await clientRef.current.deactivate();
        } catch {}
      }

      try {
        await refresh(); // 최초/재연결 직전 토큰 갱신
      } catch (e) {
        console.error("refresh failed", e);
      }

      const client = new Client({
        // 가능하면 SockJS 대신 순수 WebSocket(brokerURL) 권장.
        // brokerURL: `${API_BASE.replace(/^http/, "ws")}/ws/chat`,
        // 웹서버가 SockJS 엔드포인트만 열려 있으면 아래 유지:
        webSocketFactory: () =>
          new SockJS(WS_URL, undefined, {
            transports: ["websocket"], // 폴백 비활성(환경 맞게 조정)
          }),
        reconnectDelay: 0, // 직접 재연결 제어
        heartbeatIncoming: 25000, // ✅ 서버→클라
        heartbeatOutgoing: 0, // ✅ 클라→서버(백그라운드 스로틀 회피)
        debug: () => {}, // 필요 시 로깅
        // connectHeaders: { Authorization: `Bearer ${accessToken}` } // 필요 시
      });

      client.onConnect = () => {
        setConnected(true);
        resetBackoff();

        // 안전 재구독
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

        // 큐 비우기
        while (sendQueueRef.current.length) {
          const m = sendQueueRef.current.shift()!;
          client.publish({
            destination: publishTopic(publicId),
            body: JSON.stringify(m),
          });
        }
      };

      client.onStompError = async (frame: IFrame) => {
        // 401 등 인증 이슈는 한 번만 정리해서 재시도
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

  // === 최초 활성화 + 환경 이벤트 ===
  useEffect(() => {
    if (!publicId) return;
    activateClient();

    const onVisibilityOrFocus = () => {
      // 보이는 상태 & 끊겨 있을 때만
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
        // 메시지 캐시는 남기고, 식별자는 목표에 맞게 유지/삭제 선택
        // localStorage.removeItem(subscriptionRandomIdKey(publicId));
        // localStorage.removeItem(messagesKey(publicId));
      }
      subsRef.current.forEach((s) => s.unsubscribe());
      clientRef.current?.deactivate();
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
    };
  }, [publicId, activateClient, scheduleReconnect]);

  // 메시지 캐시 저장
  useEffect(() => {
    if (!publicId || !isBrowser()) return;
    try {
      localStorage.setItem(messagesKey(publicId), JSON.stringify(messages));
    } catch (e) {
      console.error("채팅 기록 저장 실패:", e);
    }
  }, [messages, publicId]);

  // === 발신 ===
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
