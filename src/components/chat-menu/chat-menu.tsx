import {
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Command } from "../ui/command";

import { DoorOpen } from "lucide-react";

import styles from "@/styles/chat-menu.module.scss";

const ChatMenu = () => {
  return (
    <Command className={`${styles["chat-menu"]} bg-transparent p-1`}>
      <CommandList>
        <CommandGroup>
          <CommandItem className={`${styles["chat-menu-item"]}`}>
            <DoorOpen />
            <span>채널 나가기</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator className={styles["seperator"]} />
      </CommandList>
    </Command>
  );
};

export default ChatMenu;
