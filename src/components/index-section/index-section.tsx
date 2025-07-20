import { FunctionComponent, ReactNode } from "react";

import styles from "@/styles/index-section.module.scss";

interface IndexSectionProps {
  title?: string;
  children?: ReactNode;
}

const IndexSection: FunctionComponent<IndexSectionProps> = ({
  title,
  children,
}) => {
  return (
    <section className={`${styles["index-section"]}`}>
      <h4
        className={`${styles["title"]} scroll-m-20 text-md font-semibold tracking-tight`}
      >
        {title}
      </h4>
      <div className={`${styles["content"]}`}>{children}</div>
    </section>
  );
};

export default IndexSection;
