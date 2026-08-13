import { api } from "@/lib/api";
import { MentorRequest, MentorResponse } from "@/types/mentor";

class MentorService {
  async ask(data: MentorRequest): Promise<MentorResponse> {
    const response = await api.post<MentorResponse>("/career/mentor", data);
    return response.data;
  }
}

export const mentorService = new MentorService();
