import { fetcher } from "../fetcher";

export interface CheckDuplicate {
  code: number;
  message: string;
  data: {
    isDuplicate: boolean;
  };
}

export function checkNicknameDuplicate(
  nickname: string
): Promise<CheckDuplicate> {
  return fetcher<CheckDuplicate>(`/member/check/nickname?nickname=${nickname}`);
}

export function checkEmailDuplicate(email: string): Promise<CheckDuplicate> {
  return fetcher<CheckDuplicate>(`/member/check/email?email=${email}`);
}
