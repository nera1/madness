import dynamic from "next/dynamic";

const ChannelContent = dynamic(
  () => import("@/components/channel-content/channel-content"),
  { ssr: false }
);

export default function Channel() {
  return (
    <>
      <ChannelContent />
    </>
  );
}
