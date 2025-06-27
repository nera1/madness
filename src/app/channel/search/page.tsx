"use client";

import { ChangeEventHandler, useEffect, useState, useCallback } from "react";
import debounce from "lodash/debounce";

import Header from "@/components/header/header";
import InputField from "@/components/signup-field/input-field";
import ChannelListOrder from "@/components/channel-order/channel-order";
import ChannelSearchListItem from "@/components/channel-search-list-item/channel-search-list-item";
import { searchChannels, ChannelDto } from "@/lib/api";
import Spinner from "@/components/ui/spinner";

import styles from "@/styles/channel-search.module.scss";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";

type OrderType = "desc" | "asc" | "participants";

const PAGE_SIZE = 10;

export default function SearchChannel() {
  const [state, setState] = useState<{ search: string; order: OrderType }>({
    search: "",
    order: "desc",
  });
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const onChangeInputHandler: ChangeEventHandler<HTMLInputElement> = (e) =>
    setState((p) => ({ ...p, search: e.target.value }));
  const onOrderChange = (order: OrderType) =>
    setState((p) => ({ ...p, order }));

  const triggerSearch = useCallback(
    debounce((keyword: string, order: OrderType) => {
      if (!keyword) {
        setChannels([]);
        setCursor(undefined);
        setHasMore(false);
        return;
      }
      setIsLoading(true);
      searchChannels(keyword, undefined, PAGE_SIZE, order)
        .then((res) => {
          if (res.code === 0) {
            const data = res.data;
            setChannels(data);
            setCursor(
              data.length > 0 ? data[data.length - 1].publicId : undefined
            );
            setHasMore(data.length === PAGE_SIZE);
          }
        })
        .finally(() => setIsLoading(false));
    }, 500),
    []
  );

  useEffect(() => {
    triggerSearch(state.search, state.order);
    return () => {
      triggerSearch.cancel();
    };
  }, [state.search, state.order, triggerSearch]);

  const handleLoadMore = () => {
    if (isLoading || !hasMore || !state.search) return;
    setIsLoading(true);
    searchChannels(state.search, cursor, PAGE_SIZE, state.order)
      .then((res) => {
        if (res.code === 0) {
          const next = res.data;
          setChannels((prev) => [...prev, ...next]);
          setCursor(next.length > 0 ? next[next.length - 1].publicId : cursor);
          setHasMore(next.length === PAGE_SIZE);
        }
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <>
      <Header fixed border menu />
      <main className={`${styles["channel-search"]} flex justify-center pb-10`}>
        <div className={`${styles["container"]}`}>
          <h1 className="text-3xl font-semibold">Channel Search</h1>

          <form onSubmit={(e) => e.preventDefault()} className="mt-6 mb-1">
            <InputField
              id="search"
              label="Channel name"
              type="text"
              placeholder="채널 이름을 입력해 주세요"
              value={state.search}
              onChange={onChangeInputHandler}
              maxLength={254}
              isValid
            />
          </form>

          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold grow">
              {isLoading ? (
                <Spinner size={28} />
              ) : state.search ? (
                `"${state.search}" 검색결과`
              ) : null}
            </h3>
            <ChannelListOrder value={state.order} onChange={onOrderChange} />
          </div>

          <ul className="py-3 flex flex-col gap-y-2">
            {!isLoading && state.search && channels.length === 0 && (
              <li className="text-center text-muted-foreground text-sm py-10">
                검색 결과가 없습니다
              </li>
            )}
            {channels.map((ch) => (
              <ChannelSearchListItem key={ch.publicId} {...ch} />
            ))}
            {hasMore && (
              <li className="flex justify-center pt-4 w-full">
                <button onClick={handleLoadMore} disabled={isLoading}>
                  {isLoading ? (
                    <Spinner size={18} />
                  ) : (
                    <div className={`${styles["more-container"]}`}>
                      <div></div>
                      <Badge
                        variant="outline"
                        className={`${styles["more"]} cursor-pointer`}
                      >
                        More
                        <ChevronDown />
                      </Badge>
                    </div>
                  )}
                </button>
              </li>
            )}
          </ul>
        </div>
      </main>
    </>
  );
}
