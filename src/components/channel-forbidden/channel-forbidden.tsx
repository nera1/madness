import { FunctionComponent } from "react";

import styles from "@/styles/channel-forbidden.module.scss";

interface ChannelForbidden {}

const ChannelForbidden: FunctionComponent = () => {
  return (
    <>
      <main
        className={`${styles["channel-forbidden"]} w-full flex justify-center`}
      >
        <div className={`${styles["container"]} flex flex-col justify-center`}>
          안녕?
        </div>
      </main>
    </>
  );
};

export default ChannelForbidden;
