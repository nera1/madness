"use client";

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";

import { Button } from "../ui/button";
import {
  UserRoundPlusIcon,
  Settings,
  LogOut,
  Menu,
  MessageSquarePlus,
  CircleUserRound,
  Search,
  LogIn,
  MessageSquare,
} from "lucide-react";

import styles from "@/styles/dropdown-menu.module.scss";

export function DropdownMenu() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={`pointer cursor-pointer ${styles["menu-btn"]}`}
          variant="ghost"
          size="icon"
        >
          <Menu color="#fff" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className={`rounded-md bg-transparent ${styles["dropdown-menu"]}`}
      >
        <Command className="rounded-lg bg-transparent">
          <CommandList className={`${styles["list"]} p-3`}>
            <CommandGroup heading="">
              <CommandItem>
                <LogIn />
                <span>로그인</span>
              </CommandItem>
              <CommandItem>
                <UserRoundPlusIcon />
                <span>회원가입</span>
              </CommandItem>
              <CommandItem>
                <CircleUserRound />
                <span>회원정보 변경</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator className={`${styles["seperator"]}`} />
            <CommandGroup heading="채팅">
              <CommandItem>
                <Search />
                <span>채팅 검색</span>
              </CommandItem>
              <CommandItem>
                <MessageSquare />
                <span>채팅목록</span>
              </CommandItem>
              <CommandItem>
                <MessageSquarePlus />
                <span>채팅창 개설</span>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator className={`${styles["seperator"]}`} />
            <CommandGroup heading="">
              <CommandItem>
                <Settings />
                <span>설정</span>
              </CommandItem>
              <CommandItem>
                <LogOut />
                <span>로그아웃</span>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
