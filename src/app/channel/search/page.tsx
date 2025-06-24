"use client";

import {
  ChangeEventHandler,
  FunctionComponent,
  useEffect,
  useState,
} from "react";

import Header from "@/components/header/header";
import InputField from "@/components/signup-field/input-field";

import styles from "@/styles/channel-search.module.scss";

interface SearchChannelState {
  search: string;
}

export default function SearchChannel() {
  const [state, setState] = useState<SearchChannelState>({ search: "" });
  useEffect(() => {}, []);
  const onChangeInputHandler: ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    setState((prev) => ({ ...prev, search: event.target.value }));
  };

  return (
    <>
      <Header fixed border menu />
      <main
        className={`${styles["channel-search"]} flex justify-center box-border`}
      >
        <div className={`${styles["container"]}`}>
          <h1 className="text-3xl font-semibold tracking-tight">
            Channel Search
          </h1>
          <form onSubmit={() => {}} className="mt-6 flex flex-col gap-y-4">
            <InputField
              id="search"
              label="Channel name"
              type="text"
              placeholder="채널 이름을 입력해 주세요"
              value={state.search}
              onChange={onChangeInputHandler}
              maxLength={254}
              isValid={true}
            />
          </form>
          <ul></ul>
        </div>
      </main>
    </>
  );
}
