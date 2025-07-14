import { useEffect, useRef, useState } from "react";
import SockJS from "sockjs-client";
import { Client, StompSubscription, IMessage } from "@stomp/stompjs";
import { secureRandomString } from "@/util/index";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://madn.es";
const WS_URL = `${API_BASE.replace(/\/$/, "")}/ws/chat`;

export interface ChatMessage {
  type: string;
  sender?: string;
  content: string;
  channelId: string;
}

const subscribeTopic = (publicId: string) => `/sub/chat.${publicId}`;
const subscribeId = (publicId: string, subId?: string) =>
  `sub-${publicId}-${subId || secureRandomString(6)}`;
const publishTopic = (publicId: string) => `/pub/chat.send.${publicId}`;

export function useChatSocket(publicId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<Client | null>(null);
  const subsRef = useRef<StompSubscription[]>([]);

  useEffect(() => {
    if (!publicId) return;

    const socket = new SockJS(WS_URL);
    const client = new Client({
      webSocketFactory: () => socket,
      reconnectDelay: 5000,
      debug: (str) => console.debug("[STOMP]", str),
    });

    client.onConnect = () => {
      setConnected(true);
      const sub = client.subscribe(
        subscribeTopic(publicId),
        (msg: IMessage) => {
          const body = JSON.parse(msg.body) as ChatMessage;
          setMessages((prev) => [...prev, body]);
        },
        { id: subscribeId(publicId) }
      );
      subsRef.current.push(sub);
    };

    client.onStompError = (frame) => {
      console.error("STOMP Error ▶", frame.headers["message"], frame.body);
    };

    client.activate();
    clientRef.current = client;

    return () => {
      disconnect();
      setConnected(false);
    };
  }, [publicId]);

  const sendMessage = (content: string, type: string = "CHAT") => {
    if (!clientRef.current?.connected || !content.trim()) return;
    const payload: ChatMessage = {
      type,
      sender: "",
      content,
      channelId: publicId,
    };
    clientRef.current.publish({
      destination: publishTopic(publicId),
      body: JSON.stringify(payload),
    });
  };

  const disconnect = () => {
    subsRef.current.forEach((s) => s.unsubscribe());
    subsRef.current = [];
    clientRef.current?.deactivate();
    clientRef.current = null;
  };

  return { messages, connected, sendMessage, disconnect };
}
