import { FunctionComponent } from "react";

import LogoLink from "../logo/LogoLink";
import { DropdownMenu } from "./dropdown-menu";

import styles from "@/styles/header.module.scss";

interface HeaderProps {
  fixed?: boolean;
  border?: boolean;
  menu?: boolean;
  logoCenter?: boolean;
}

const Header: FunctionComponent<HeaderProps> = ({
  fixed,
  border,
  menu,
  logoCenter,
}) => {
  return (
    <header
      className={`w-full ${fixed ? "fixed" : ""} ${
        border ? styles["border"] : ""
      } top-0 left-0 z-[999] ${
        styles["header"]
      } flex justify-center backdrop-blur-md`}
    >
      <div className={`${styles["container"]} flex relative`}>
        <div
          className={`${styles["left"]} grow flex items-center ${
            logoCenter ? "justify-center" : ""
          }`}
        >
          <LogoLink />
        </div>
        <div
          className={`${styles["right"]} ${
            logoCenter ? styles["logo-center"] : ""
          } grow flex justify-end items-center relative`}
        >
          {menu ? <DropdownMenu /> : <></>}
        </div>
      </div>
    </header>
  );
};

export default Header;
