"use client";

import React from "react";
import dynamic from "next/dynamic";
import ChannelContentDev from "@/components/channel-content/channel-content";
import Spinner from "@/components/ui/spinner";

const ChannelContent =
  process.env.NODE_ENV === "development"
    ? ChannelContentDev
    : dynamic(() => import("@/components/channel-content/channel-content"), {
        ssr: false,
        loading: () => (
          <div className="w-full h-full flex justify-center align-center">
            <Spinner />
          </div>
        ),
      });

export default function ChannelPage() {
  return <ChannelContent />;
}
