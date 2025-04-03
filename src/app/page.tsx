import Header from "@/components/header/header";
import styles from "@/styles/index.module.scss";

export default function Home() {
  return (
    <>
      <Header fixed border menu />
      <main className={`${styles["index"]} flex justify-center`}>
        <div className={`${styles["container"]}`}>
          <h1 className="text-white">안녕하세요</h1>
          <h1 className="text-white">안녕하세요</h1>
          <h1 className="text-white">안녕하세요</h1>
          <h1 className="text-white">안녕하세요</h1>
          <h1 className="text-white">안녕하세요</h1>
          <h1 className="text-white">안녕하세요</h1>
          <h1 className="text-white">안녕하세요</h1>
          <h1 className="text-white">안녕하세요</h1>
          <h1 className="text-white">안녕하세요</h1>
          <h1 className="text-white">안녕하세요</h1>
        </div>
      </main>
    </>
  );
}
