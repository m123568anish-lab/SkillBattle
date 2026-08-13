import { api } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api-constants";

export interface FriendResponse {
  user_id: string;
  created_at: string;
}

export interface FriendListResponse {
  friends: FriendResponse[];
}

class FriendService {
  async listFriends() {
    const response = await api.get<FriendListResponse>(API_ENDPOINTS.FRIEND.LIST);
    return response.data;
  }

  async addFriend(friendId: string) {
    const response = await api.post<FriendResponse>(API_ENDPOINTS.FRIEND.ADD, { friend_id: friendId });
    return response.data;
  }
}

export const friendService = new FriendService();
export default friendService;
