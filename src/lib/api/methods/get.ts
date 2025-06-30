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
}

export type SearchChannelsResponse = ApiResponse<ChannelDto[]>;
export type CheckDuplicate = ApiResponse<CheckDuplicateData>;
export type RefreshResponse = ApiResponse<null>;
export type MeResponse = ApiResponse<MeResponseData>;
export type SignoutRespone = ApiResponse<null>;
export type AuthCheckRespone = ApiResponse<null>;

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
  keyword: string,
  cursor?: string,
  size: number = 10,
  order: "asc" | "desc" | "participants" = "desc"
): Promise<SearchChannelsResponse> {
  const params = new URLSearchParams();
  params.append("keyword", keyword);
  if (cursor) params.append("cursor", cursor);
  params.append("size", size.toString());
  params.append("order", order);

  return fetcher<SearchChannelsResponse>(
    `/channel/search?${params.toString()}`
  );
}

export function checkChannelJoin(channelId: string): Promise<void> {
  return fetcher<void>(`/channel/${channelId}/members`, {
    credentials: "include",
  });
}
