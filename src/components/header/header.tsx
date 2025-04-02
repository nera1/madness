import { FunctionComponent } from "react";

import LogoLink from "../logo/LogoLink";
import { DropdownMenu } from "./dropdown-menu";

import styles from "@/styles/header.module.scss";

const Header: FunctionComponent = () => {
  return (
    <header
      className={`w-full fixed top-0 left-0 z-[999] ${styles["header"]} flex justify-center backdrop-blur-md`}
    >
      <div className={`${styles["container"]} flex relative`}>
        <div className={`${styles["left"]} grow flex items-center`}>
          <LogoLink />
        </div>
        <div
          className={`${styles["right"]} grow flex justify-end items-center relative`}
        >
          <DropdownMenu />
        </div>
      </div>
    </header>
  );
};

export default Header;
