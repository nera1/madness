"use client";

import { FunctionComponent, MouseEventHandler } from "react";
import { useRouter } from "next/navigation";

import { ChannelDto } from "@/lib/api";

import { formatDotDateTime12Hour } from "../../../util";

import styles from "@/styles/channel-search-list-item.module.scss";

interface ChannelSearchListItemProps extends ChannelDto {}

const ChannelSearchListItem: FunctionComponent<ChannelSearchListItemProps> = ({
  createdAt,
  name,
  publicId,
}) => {
  const router = useRouter();
  const onClick: MouseEventHandler<HTMLLIElement> = (event) => {
    event.stopPropagation();
    router.push(`/channel/?c=${publicId}`);
  };
  return (
    <li
      className={`${styles["channel-search-list-item"]} px-5 pb-3 pt-4 cursor-pointer flex rounded-sm`}
      onClick={onClick}
    >
      <div className={`${styles["left"]} flex flex-col gap-y-1`}>
        <div className={`${styles["top"]} text-sm font-bold`}>{name}</div>
        <div className={`${styles["middle"]} text-xs`}>
          {formatDotDateTime12Hour(createdAt)}
        </div>
        <div className={`${styles["bottom"]}`}></div>
      </div>
      <div className={`${styles["right"]}`}></div>
    </li>
  );
};

export default ChannelSearchListItem;
