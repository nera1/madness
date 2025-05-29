import { fetcher } from "../fetcher";

export interface SignupRequest {
  email: string;
  nickname: string;
  password: string;
}

export interface SignupResponse {
  email: string;
  nickname: string;
}

export interface SigninRequest {
  email: string;
  password: string;
}

export interface SigninResponse {
  email: string;
  password: string;
}

export function signup(request: SignupRequest): Promise<SignupResponse> {
  return fetcher<SignupResponse>(`/member`, {
    method: "post",
    body: JSON.stringify(request),
  });
}

export function signin(request: SigninRequest): Promise<SignupResponse> {
  return fetcher<SignupResponse>(`/auth/signin`, {
    method: "post",
    body: JSON.stringify(request),
  });
}
