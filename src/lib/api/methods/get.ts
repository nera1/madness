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

export type CheckDuplicate = ApiResponse<CheckDuplicateData>;
export type RefreshResponse = ApiResponse<null>;
export type MeResponse = ApiResponse<MeResponseData>;

export function checkNicknameDuplicate(
  nickname: string
): Promise<CheckDuplicate> {
  return fetcher<CheckDuplicate>(`/member/check/nickname?nickname=${nickname}`);
}

export function checkEmailDuplicate(email: string): Promise<CheckDuplicate> {
  return fetcher<CheckDuplicate>(`/member/check/email?email=${email}`);
}

export function refresh(): Promise<RefreshResponse> {
  return fetcher<RefreshResponse>(`/auth/refresh`);
}

export function getMe(): Promise<MeResponse> {
  return fetcher<MeResponse>(`/auth/me`);
}
