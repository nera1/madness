"use client";

import { FunctionComponent, useEffect } from "react";
import { useSearchParams } from "next/navigation";

const ChannelHeader: FunctionComponent = () => {
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

export default ChannelHeader;
