"use client";

import { useEffect, useState } from "react";

import Header from "@/components/header/header";
import IndexSection from "@/components/index-section/index-section";

import { ChannelDto, getTopNChannels } from "@/lib/api";

import ChannelSearchListItem from "@/components/channel-search-list-item/channel-search-list-item";

import styles from "@/styles/index.module.scss";

const TOPNCHANNEL = 5;

export default function Home() {
  const [hotList, setHotList] = useState<ChannelDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getTopNChannels(TOPNCHANNEL)
      .then((result) => setHotList(result.data))
      .catch((err) => {
        console.error("인기 채널 로드 실패", err);
        setHotList([]);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  // Skeleton 아이템 배열 미리 생성
  const skeletonItems = Array.from({ length: TOPNCHANNEL }, (_, idx) => (
    <ChannelSearchListItem
      isSkeleton
      publicId=""
      name=""
      createdAt=""
      participants={0}
      key={`skeleton-${idx}`}
    />
  ));

  // 실제 채널 리스트
  const channelItems = hotList.map((item, index) => (
    <ChannelSearchListItem
      {...item}
      className={styles[`top-n-channel-${(index % TOPNCHANNEL) + 1}`]}
      key={item.publicId}
    />
  ));

  return (
    <>
      <Header fixed border menu />
      <main className={`${styles["index"]} flex justify-center`}>
        <div className={`${styles["container"]}`}>
          <IndexSection title="인기 채널">
            <ul className="py-3 flex flex-col gap-y-2">
              {isLoading && skeletonItems}
              {!isLoading && channelItems.length > 0 && channelItems}
              {!isLoading && channelItems.length === 0 && (
                <li className="py-5 flex justify-center items-center text-muted-foreground text-sm">
                  인기 채널이 없습니다
                </li>
              )}
            </ul>
          </IndexSection>
        </div>
      </main>
    </>
  );
}
