"use client";

import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

import Link from "next/link";

import { Button } from "../ui/button";
import {
  UserRoundPlusIcon,
  Settings,
  LogOut,
  Menu,
  MessageSquarePlus,
  CircleUserRound,
  Search,
  MessageSquare,
  Github,
  Server,
  PanelTop,
} from "lucide-react";

import styles from "@/styles/dropdown-menu.module.scss";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export function DropdownMenu() {
  return (
    <Popover>
      <PopoverTrigger className="" asChild>
        <Button
          className={`my-5 pointer cursor-pointer ${styles["menu-btn"]}`}
          variant="ghost"
          size="icon"
        >
          <Menu color="#fff" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className={`p-2 rounded-md bg-transparent ${styles["dropdown-menu"]} transition-all duration-300 ease-out scale-95 opacity-0 data-[state=open]:scale-100 data-[state=open]:opacity-100`}
      >
        <Command className="rounded-lg bg-transparent">
          <CommandList className={`${styles["list"]}`}>
            <CommandGroup heading="">
              <CommandItem className="data-[selected=true]:bg-neutral-700 data-[selected=true]:text-white">
                <Link
                  href={"/signin"}
                  className="bg-transparent flex gap-x-2 items-center"
                >
                  <Avatar>
                    <AvatarImage src="" alt="Nickname" />
                    <AvatarFallback className="bg-neutral-950">
                      🤪
                    </AvatarFallback>
                  </Avatar>
                  <span>로그인이 필요합니다</span>
                </Link>
              </CommandItem>
            </CommandGroup>
            <CommandGroup heading="">
              <CommandSeparator className={`${styles["seperator"]}`} />
              <CommandItem
                asChild
                className="data-[selected=true]:bg-neutral-700 data-[selected=true]:text-white"
              >
                <Link href={"/signup"} className="bg-transparent">
                  <UserRoundPlusIcon />
                  <span>회원가입</span>
                </Link>
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
                <a
                  className="flex gap-x-2 items-center"
                  href="https://github.com/nera1/api.madness"
                  target="_blank"
                >
                  <Server />
                  <span>Backend Repository</span>
                </a>
              </CommandItem>
              <CommandItem>
                <a
                  className="flex gap-x-2 items-center"
                  href="https://github.com/nera1/madness"
                  target="_blank"
                >
                  <PanelTop />
                  <span>Frontend Repository</span>
                </a>
              </CommandItem>
              <CommandItem>
                <a
                  className="flex gap-x-2 items-center"
                  href="https://github.com/nera1"
                  target="_blank"
                >
                  <Github />
                  <span>Github</span>
                </a>
              </CommandItem>
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
