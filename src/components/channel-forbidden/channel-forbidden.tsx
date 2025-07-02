"use client";

import { FunctionComponent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { Button } from "../ui/button";
import { Search, SquarePlus, LogIn } from "lucide-react";

import styles from "@/styles/channel-forbidden.module.scss";

interface ChannelForbiddenProps {
  status: 401 | 403;
  publicChannelId?: string;
}

const ChannelForbidden: FunctionComponent<ChannelForbiddenProps> = ({
  status,
  publicChannelId,
}) => {
  const router = useRouter();

  const handleJoin = async () => {
    if (!publicChannelId) return;
    try {
      //await joinChannel({ publicChannelId, password: "" });
      router.refresh();
    } catch (e) {
      console.error("채널 참여 실패:", e);
    }
  };

  return (
    <main
      className={`${styles["channel-forbidden"]} w-full flex justify-center`}
    >
      <div className={`${styles["container"]} flex flex-col justify-center`}>
        <h1 className="text-2xl tracking-tight text-balance font-semibold">
          {"채널에 참여할 수 없습니다"}
        </h1>
        <h2 className="text-muted-foreground text-md my-1">
          {"채널 접근 권한이 없거나, 참여할 수 없는 상태입니다"}
        </h2>
        <div className="flex flex-col py-3 gap-y-2">
          {status === 401 ? (
            <Button asChild className="cursor-pointer">
              <Link href="/signin">
                <LogIn /> 로그인
              </Link>
            </Button>
          ) : (
            <>
              <Button onClick={handleJoin} className="cursor-pointer">
                <SquarePlus /> 채널 참여
              </Button>
              <Button asChild className="cursor-pointer">
                <Link href="/channel/search">
                  <Search /> 채널 검색
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default ChannelForbidden;
