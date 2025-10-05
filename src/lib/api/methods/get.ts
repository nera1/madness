import { ApiResponse } from "../types/api-response";
import { fetcher } from "../fetcher";

export interface CheckDuplicateData {
  isDuplicate: boolean;
}

export interface MeResponseData {
  email: string;
  nickname: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChannelDto {
  publicId: string;
  name: string;
  createdAt: string;
  participants: number | string;
  memberCount?: number | string;
  snapAt?: string;
}

export interface ChannelInfo {
  publicId: string;
  name: string;
  creatorNickname: string;
  createdAt: string;
}

export interface SearchChannelParams {
  keyword: string;
  cursor?: string;
  size: number;
  order: "asc" | "desc" | "participants";
  count?: number;
  snapAt?: string;
}

export type SearchChannelsResponse = ApiResponse<ChannelDto[]>;
export type TopNChannelsResponse = ApiResponse<ChannelDto[]>;
export type TopNJoinedChannelsResponse = ApiResponse<ChannelDto[]>;
export type CheckDuplicate = ApiResponse<CheckDuplicateData>;
export type RefreshResponse = ApiResponse<null>;
export type MeResponse = ApiResponse<MeResponseData>;
export type SignoutRespone = ApiResponse<null>;
export type AuthCheckRespone = ApiResponse<null>;
export type ChannelInfoResponse = ApiResponse<ChannelInfo>;

export function getTopNChannels(topN: number): Promise<TopNChannelsResponse> {
  return fetcher<TopNChannelsResponse>(
    `/channel/top/participants?size=${topN}`,
    {
      cache: "no-store",
    }
  );
}

export function getTopNJoinedChannels(): Promise<TopNJoinedChannelsResponse> {
  return fetcher<TopNJoinedChannelsResponse>(`/channel/top/members?size=10`, {
    cache: "no-store",
  });
}

export function checkNicknameDuplicate(
  nickname: string
): Promise<CheckDuplicate> {
  return fetcher<CheckDuplicate>(`/member/check/nickname?nickname=${nickname}`);
}

export function checkEmailDuplicate(email: string): Promise<CheckDuplicate> {
  return fetcher<CheckDuplicate>(`/member/check/email?email=${email}`);
}

export function refresh(): Promise<RefreshResponse> {
  return fetcher<RefreshResponse>(`/auth/refresh`, { credentials: "include" });
}

export function getMe(): Promise<MeResponse> {
  return fetcher<MeResponse>(`/auth/me`, { credentials: "include" });
}

export function signOut(): Promise<SignoutRespone> {
  return fetcher<SignoutRespone>(`/auth/signout`, { credentials: "include" });
}

export function authCheck(): Promise<AuthCheckRespone> {
  return fetcher<AuthCheckRespone>(`/auth/check`, { credentials: "include" });
}

export function searchChannels(
  channelSerachParam: SearchChannelParams
): Promise<SearchChannelsResponse> {
  console.log(channelSerachParam);

  const params = new URLSearchParams();
  const { keyword, cursor, size, order, snapAt, count } = channelSerachParam;
  params.append("keyword", keyword);
  if (cursor) params.append("cursor", cursor);
  params.append("size", size.toString());
  params.append("order", order);

  if (order === "participants") {
    if (snapAt) {
      params.append("count", count?.toString() || "0");
      params.append("snapAt", snapAt);
    }
  }

  return fetcher<SearchChannelsResponse>(
    `/channel/search?${params.toString()}`
  );
}

export function checkChannelJoin(channelId: string): Promise<void> {
  return fetcher<void>(`/channel/${channelId}/members`, {
    credentials: "include",
    cache: "no-store",
  });
}

export function getChannelInfo(
  channelId: string
): Promise<ChannelInfoResponse> {
  return fetcher<ChannelInfoResponse>(`/channel/${channelId}`, {
    credentials: "include",
  });
}
