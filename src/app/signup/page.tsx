import Header from "@/components/header/header";

import styles from "@/styles/signup.module.scss";

export default function Signup() {
  return (
    <>
      <Header logoCenter />
      <main className={`${styles["signup"]} flex justify-center`}>
        <div className={`${styles["container"]} pt-3 text-white`}>
          <h1 className="text-4xl font-extrabold tracking-tight">Sign up</h1>
        </div>
      </main>
    </>
  );
}
