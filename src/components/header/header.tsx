import { FunctionComponent } from "react";

import { Button } from "../ui/button";

import { ChevronRight } from "lucide-react";

import styles from "@/styles/header.module.scss";

const Header: FunctionComponent = () => {
  return (
    <header
      className={`w-full fixed top-0 left-0 z-[999] ${styles["header"]} flex justify-center`}
    >
      <div className={`${styles["container"]} flex`}>
        <div className={`${styles["left"]} grow flex items-center`}>left</div>
        <div
          className={`${styles["right"]} grow flex justify-end items-center`}
        >
          <Button variant="ghost" size="icon">
            <ChevronRight />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
