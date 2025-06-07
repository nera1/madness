"use client";

import { useEffect, useState } from "react";
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
  Search,
  MessageSquare,
  Github,
  Server,
  PanelTop,
  UserRoundX,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

import { getMe, MeResponseData, refresh, signOut } from "@/lib/api/methods/get";
import Spinner from "../ui/spinner";

import styles from "@/styles/dropdown-menu.module.scss";

export function DropdownMenu() {
  const [user, setUser] = useState<MeResponseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getMe()
      .then((res) => {
        setUser(res.data);
      })
      .catch(() => {
        refresh()
          .then(() => getMe())
          .then((res2) => {
            setUser(res2.data);
          })
          .catch(() => {
            setUser(null);
          });
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSignOut = () => {
    signOut()
      .then(() => setUser(null))
      .catch(() => setUser(null));
  };

  const renderUserSection = () => {
    if (loading) {
      return (
        <CommandItem className="flex justify-center">
          <Spinner />
        </CommandItem>
      );
    }

    if (user) {
      return (
        <CommandItem className="data-[selected=true]:bg-neutral-700 data-[selected=true]:text-white">
          <Link href="#" className="flex gap-x-3 items-center">
            <Avatar>
              <AvatarImage src="" alt={user.nickname} />
              <AvatarFallback className="bg-neutral-950">🤪</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <span className="text-sm leading-none font-medium">
                {user.nickname}
              </span>
              <span className="text-muted-foreground text-sm leading-none font-medium">
                {user.email}
              </span>
            </div>
          </Link>
        </CommandItem>
      );
    }

    return (
      <CommandItem className="data-[selected=true]:bg-neutral-700 data-[selected=true]:text-white">
        <Link href="/signin" className="flex gap-x-2 items-center">
          <span className="w-100">로그인이 필요합니다</span>
        </Link>
      </CommandItem>
    );
  };

  const renderAccountAction = () => {
    if (user) return null;
    return (
      <>
        <CommandSeparator className={styles["seperator"]} />
        <CommandItem
          asChild
          className="data-[selected=true]:bg-neutral-700 data-[selected=true]:text-white"
        >
          <Link href="/signup" className="flex gap-x-2 items-center">
            <UserRoundPlusIcon />
            <span>회원가입</span>
          </Link>
        </CommandItem>
        <CommandItem
          asChild
          className="data-[selected=true]:bg-neutral-700 data-[selected=true]:text-white"
        >
          <Link href="#" className="flex gap-x-2 items-center">
            <UserRoundX />
            <span>회원탈퇴</span>
          </Link>
        </CommandItem>
      </>
    );
  };

  const renderLogoutItem = () => {
    if (!user) return null;
    return (
      <CommandItem
        onSelect={handleSignOut}
        className="data-[selected=true]:bg-neutral-700 data-[selected=true]:text-white flex items-center gap-x-2"
      >
        <LogOut />
        <span>로그아웃</span>
      </CommandItem>
    );
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={`my-5 pointer cursor-pointer ${styles["menu-btn"]}`}
          variant="ghost"
          size="icon"
          disabled={loading}
        >
          {loading ? <Spinner /> : <Menu color="#fff" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className={`
          p-2 rounded-md bg-transparent
          ${styles["dropdown-menu"]}
          transition-all duration-300 ease-out
          scale-95 opacity-0
          data-[state=open]:scale-100 data-[state=open]:opacity-100
        `}
      >
        <Command className="rounded-lg bg-transparent">
          <CommandList className={styles["list"]}>
            <CommandGroup heading="">{renderUserSection()}</CommandGroup>
            <CommandGroup heading="">{renderAccountAction()}</CommandGroup>
            <CommandSeparator className={styles["seperator"]} />
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
            <CommandSeparator className={styles["seperator"]} />
            <CommandGroup heading="">
              <CommandItem>
                <a
                  className="flex gap-x-2 items-center"
                  href="https://github.com/nera1/api.madness"
                  target="_blank"
                  rel="noopener noreferrer"
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
                  rel="noopener noreferrer"
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
                  rel="noopener noreferrer"
                >
                  <Github />
                  <span>Github</span>
                </a>
              </CommandItem>
              <CommandItem>
                <Settings />
                <span>설정</span>
              </CommandItem>
              {renderLogoutItem()}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
