import { FunctionComponent } from "react";

import { Button } from "../ui/button";

import { Search, SquarePlus } from "lucide-react";

import styles from "@/styles/channel-forbidden.module.scss";

interface ChannelForbidden {}

const ChannelForbidden: FunctionComponent = () => {
  return (
    <>
      <main
        className={`${styles["channel-forbidden"]} w-full flex justify-center`}
      >
        <div className={`${styles["container"]} flex flex-col justify-center`}>
          <h1 className="text-2xl tracking-tight text-balance font-semibold">
            채널에 참여할 수 없습니다
          </h1>
          <h2 className="text-muted-foreground text-md mt-1">
            채널에 접근할 권한이 없거나, 참여할 수 없는 상태입니다
          </h2>
          <div className="flex flex-col py-3 gap-y-2">
            <Button className="cursor-pointer">
              <Search /> 채널 검색
            </Button>
            <Button className="cursor-pointer" disabled>
              <SquarePlus /> 채널 참여
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

export default ChannelForbidden;
