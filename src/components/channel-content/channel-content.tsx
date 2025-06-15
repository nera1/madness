"use client";

import { FunctionComponent, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import ChannelHeader from "@/components/channel-header/channel-header";

const ChannelContent: FunctionComponent = () => {
  const searchParams = useSearchParams();
  useEffect(() => {
    console.log("c:", searchParams.get("c"));
  }, [searchParams]);
  return (
    <>
      <ChannelHeader />
      <main></main>
    </>
  );
};

export default ChannelContent;
