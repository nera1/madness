import { ApiResponse } from "../types/api-response";
import { fetcher } from "../fetcher";

export type ChannelLeaveResponse = ApiResponse<null>;

export function leaveChannel(channelId: string): Promise<ChannelLeaveResponse> {
  return fetcher<ChannelLeaveResponse>(`/channel/leave/${channelId}`, {
    credentials: "include",
    method: "delete",
  });
}
