"use client";

import { FunctionComponent, MouseEventHandler, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { ChannelDto, refresh } from "@/lib/api";
import { JoinChannelRequest, joinChannel } from "@/lib/api/methods/post";
import { formatDotDateTime12Hour } from "../../../util";

import styles from "@/styles/channel-search-list-item.module.scss";
import { Button } from "../ui/button";

interface ChannelSearchListItemProps extends ChannelDto {
  participants?: number;
  disabled?: boolean;
}

const ChannelSearchListItem: FunctionComponent<ChannelSearchListItemProps> = ({
  createdAt,
  name,
  publicId,
  disabled = false,
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
            if (retryError instanceof Response && retryError.status === 401) {
              //router.push("/login");
              toast(
                <div className="flex gap-x-2 items-center">
                  <div className="grow">로그인이 필요합니다</div>
                </div>,
                {
                  duration: 5000,
                }
              );
            } else {
              console.error("refresh 후 join 재시도 실패:", retryError);
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
      } px-5 pb-3 pt-4 cursor-pointer flex rounded-sm ${
        loading ? "opacity-50 pointer-events-none" : ""
      }`}
      onClick={onClick}
    >
      <div className={`${styles["left"]} flex flex-col gap-y-1`}>
        <div className={`${styles["top"]} text-sm font-bold`}>{name}</div>
        <div className={`${styles["middle"]} text-xs`}>
          {formatDotDateTime12Hour(createdAt)}
        </div>
      </div>
      <div className={`${styles["right"]}`}></div>
    </li>
  );
};

export default ChannelSearchListItem;
