"use client";

import { ChangeEventHandler, FormEvent, useEffect, useState } from "react";

import Header from "@/components/header/header";
import InputField from "@/components/signup-field/input-field";

import ChannelListOrder from "@/components/channel-order/channel-order";

import styles from "@/styles/channel-search.module.scss";

type OrderType = "desc" | "asc" | "participants";

interface SearchChannelState {
  search: string;
  order: OrderType;
}

export default function SearchChannel() {
  const [state, setState] = useState<SearchChannelState>({
    search: "",
    order: "desc",
  });

  const onChangeInputHandler: ChangeEventHandler<HTMLInputElement> = (
    event
  ) => {
    setState((prev) => ({ ...prev, search: event.target.value }));
  };

  const onOrderChange = (value: OrderType) => {
    setState((prev) => ({ ...prev, order: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("검색어:", state.search, "정렬:", state.order);
  };

  useEffect(() => {
    console.log(state);
  }, [state]);

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
          <form
            onSubmit={handleSubmit}
            className="mt-6 mb-1 flex flex-col gap-y-4"
          >
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
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold tracking-tight">
              {state.search ? `"${state.search}" 검색결과` : ""}
            </h3>
            <ChannelListOrder value={state.order} onChange={onOrderChange} />
          </div>
          <ul></ul>
        </div>
      </main>
    </>
  );
}
