import { FunctionComponent } from "react";

import styles from "@/styles/header.module.scss";

const Header: FunctionComponent = () => {
  return (
    <header
      className={`bg-neutral-900 border-b border-neutral-800 w-full py-5 ${styles["headers"]} flex justify-center`}
    >
      <div className="text-neutral-50">Madness</div>
    </header>
  );
};

export default Header;
