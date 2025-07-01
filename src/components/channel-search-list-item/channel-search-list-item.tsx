"use client";

import { FunctionComponent, MouseEventHandler, useState } from "react";
import { useRouter } from "next/navigation";

import { ChannelDto, refresh } from "@/lib/api";
import { JoinChannelRequest, joinChannel } from "@/lib/api/methods/post";
import { formatDotDateTime12Hour } from "../../../util";

import styles from "@/styles/channel-search-list-item.module.scss";

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

  const handleClick = async () => {
    setLoading(true);

    const payload: JoinChannelRequest = {
      publicChannelId: publicId,
      password: "",
    };

    try {
      await joinChannel(payload);
      router.push(`/channel/?c=${publicId}`);
      return;
    } catch (error) {
      if (error instanceof Response) {
        if (error.status === 409) {
          router.push(`/channel/?c=${publicId}`);
          return;
        }
        if (error.status === 401) {
          try {
            await refresh();
            await joinChannel(payload);
            router.push(`/channel/?c=${publicId}`);
          } catch (retryError) {
            console.error("refreshed and failed", retryError);
          }
        }
      } else {
        //console.error("알 수 없는 에러:", error);
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
