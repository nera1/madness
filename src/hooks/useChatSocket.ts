import { useCallback, useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, StompSubscription, IMessage, IFrame } from "@stomp/stompjs";
import { refresh } from "@/lib/api";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.madn.es";
const WS_URL = `${API_BASE.replace(/\/$/, "")}/ws/chat`;
const MAX_WINDOW = 30;

// iOS Safari 슬립 후 복귀 판단 임계값(필요시 30s~120s로 조정)
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

  // 재연결 제어
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activatingRef = useRef(false);
  const backoffStepRef = useRef(0);

  // 초기 로드: 메시지/구독 식별자
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

  // 백오프 + 지터
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

  // 클라이언트 생성 & 활성화 (single-flight)
  const activateClient = useCallback(async () => {
    if (!isBrowser() || !publicId) return;
    if (activatingRef.current) return;
    activatingRef.current = true;

    try {
      await teardownClient();
      try {
        await refresh(); // 재연결 직전 토큰 갱신(필요시)
      } catch (e) {
        // 토큰 갱신 실패해도 일단 시도
        console.warn("refresh failed", e);
      }

      const client = new Client({
        // 가능하면 순수 WebSocket(brokerURL) 사용 권장.
        // brokerURL: `${API_BASE.replace(/^http/, "ws")}/ws/chat`,
        webSocketFactory: () =>
          new SockJS(WS_URL, undefined, {
            transports: ["websocket"], // 폴백 비활성(환경 맞게 조정)
          }),
        reconnectDelay: 0, // 자동 재연결 off (직접 제어)
        heartbeatIncoming: 25_000, // 서버 → 클라
        heartbeatOutgoing: 0, // 클라 → 서버 (백그라운드 스로틀 회피)
        debug: () => {}, // 필요시 로깅
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

  // mount: 최초 활성화 + 페이지/네트워크 이벤트
  useEffect(() => {
    if (!publicId) return;
    void activateClient();

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenAtRef.current = Date.now();
        return;
      }
      // visible
      const hiddenFor = hiddenAtRef.current
        ? Date.now() - hiddenAtRef.current
        : 0;
      hiddenAtRef.current = null;

      const cli = clientRef.current;
      const looksDead = !cli?.connected || hiddenFor > SLEEP_THRESHOLD_MS;

      if (looksDead) {
        // 강제 재연결 (단일 비행)
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
    window.addEventListener("pageshow", onPageShow as any);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pageshow", onPageShow as any);
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

  // 메시지 캐시 저장
  useEffect(() => {
    if (!publicId || !isBrowser()) return;
    try {
      localStorage.setItem(messagesKey(publicId), JSON.stringify(messages));
    } catch (e) {
      console.error("채팅 기록 저장 실패:", e);
    }
  }, [messages, publicId]);

  // 발신
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
