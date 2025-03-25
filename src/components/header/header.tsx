import { FunctionComponent } from "react";

import { Button } from "../ui/button";

import { Menu } from "lucide-react";

import styles from "@/styles/header.module.scss";
import LogoLink from "../logo/LogoLink";

const Header: FunctionComponent = () => {
  return (
    <header
      className={`w-full fixed top-0 left-0 z-[999] ${styles["header"]} flex justify-center`}
    >
      <div className={`${styles["container"]} flex`}>
        <div className={`${styles["left"]} grow flex items-center`}>
          <LogoLink />
        </div>
        <div
          className={`${styles["right"]} grow flex justify-end items-center`}
        >
          <Button
            variant="ghost"
            size="icon"
            className={`${styles["menu-btn"]}`}
          >
            <Menu color="#fff" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
