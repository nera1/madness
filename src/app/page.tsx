"use client";

import { useEffect, useState } from "react";

import { Toaster } from "sonner";
import millify from "millify";

import Header from "@/components/header/header";
import IndexSection from "@/components/index-section/index-section";

import { ChannelDto, getTopNChannels, getTopNJoinedChannels } from "@/lib/api";

import ChannelSearchListItem from "@/components/channel-search-list-item/channel-search-list-item";

import styles from "@/styles/index.module.scss";

const TOPNCHANNEL = 5;

export default function Home() {
  const [hotList, setHotList] = useState<ChannelDto[]>([]);
  const [famousList, setFamousList] = useState<ChannelDto[]>([]);
  const [isHotListLoading, setIsHotListLoading] = useState(true);
  const [isFamousListLoading, setIsFamousListLoading] = useState(true);

  useEffect(() => {
    getTopNChannels(TOPNCHANNEL)
      .then((result) => setHotList(result.data))
      .catch((err) => {
        console.error("실시간 인기 채널 로드 실패", err);
        setHotList([]);
      })
      .finally(() => {
        setIsHotListLoading(false);
      });

    getTopNJoinedChannels(TOPNCHANNEL)
      .then((result) => setFamousList(result.data))
      .catch((err) => {
        console.error("인기 채널 로드 실패", err);
        setFamousList([]);
      })
      .finally(() => {
        setIsFamousListLoading(false);
      });
  }, []);

  useEffect(() => {
    console.log("famousList length", famousList.length, famousList);
  }, [famousList]);

  const skeletonItems = Array.from({ length: TOPNCHANNEL }, (_, idx) => (
    <ChannelSearchListItem
      isSkeleton
      publicId=""
      name=""
      createdAt=""
      participants={0}
      key={`skeleton-${idx}-${_}`}
    />
  ));

  const topParticipantChannelItems = hotList.map((item) => (
    <ChannelSearchListItem
      {...item}
      participants={`${millify(item.participants as number, {
        units: [""],
        precision: 0,
      })}명 접속 중`}
      className={styles[`top-n-participants-channel`]}
      key={item.publicId}
    />
  ));

  const topJoinedChannelItems = famousList.map((item) => (
    <ChannelSearchListItem
      {...item}
      participants={`참여자 ${millify(item.memberCount as number, {
        units: [""],
        precision: 0,
      })}명`}
      className={styles[`top-n-joined-channel`]}
      key={item.publicId}
    />
  ));

  return (
    <>
      <Header fixed border menu />
      <main className={`${styles["index"]} flex justify-center`}>
        <div className={`${styles["container"]} flex flex-col gap-y-6`}>
          <IndexSection title="실시간 인기 채널">
            <ul className="py-3 flex flex-col gap-y-2">
              {isHotListLoading && skeletonItems}
              {!isHotListLoading &&
                topParticipantChannelItems.length > 0 &&
                topParticipantChannelItems}
              {!isHotListLoading && topParticipantChannelItems.length === 0 && (
                <li className="py-5 flex justify-center items-center text-muted-foreground text-sm">
                  인기 채널이 없습니다
                </li>
              )}
            </ul>
          </IndexSection>
          <IndexSection title="참여자 많은 채널">
            <ul className="py-3 flex flex-col gap-y-2">
              {isFamousListLoading && skeletonItems}
              {!isFamousListLoading &&
                topJoinedChannelItems.length > 0 &&
                topJoinedChannelItems}
              {!isFamousListLoading && topJoinedChannelItems.length === 0 && (
                <li className="py-5 flex justify-center items-center text-muted-foreground text-sm">
                  채널이 없습니다
                </li>
              )}
            </ul>
          </IndexSection>
        </div>
      </main>
      <Toaster theme="dark" />
    </>
  );
}
