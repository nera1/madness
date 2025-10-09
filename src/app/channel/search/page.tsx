"use client";

import {
  ChangeEventHandler,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import debounce from "lodash/debounce";

import { Toaster } from "sonner";

import Header from "@/components/header/header";
import InputField from "@/components/signup-field/input-field";
import ChannelListOrder from "@/components/channel-order/channel-order";
import ChannelSearchListItem from "@/components/channel-search-list-item/channel-search-list-item";
import { searchChannels, ChannelDto, SearchChannelParams } from "@/lib/api";
import Spinner from "@/components/ui/spinner";

import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

import styles from "@/styles/channel-search.module.scss";
import millify from "millify";

/** ===== 인터페이스 & 타입 ===== */
type OrderType = "desc" | "asc" | "participants";

interface SearchUIState {
  search: string;
  order: OrderType;
}

interface PageMeta {
  /** participants 정렬 시 고정할 스냅샷 분(서버 응답 값 그대로 사용) */
  snapAt?: string;
  /** 표시된 마지막 아이템의 참가자 수(= liveCount) */
  lastCount?: number;
  /** 표시된 마지막 아이템의 publicId (동점 정렬 보조키) */
  lastPublicId?: string;
}

const PAGE_SIZE = 1;
const FETCH_SIZE = PAGE_SIZE + 1;

/** key 생성을 통일 */
const makeKey = (ch: Pick<ChannelDto, "publicId" | "snapAt">) =>
  `${ch.publicId}_${String(ch.snapAt)}`;

export default function SearchChannel() {
  /** ===== state ===== */
  const [state, setState] = useState<SearchUIState>({
    search: "",
    order: "desc",
  });
  const [channels, setChannels] = useState<ChannelDto[]>([]);
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageMeta, setPageMeta] = useState<PageMeta>({});

  const bottomRef = useRef<HTMLLIElement>(null);

  const onChangeInputHandler: ChangeEventHandler<HTMLInputElement> = (e) =>
    setState((prev) => ({ ...prev, search: e.target.value }));
  const onOrderChange = (order: OrderType) =>
    setState((prev) => ({ ...prev, order }));

  /** ===== 초기 검색 트리거 ===== */
  const triggerSearch = useCallback(
    debounce((keyword: string, order: OrderType) => {
      if (!keyword) {
        setChannels([]);
        setCursor(undefined);
        setHasMore(false);
        setPageMeta({});
        return;
      }
      setIsLoading(true);

      const params: SearchChannelParams = {
        keyword,
        cursor: undefined,
        size: FETCH_SIZE,
        order,
      };

      searchChannels(params)
        .then((res) => {
          if (res.code === 0) {
            const data: ChannelDto[] = res.data;
            const more = data.length > PAGE_SIZE;
            const items = data.slice(0, PAGE_SIZE);

            setChannels(items);

            setCursor(items[items.length - 1]?.publicId);
            setHasMore(more);

            if (order === "participants" && items.length > 0) {
              const firstSnapAt = String(data[0]?.snapAt ?? items[0]?.snapAt);
              const lastShown = items[items.length - 1];
              setPageMeta({
                snapAt: firstSnapAt,
                lastCount: Number(
                  (lastShown as any).participants ??
                    (lastShown as any).liveCount ??
                    0
                ),
                lastPublicId: lastShown.publicId,
              });
            } else {
              setPageMeta({});
            }
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
      bottomRef.current.scrollIntoView({
        behavior: "instant" as ScrollBehavior,
      });
      setLoadingMore(false);
    }
  }, [isLoading, loadingMore]);

  /** ===== 더보기 ===== */
  const handleLoadMore = () => {
    if (isLoading || !hasMore || !state.search) return;
    setLoadingMore(true);
    setIsLoading(true);

    const lastShown = channels[channels.length - 1];

    const params: SearchChannelParams = {
      keyword: state.search,
      cursor: lastShown?.publicId ?? cursor, // 안전하게 표시된 마지막 기준
      size: FETCH_SIZE,
      order: state.order,
    };

    if (state.order === "participants" && lastShown) {
      // ✅ ISO 재포맷 금지: 서버가 준 snapAt 문자열 그대로 사용
      params.count = Number(
        (lastShown as any).participants ?? (lastShown as any).liveCount ?? 0
      );
      params.snapAt = pageMeta.snapAt ?? String(lastShown.snapAt);
    }

    searchChannels(params)
      .then((res) => {
        if (res.code === 0) {
          const data: ChannelDto[] = res.data;
          const more = data.length > PAGE_SIZE;
          const items = data.slice(0, PAGE_SIZE);

          // 중복 방지 가드 (id+snapAt 쌍으로 판별)
          setChannels((prev) => {
            const seen = new Set(prev.map(makeKey));
            const dedup = items.filter((it) => !seen.has(makeKey(it)));

            if (dedup.length === 0) {
              setHasMore(false);
            }

            return [...prev, ...dedup];
          });

          const appendedLast = items[items.length - 1];
          setCursor(appendedLast?.publicId);

          if (state.order === "participants" && appendedLast) {
            setPageMeta((old) => ({
              snapAt:
                old.snapAt ?? String(data[0]?.snapAt ?? appendedLast.snapAt),
              lastCount: Number(
                (appendedLast as any).participants ??
                  (appendedLast as any).liveCount ??
                  0
              ),
              lastPublicId: appendedLast.publicId,
            }));
          }
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
                <div className="flex justify-center items-center">
                  <Spinner size={28} />
                </div>
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
                key={makeKey(ch)}
                {...ch}
                participants={`${millify(ch.participants as number, {
                  units: [""],
                  precision: 0,
                })}명 접속 중`}
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
