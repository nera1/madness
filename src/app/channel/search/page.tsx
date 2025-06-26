"use client";

import {
  ChangeEventHandler,
  FormEvent,
  useEffect,
  useState,
  useCallback,
} from "react";
import debounce from "lodash/debounce";

import Header from "@/components/header/header";
import InputField from "@/components/signup-field/input-field";
import ChannelListOrder from "@/components/channel-order/channel-order";

import { searchChannels, ChannelDto } from "@/lib/api";

import Spinner from "@/components/ui/spinner";

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
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const onChangeInputHandler: ChangeEventHandler<HTMLInputElement> = (e) => {
    setState((prev) => ({ ...prev, search: e.target.value }));
  };
  const onOrderChange = (value: OrderType) => {
    setState((prev) => ({ ...prev, order: value }));
  };
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    triggerSearch(state.search, state.order);
  };

  const triggerSearch = useCallback(
    debounce((keyword: string, order: OrderType) => {
      if (!keyword) {
        setChannels([]);
        return;
      }
      setIsLoading(true);
      searchChannels(keyword, undefined, 10, order)
        .then((res) => {
          if (res.code === 0) {
            setChannels(res.data);
          } else {
            console.error("search failed:", res);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, 500),
    []
  );

  useEffect(() => {
    triggerSearch(state.search, state.order);
    return () => {
      triggerSearch.cancel();
    };
  }, [state.search, state.order, triggerSearch]);

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
            <h3 className="text-lg font-semibold tracking-tight grow">
              {isLoading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Spinner size={28} />
                </div>
              ) : state.search ? (
                `"${state.search}" 검색결과`
              ) : null}
            </h3>
            <ChannelListOrder value={state.order} onChange={onOrderChange} />
          </div>

          <ul>
            {channels.map((ch) => (
              <li key={ch.publicId} className="py-2 border-b">
                <h4 className="font-medium">{ch.name}</h4>
                <p className="text-sm text-gray-500">
                  생성일: {new Date(ch.createdAt).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
