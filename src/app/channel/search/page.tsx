"use client";

import {
  ChangeEventHandler,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import debounce from "lodash/debounce";

import Header from "@/components/header/header";
import InputField from "@/components/signup-field/input-field";
import ChannelListOrder from "@/components/channel-order/channel-order";
import ChannelSearchListItem from "@/components/channel-search-list-item/channel-search-list-item";
import { searchChannels, ChannelDto } from "@/lib/api";
import Spinner from "@/components/ui/spinner";

import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

import styles from "@/styles/channel-search.module.scss";
import { Toaster } from "sonner";

type OrderType = "desc" | "asc" | "participants";

const PAGE_SIZE = 10;
const FETCH_SIZE = PAGE_SIZE + 1;

export default function SearchChannel() {
  const [state, setState] = useState<{ search: string; order: OrderType }>({
    search: "",
    order: "desc",
  });
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const bottomRef = useRef<HTMLLIElement>(null);

  const onChangeInputHandler: ChangeEventHandler<HTMLInputElement> = (e) =>
    setState((prev) => ({ ...prev, search: e.target.value }));
  const onOrderChange = (order: OrderType) =>
    setState((prev) => ({ ...prev, order }));

  const triggerSearch = useCallback(
    debounce((keyword: string, order: OrderType) => {
      if (!keyword) {
        setChannels([]);
        setCursor(undefined);
        setHasMore(false);
        return;
      }
      setIsLoading(true);
      searchChannels(keyword, undefined, FETCH_SIZE, order)
        .then((res) => {
          if (res.code === 0) {
            const data = res.data;
            const more = data.length > PAGE_SIZE;
            const items = data.slice(0, PAGE_SIZE);

            setChannels(items);
            setCursor(
              items.length > 0 ? items[items.length - 1].publicId : undefined
            );
            setHasMore(more);
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

  useEffect(() => {
    if (!isLoading && loadingMore && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "instant" });
      setLoadingMore(false);
    }
  }, [isLoading, loadingMore]);

  const handleLoadMore = () => {
    if (isLoading || !hasMore || !state.search) return;
    setLoadingMore(true);
    setIsLoading(true);
    searchChannels(state.search, cursor, FETCH_SIZE, state.order)
      .then((res) => {
        if (res.code === 0) {
          const data = res.data;
          const more = data.length > PAGE_SIZE;
          const items = data.slice(0, PAGE_SIZE);

          setChannels((prev) => [...prev, ...items]);
          setCursor(
            items.length > 0 ? items[items.length - 1].publicId : cursor
          );
          setHasMore(more);
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
              <ChannelSearchListItem
                key={ch.publicId}
                {...ch}
                disabled={isLoading}
              />
            ))}
            {hasMore && (
              <li
                className={`${styles["more"]} flex justify-center mt-6 w-full`}
              >
                <Button
                  className="w-full rounded-sm cursor-pointer"
                  onClick={handleLoadMore}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Spinner size={18} />
                  ) : (
                    <>
                      <ChevronDown /> more
                    </>
                  )}
                </Button>
              </li>
            )}
            <li ref={bottomRef} className="h-0" />
          </ul>
        </div>
      </main>
      <Toaster theme="dark" />
    </>
  );
}
