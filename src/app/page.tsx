"use client";

import { useEffect, useState } from "react";

import Header from "@/components/header/header";
import IndexSection from "@/components/index-section/index-section";

import { ChannelDto, getTopNChannels } from "@/lib/api";

import styles from "@/styles/index.module.scss";
import ChannelSearchListItem from "@/components/channel-search-list-item/channel-search-list-item";

export default function Home() {
  const [hotList, setHotList] = useState<ChannelDto[]>([]);
  useEffect(() => {
    getTopNChannels(5).then((result) => setHotList(result.data));
  }, []);
  return (
    <>
      <Header fixed border menu />
      <main className={`${styles["index"]} flex justify-center`}>
        <div className={`${styles["container"]}`}>
          <IndexSection title="인기 채널">
            <ul className="py-3 flex flex-col gap-y-2">
              {hotList.map((item, index) => (
                <ChannelSearchListItem {...item} key={item.publicId + index} />
              ))}
            </ul>
          </IndexSection>
        </div>
      </main>
    </>
  );
}
