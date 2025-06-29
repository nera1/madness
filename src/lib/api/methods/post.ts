import { fetcher } from "../fetcher";
import { ApiResponse } from "../types/api-response";

export interface SignupRequest {
  email: string;
  nickname: string;
  password: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface SignupResponseData {
  email: string;
  nickname: string;
}

export interface CreateChannelRequest {
  name: string;
}

export interface CreateChannelData {
  publicId: string;
  name: string;
  creatorNickname: string;
  createdAt: string;
}

export interface JoinChannelRequest {
  publicChannelId: string;
  password: string;
}

export interface JoinChannelData {
  publicChannelId: string;
  joinAt: string;
}

export type SignupResponse = ApiResponse<SignupResponseData>;
export type SigninResponse = ApiResponse<SignupResponseData>;
export type CreateChannelResponse = ApiResponse<CreateChannelData>;
export type JoinChannelResponse = ApiResponse<JoinChannelData>;

export function signup(request: SignupRequest): Promise<SignupResponse> {
  return fetcher<SignupResponse>(`/member`, {
    method: "post",
    body: JSON.stringify(request),
  });
}

export function signin(request: SigninRequest): Promise<SigninResponse> {
  return fetcher<SigninResponse>(`/auth/signin`, {
    method: "post",
    body: JSON.stringify(request),
    credentials: "include",
  });
}

export function createChannel(
  request: CreateChannelRequest
): Promise<CreateChannelResponse> {
  return fetcher<CreateChannelResponse>(`/channel`, {
    method: "post",
    body: JSON.stringify(request),
    credentials: "include",
  });
}

export function joinChannel(
  request: JoinChannelRequest
): Promise<JoinChannelResponse> {
  return fetcher<JoinChannelResponse>(`/channel/join`, {
    method: "post",
    body: JSON.stringify(request),
    credentials: "include",
  });
}
