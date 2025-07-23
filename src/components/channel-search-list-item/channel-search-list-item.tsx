"use client";

import { FunctionComponent, MouseEventHandler, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format, register } from "timeago.js";
import ko from "timeago.js/lib/lang/ko";
import millify from "millify";

import { ChannelDto, refresh } from "@/lib/api";
import { JoinChannelRequest, joinChannel } from "@/lib/api/methods/post";

import { Skeleton } from "../ui/skeleton";

import styles from "@/styles/channel-search-list-item.module.scss";

register("ko", ko);

interface ChannelSearchListItemProps extends ChannelDto {
  disabled?: boolean;
  className?: string;
  isSkeleton?: boolean;
}

const ChannelSearchListItem: FunctionComponent<ChannelSearchListItemProps> = ({
  createdAt,
  name,
  publicId,
  participants,
  disabled = false,
  className,
  isSkeleton = false,
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const navigateToChannel = () => {
    router.push(`/channel/?c=${publicId}`);
  };

  const handleClick = async () => {
    setLoading(true);

    const payload: JoinChannelRequest = {
      publicChannelId: publicId,
      password: "",
    };

    try {
      await joinChannel(payload);
      navigateToChannel();
    } catch (error) {
      if (error instanceof Response) {
        if (error.status === 409) {
          navigateToChannel();
        } else if (error.status === 401) {
          try {
            await refresh();
            await joinChannel(payload);
            navigateToChannel();
          } catch (retryError) {
            if (retryError instanceof Response) {
              if (retryError.status === 401) {
                toast(
                  <div className="flex gap-x-2 items-center">
                    <div className="grow">로그인이 필요합니다</div>
                  </div>,
                  {
                    duration: 5000,
                  }
                );
              } else if (retryError.status === 409) {
                navigateToChannel();
              } else {
                console.error("refresh 후 join 재시도 실패:", retryError);
              }
            }
          }
        } else {
          console.error("join 실패:", error);
        }
      } else {
        console.error("알 수 없는 오류:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const onClick: MouseEventHandler<HTMLLIElement> = (e) => {
    if (loading || disabled) return;
    e.stopPropagation();
    handleClick();
  };

  return (
    <li
      className={`${
        styles["channel-search-list-item"]
      } px-5 pb-3 pt-4 cursor-pointer flex relative ${
        loading ? "opacity-50 pointer-events-none" : ""
      } ${className || styles["default-style"]} ${
        isSkeleton ? styles["skeleton"] : ""
      }`}
      onClick={onClick}
    >
      {isSkeleton ? (
        <Skeleton className="w-full h-full absolute left-0 top-0 bg-neutral-900" />
      ) : (
        <></>
      )}
      <div className={`${styles["left"]} flex flex-col gap-y-1 w-full`}>
        <div className={`${styles["top"]} text-xs flex justify-between w-full`}>
          <div className={`${styles["name"]} font-bold`}>
            {isSkeleton ? "ㅤ" : name}
          </div>
          <div className={`${styles["date"]}`}>
            {isSkeleton ? "ㅤ" : format(createdAt, "ko")}
          </div>
        </div>
        <div className={`text-xs font-medium ${styles["participants"]}`}>
          {isSkeleton ? "ㅤ" : participants}
        </div>
      </div>
    </li>
  );
};

export default ChannelSearchListItem;
