"use client";

import React, { ComponentType } from "react";
import dynamic from "next/dynamic";

let ChannelContent: ComponentType<any>;

if (process.env.NODE_ENV === "development") {
  ChannelContent =
    require("@/components/channel-content/channel-content").default;
} else {
  ChannelContent = dynamic(
    () => import("@/components/channel-content/channel-content"),
    {
      ssr: false,
      loading: () => <div>Loading…</div>,
    }
  );
}

export default function ChannelPage() {
  return <ChannelContent />;
}
