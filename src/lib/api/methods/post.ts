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

export function signup(request: SignupRequest): Promise<SignupResponse> {
  return fetcher<SignupResponse>(`/member`, {
    method: "post",
    body: JSON.stringify(request),
  });
}
