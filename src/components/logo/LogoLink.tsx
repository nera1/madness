import Link from "next/link";
import TextLogo from "./TextLogo";

const LogoLink = () => {
  return (
    <Link href={"/"}>
      <TextLogo fill="#fff" />
    </Link>
  );
};

export default LogoLink;
