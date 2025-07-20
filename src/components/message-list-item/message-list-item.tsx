import { FunctionComponent } from "react";

import { ChatMessage } from "@/hooks/useChatSocket";

import styles from "@/styles/message-list-item.module.scss";

interface MessageListItemProps extends ChatMessage {
  color?: string;
}

const MessageListItem: FunctionComponent<MessageListItemProps> = ({
  sender,
  content,
  color = "#fff",
}) => {
  return (
    <li className={`${styles["message-list-item"]} m-0 flex gap-x-2 px-2`}>
      <span className={`${styles["content"]} w-full`}>
        <span className={`${styles["sender"]} mr-1`} style={{ color: color }}>
          {sender}
        </span>
        <span>{content}</span>
      </span>
    </li>
  );
};

export default MessageListItem;
